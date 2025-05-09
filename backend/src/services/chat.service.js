import Chat from "../models/chat.model.js";
import EncryptionKeyService from "./encryptionKey.service.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import crypto from "crypto";
import { io } from "../index.js"; // Socket.io instance for real-time updates

// Utility to generate a symmetric key (e.g., for AES-256)
const generateSymmetricKey = () => crypto.randomBytes(32);

// Placeholder for fetching user's public key (assumed to exist)
const getUserPublicKey = async (userId) => {
    // Implementation would fetch from a key management system
    // For now, assume it returns a public key string
    return "user-public-key-placeholder";
};

// Create a private chat between two users
const createPrivateChat = async (userId1, userId2, createdBy) => {
    if (userId1 === userId2) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot create chat with yourself");
    }

    // Check if a private chat already exists
    const existingChat = await Chat.findOne({
        chatType: "private",
        participants: { $all: [userId1, userId2] },
        deleted: false,
    });

    if (existingChat) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Private chat already exists");
    }

    // Generate symmetric key for chat encryption
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

    // Store encrypted keys using EncryptionKeyService
    await EncryptionKeyService.createKeysForChat(chat._id, participants, encryptedKeys, createdBy);

    // Emit socket event for real-time update (assuming emitNewChat is defined)
    // await emitNewChat(io, chat);

    return chat;
};

// Create a group chat with multiple participants
const createGroupChat = async (participants, groupName, createdBy) => {
    if (participants.length < 2) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Group chat requires at least two participants");
    }

    // Generate symmetric key
    const symmetricKey = generateSymmetricKey();

    // Create the chat
    const chat = await Chat.createGroupChat(participants, groupName, createdBy);

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
    // await emitNewChat(io, chat);

    return chat;
};

// Add a participant to a group chat
const addParticipant = async (chatId, userId, addedBy) => {
    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new ApiError(httpStatus.NOT_FOUND, "Chat not found");
    }
    if (chat.chatType !== "group") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Can only add participants to group chats");
    }
    if (chat.participants.includes(userId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User is already a participant");
    }

    // Add participant
    chat.participants.push(userId);
    await chat.save();

    // Encrypt symmetric key for the new participant
    const symmetricKey = await EncryptionKeyService.getSymmetricKeyForChat(chatId); // Assume this retrieves the key
    const publicKey = await getUserPublicKey(userId);
    const encryptedKey = crypto.publicEncrypt(publicKey, symmetricKey).toString("base64");

    // Store the encrypted key
    await EncryptionKeyService.addKeyForUser(chatId, userId, encryptedKey, addedBy);

    // Emit socket event
    // await emitParticipantAdded(io, chatId, userId);

    return chat;
};

// Remove a participant from a group chat
const removeParticipant = async (chatId, userId, removedBy) => {
    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new ApiError(httpStatus.NOT_FOUND, "Chat not found");
    }
    if (chat.chatType !== "group") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Can only remove participants from group chats");
    }
    if (!chat.participants.includes(userId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User is not a participant");
    }

    // Remove participant
    chat.participants = chat.participants.filter(id => id.toString() !== userId.toString());
    await chat.save();

    // Remove the user's encryption key
    await EncryptionKeyService.removeKeyForUser(chatId, userId, removedBy);

    // Emit socket event
    // await emitParticipantRemoved(io, chatId, userId);

    return chat;
};

// Get all chats for a user
const getUserChats = async (userId) => {
    const chats = await Chat.find({
        participants: userId,
        deleted: false,
    });
    return chats;
};

const ChatService = {
    createPrivateChat,
    createGroupChat,
    addParticipant,
    removeParticipant,
    getUserChats,
};

export default ChatService;