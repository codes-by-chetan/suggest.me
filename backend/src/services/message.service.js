import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";

// Utility to encrypt message content (placeholder)
const encryptMessage = (content, symmetricKey) => {
    // Implement encryption logic here
    return "encrypted-content";
};

// Utility to decrypt message content (placeholder)
const decryptMessage = (encryptedContent, symmetricKey) => {
    // Implement decryption logic here
    return "decrypted-content";
};

// Send a message to a chat
const sendMessage = async (chatId, senderId, content, suggestionId, createdBy) => {
    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new ApiError(httpStatus.NOT_FOUND, "Chat not found");
    }
    if (!chat.participants.includes(senderId)) {
        throw new ApiError(httpStatus.FORBIDDEN, "You are not a participant in this chat");
    }

    // Get symmetric key for encryption (assumed to be fetched from EncryptionKeyService)
    const symmetricKey = await EncryptionKeyService.getSymmetricKeyForChat(chatId, senderId);

    // Encrypt the message content
    const encryptedContent = encryptMessage(content, symmetricKey);

    // Create the message
    const message = await Message.createMessage(
        chatId,
        senderId,
        encryptedContent,
        suggestionId,
        createdBy
    );

    // If suggestionId is provided, link it (assuming a method exists)
    if (suggestionId) {
        await UserSuggestions.linkToMessage(suggestionId, message._id, createdBy);
    }

    // Emit socket event for real-time update (assuming emitNewMessage is defined)
    // await emitNewMessage(io, chatId, message);

    return message;
};

// Get messages for a chat
const getMessages = async (chatId, userId) => {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
        throw new ApiError(httpStatus.FORBIDDEN, "You are not part of this chat");
    }

    const symmetricKey = await EncryptionKeyService.getSymmetricKeyForChat(chatId, userId);
    const messages = await Message.findByChatId(chatId);

    // Decrypt messages
    const decryptedMessages = messages.map((msg) => {
        const decryptedContent = decryptMessage(msg.content, symmetricKey);
        return {
            ...msg.toObject(),
            content: decryptedContent,
        };
    });

    return decryptedMessages;
};

// Mark a message as read
const markMessageAsRead = async (messageId, userId, updatedBy) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.participants.includes(userId)) {
        throw new ApiError(httpStatus.FORBIDDEN, "You are not part of this chat");
    }

    return Message.markAsRead(messageId, userId, updatedBy);
};

const MessageService = {
    sendMessage,
    getMessages,
    markMessageAsRead,
};

export default MessageService;