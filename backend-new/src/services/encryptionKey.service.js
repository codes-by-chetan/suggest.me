import EncryptionKey from "../models/encryptionKey.model.js";
import Chat from "../models/chat.model.js";
import UserKey from "../models/userKey.model.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import crypto from "crypto";
import { io } from "../index.js";
import logger from "../config/logger.config.js";

// Fetch user's private key from key store (with caching hook)
const getUserPrivateKey = async (userId) => {
    try {
        // TODO: Add Redis caching (e.g., redis.get(`privateKey:${userId}`))
        const userKey = await UserKey.findOne({ user: userId, isActive: true });
        if (!userKey || !userKey.privateKey) {
            logger.logMessage("error", `Private key not found for user ${userId}`);
            throw new ApiError(httpStatus.NOT_FOUND, "Private key not found for user");
        }
        // TODO: Cache private key (e.g., redis.set(`privateKey:${userId}`, userKey.privateKey))
        return Buffer.from(userKey.privateKey, "base64");
    } catch (error) {
        logger.logMessage("error", `Error fetching private key for user ${userId}: ${error.message}`);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch private key");
    }
};

// Fetch user's public key (for key rotation)
const getUserPublicKey = async (userId) => {
    try {
        const userKey = await UserKey.findOne({ user: userId, isActive: true });
        if (!userKey || !userKey.publicKey) {
            throw new ApiError(httpStatus.NOT_FOUND, `Public key not found for user ${userId}`);
        }
        return Buffer.from(userKey.publicKey, "base64");
    } catch (error) {
        logger.logMessage("error", `Error fetching public key for user ${userId}: ${error.message}`);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch public key");
    }
};

// Create encryption keys for a chat
const createKeysForChat = async (chatId, participantIds, encryptedKeys, createdBy) => {
    try {
        if (participantIds.length !== encryptedKeys.length) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Number of participants and keys must match");
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new ApiError(httpStatus.NOT_FOUND, "Chat not found");
        }

        return await EncryptionKey.createKeysForChat(chatId, participantIds, encryptedKeys, createdBy);
    } catch (error) {
        logger.logMessage("error", `Failed to create keys for chat ${chatId}: ${error.message}`);
        throw error instanceof ApiError ? error : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create encryption keys");
    }
};

// Rotate symmetric key for a chat (for forward secrecy)
const rotateSymmetricKey = async (chatId, updatedBy) => {
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new ApiError(httpStatus.NOT_FOUND, "Chat not found");
        }

        // Generate new symmetric key
        const newSymmetricKey = crypto.randomBytes(32);

        // Encrypt new key for all participants
        const encryptedKeys = await Promise.all(
            chat.participants.map(async (userId) => {
                const publicKey = await getUserPublicKey(userId);
                return crypto.publicEncrypt(publicKey, newSymmetricKey).toString("base64");
            })
        );

        // Deactivate old keys
        await EncryptionKey.updateMany(
            { chat: chatId, isActive: true },
            { isActive: false, updatedBy }
        );

        // Store new keys
        await createKeysForChat(chatId, chat.participants, encryptedKeys, updatedBy);

        // Emit key rotation event
        io.to(chatId.toString()).emit("keyRotated", { chatId });

        logger.logMessage("info", `Symmetric key rotated for chat ${chatId}`);
        return true;
    } catch (error) {
        logger.logMessage("error", `Failed to rotate key for chat ${chatId}: ${error.message}`);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to rotate symmetric key");
    }
};

// Deactivate encryption key for a user in a chat
const deactivateKey = async (chatId, userId, updatedBy) => {
    try {
        const keyEntry = await EncryptionKey.findByChatAndUser(chatId, userId);
        if (!keyEntry) {
            throw new ApiError(httpStatus.NOT_FOUND, "Encryption key not found for this user and chat");
        }

        keyEntry.isActive = false;
        keyEntry.updatedBy = updatedBy;
        await keyEntry.save();

        logger.logMessage("info", `Deactivated key for user ${userId} in chat ${chatId}`);
        return keyEntry;
    } catch (error) {
        logger.logMessage("error", `Failed to deactivate key for chat ${chatId}, user ${userId}: ${error.message}`);
        throw error instanceof ApiError ? error : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to deactivate key");
    }
};

// Get encryption key for a user and chat
const getKeyForChatAndUser = async (chatId, userId) => {
    try {
        const keyEntry = await EncryptionKey.findByChatAndUser(chatId, userId);
        if (!keyEntry) {
            throw new ApiError(httpStatus.FORBIDDEN, "Encryption key not found for this user and chat");
        }
        return keyEntry;
    } catch (error) {
        logger.logMessage("error", `Failed to fetch key for chat ${chatId}, user ${userId}: ${error.message}`);
        throw error instanceof ApiError ? error : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch encryption key");
    }
};

// Get symmetric key for a chat (decrypts the key for the user)
const getSymmetricKeyForChat = async (chatId, userId) => {
    try {
        const keyEntry = await getKeyForChatAndUser(chatId, userId);
        const privateKey = await getUserPrivateKey(userId);
        const symmetricKey = crypto.privateDecrypt(
            privateKey,
            Buffer.from(keyEntry.key, "base64")
        );
        return symmetricKey;
    } catch (error) {
        logger.logMessage("error", `Failed to decrypt symmetric key for chat ${chatId}, user ${userId}: ${error.message}`);
        throw error instanceof ApiError ? error : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to decrypt symmetric key");
    }
};

// Add encryption key for a user in a chat
const addKeyForUser = async (chatId, userId, encryptedKey, createdBy) => {
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new ApiError(httpStatus.NOT_FOUND, "Chat not found");
        }

        const existingKey = await EncryptionKey.findByChatAndUser(chatId, userId);
        if (existingKey) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Encryption key already exists for this user and chat");
        }

        return await EncryptionKey.create({
            chat: chatId,
            user: userId,
            key: encryptedKey,
            createdBy,
            updatedBy: createdBy,
        });
    } catch (error) {
        logger.logMessage("error", `Failed to add key for chat ${chatId}, user ${userId}: ${error.message}`);
        throw error instanceof ApiError ? error : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to add encryption key");
    }
};

// Remove encryption key for a user in a chat (soft delete)
const removeKeyForUser = async (chatId, userId, updatedBy) => {
    try {
        const keyEntry = await EncryptionKey.findByChatAndUser(chatId, userId);
        if (!keyEntry) {
            throw new ApiError(httpStatus.NOT_FOUND, "Encryption key not found for this user and chat");
        }

        keyEntry.isActive = false;
        keyEntry.updatedBy = updatedBy;
        await keyEntry.save();

        logger.logMessage("info", `Removed key for user ${userId} in chat ${chatId}`);
        return keyEntry;
    } catch (error) {
        logger.logMessage("error", `Failed to remove key for chat ${chatId}, user ${userId}: ${error.message}`);
        throw error instanceof ApiError ? error : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to remove encryption key");
    }
};

const encryptionKeyService = {
    createKeysForChat,
    rotateSymmetricKey,
    deactivateKey,
    getKeyForChatAndUser,
    getSymmetricKeyForChat,
    addKeyForUser,
    removeKeyForUser,
};

export default encryptionKeyService;