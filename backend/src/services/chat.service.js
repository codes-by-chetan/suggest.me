import Chat from "../models/chat.model.js";
import EncryptionKeyService from "./encryptionKey.service.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import crypto from "crypto";
import { io } from "../index.js";
import logger from "../config/logger.config.js";
import UserKey from "../models/userKey.model.js";
import sanitizeHtml from "sanitize-html"; // For input sanitization

// Utility to generate a symmetric key (AES-256)
const generateSymmetricKey = () => crypto.randomBytes(32);

// Fetch user's public key from key store (with caching hook)
const getUserPublicKey = async (userId) => {
    try {
        // TODO: Add Redis caching (e.g., redis.get(`publicKey:${userId}`))
        const userKey = await UserKey.findOne({ user: userId, isActive: true });
        if (!userKey || !userKey.publicKey) {
            logger.logMessage("error", `Public key not found for user ${userId}`);
            throw new ApiError(httpStatus.NOT_FOUND, "Public key not found for user");
        }
        // TODO: Cache public key (e.g., redis.set(`publicKey:${userId}`, userKey.publicKey))
        return Buffer.from(userKey.publicKey, "base64");
    } catch (error) {
        logger.logMessage("error", `Error fetching public key for user ${userId}: ${error.message}`);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch public key");
    }
};

// Socket event to emit new chat creation
const emitNewChat = async (io, chat) => {
    try {
        chat.participants.forEach((userId) => {
            io.to(userId.toString()).emit("newChat", { chatId: chat._id, chatType: chat.chatType });
        });
    } catch (error) {
        logger.logMessage("error", `Failed to emit newChat for chat ${chat._id}: ${error.message}`);
    }
};

// Socket event for adding a participant
const emitParticipantAdded = async (io, chatId, userId) => {
    try {
        io.to(chatId.toString()).emit("participantAdded", { chatId, userId });
    } catch (error) {
        logger.logMessage("error", `Failed to emit participantAdded for chat ${chatId}: ${error.message}`);
    }
};

// Socket event for removing a participant
const emitParticipantRemoved = async (io, chatId, userId) => {
    try {
        io.to(chatId.toString()).emit("participantRemoved", { chatId, userId });
    } catch (error) {
        logger.logMessage("error", `Failed to emit participantRemoved for chat ${chatId}: ${error.message}`);
    }
};

// Create a private chat between two users
const createPrivateChat = async (userId1, userId2, createdBy) => {
    try {
        if (userId1.toString() === userId2.toString()) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Cannot create a chat with the same user");
        }

        // Check if a private chat already exists
        const existingChat = await Chat.findOne({
            chatType: "private",
            participants: { $all: [userId1, userId2], $size: 2 },
            deleted: false,
        });

        if (existingChat) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Private chat already exists");
        }

        // Generate symmetric key
        const symmetricKey = generateSymmetricKey();

        // Create the chat
        const chat = await Chat.createPrivateChat(userId1, userId2, createdBy);

        // Encrypt symmetric key for each participant
        const participants = [userId1, userId2];
        const encryptedKeys = await Promise.all(
            participants.map(async (userId) => {
                const publicKey = await getUserPublicKey(userId);
                return crypto.publicEncrypt(publicKey, symmetricKey).toString("base64");
            })
        );

        // Store encrypted keys
        await EncryptionKeyService.createKeysForChat(chat._id, participants, encryptedKeys, createdBy);

        // Emit socket event
        await emitNewChat(io, chat);

        return chat;
    } catch (error) {
        logger.logMessage("error", `Failed to create private chat: ${error.message}`);
        throw error instanceof ApiError ? error : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create private chat");
    }
};

// Create a group chat with multiple participants
const createGroupChat = async (participants, groupName, createdBy) => {
    try {
        if (participants.length < 2) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Group chat requires at least two participants");
        }

        // Sanitize group name
        const sanitizedGroupName = sanitizeHtml(groupName, { allowedTags: [], allowedAttributes: {} });
        if (!sanitizedGroupName) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid group name");
        }

        // Generate symmetric key
        const symmetricKey = generateSymmetricKey();

        // Create the chat
        const chat = await Chat.createGroupChat(sanitizedGroupName, participants, createdBy);

        // Encrypt symmetric key for each participant
        const encryptedKeys = await Promise.all(
            participants.map(async (userId) => {
                const publicKey = await getUserPublicKey(userId);
                return crypto.publicEncrypt(publicKey, symmetricKey).toString("base64");
            })
        );

        // Store encrypted keys
        await EncryptionKeyService.createKeysForChat(chat._id, participants, encryptedKeys, createdBy);

        // Emit socket event
        await emitNewChat(io, chat);

        return chat;
    } catch (error) {
        logger.logMessage("error", `Failed to create group chat: ${error.message}`);
        throw error instanceof ApiError ? error : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create group chat");
    }
};

// Add a participant to a group chat
const addParticipant = async (chatId, userId, addedBy) => {
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new ApiError(httpStatus.NOT_FOUND, "Chat not found");
        }
        if (chat.chatType !== "group") {
            throw new ApiError(httpStatus.BAD_REQUEST, "Participants can only be added to group chats");
        }
        if (chat.participants.includes(userId)) {
            throw new ApiError(httpStatus.BAD_REQUEST, "User is already a participant");
        }

        // Get the chat's symmetric key
        const symmetricKey = await EncryptionKeyService.getSymmetricKeyForChat(chatId, addedBy);

        // Add participant
        chat.participants.push(userId);
        await chat.save();

        // Encrypt symmetric key for the new participant
        const publicKey = await getUserPublicKey(userId);
        const encryptedKey = crypto.publicEncrypt(publicKey, symmetricKey).toString("base64");

        // Store the encrypted key
        await EncryptionKeyService.addKeyForUser(chatId, userId, encryptedKey, addedBy);

        // Emit socket event
        await emitParticipantAdded(io, chatId, userId);

        return chat;
    } catch (error) {
        logger.logMessage("error", `Failed to add participant to chat ${chatId}: ${error.message}`);
        throw error instanceof ApiError ? error : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to add participant");
    }
};

// Remove a participant from a group chat
const removeParticipant = async (chatId, userId, removedBy) => {
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new ApiError(httpStatus.NOT_FOUND, "Chat not found");
        }
        if (chat.chatType !== "group") {
            throw new ApiError(httpStatus.BAD_REQUEST, "Participants can only be removed from group chats");
        }
        if (!chat.participants.includes(userId)) {
            throw new ApiError(httpStatus.BAD_REQUEST, "User is not a participant");
        }

        // Remove participant
        chat.participants = chat.participants.filter(id => id.toString() !== userId.toString());
        await chat.save();

        // Deactivate the user's encryption key
        await EncryptionKeyService.deactivateKey(chatId, userId, removedBy);

        // Rotate symmetric key for forward secrecy
        await EncryptionKeyService.rotateSymmetricKey(chatId, removedBy);

        // Emit socket event
        await emitParticipantRemoved(io, chatId, userId);

        return chat;
    } catch (error) {
        logger.logMessage("error", `Failed to remove participant from chat ${chatId}: ${error.message}`);
        throw error instanceof ApiError ? error : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to remove participant");
    }
};

// Get all chats for a user
const getUserChats = async (userId) => {
    try {
        const chats = await Chat.find({
            participants: userId,
            deleted: false,
        }).populate("participants").lean();
        return chats;
    } catch (error) {
        logger.logMessage("error", `Failed to fetch chats for user ${userId}: ${error.message}`);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch chats");
    }
};

const chatService = {
    createPrivateChat,
    createGroupChat,
    addParticipant,
    removeParticipant,
    getUserChats,
};

export default chatService;