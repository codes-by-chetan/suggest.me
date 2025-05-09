import EncryptionKey from "../models/encryptionKey.model.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";

// Create encryption keys for a chat
const createKeysForChat = async (chatId, participantIds, encryptedKeys, createdBy) => {
    if (participantIds.length !== encryptedKeys.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Number of participants and keys must match");
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new ApiError(httpStatus.NOT_FOUND, "Chat not found");
    }

    return EncryptionKey.createKeysForChat(chatId, participantIds, encryptedKeys, createdBy);
};

// Deactivate encryption key for a user in a chat
const deactivateKey = async (chatId, userId, updatedBy) => {
    const keyEntry = await EncryptionKey.findByChatAndUser(chatId, userId);
    if (!keyEntry) {
        throw new ApiError(httpStatus.NOT_FOUND, "Key not found for this user and chat");
    }

    keyEntry.isActive = false;
    keyEntry.updatedBy = updatedBy;
    return keyEntry.save();
};

// Get encryption key for a user and chat
const getKeyForChatAndUser = async (chatId, userId) => {
    const keyEntry = await EncryptionKey.findByChatAndUser(chatId, userId);
    if (!keyEntry) {
        throw new ApiError(httpStatus.FORBIDDEN, "No key found for this user and chat");
    }
    return keyEntry;
};

const EncryptionKeyService = {
    createKeysForChat,
    deactivateKey,
    getKeyForChatAndUser,
};

export default EncryptionKeyService;