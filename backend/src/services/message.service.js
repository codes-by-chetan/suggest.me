import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import UserSuggestions from "../models/userSuggestion.model.js";
import EncryptionKeyService from "./encryptionKey.service.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import crypto from "crypto";
import { io } from "../index.js";
import logger from "../config/logger.config.js";
import sanitizeHtml from "sanitize-html";

// Utility to encrypt message content
const encryptMessage = (content, symmetricKey) => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-gcm", symmetricKey, iv);
        let encrypted = cipher.update(content, "utf8", "hex");
        encrypted += cipher.final("hex");
        const authTag = cipher.getAuthTag().toString("hex");
        return { encrypted, iv: iv.toString("hex"), authTag };
    } catch (error) {
        logger.logMessage(
            "error",
            `Failed to encrypt message: ${error.message}`
        );
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Failed to encrypt message"
        );
    }
};

// Utility to decrypt message content
const decryptMessage = (encrypted, symmetricKey, iv, authTag) => {
    try {
        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            symmetricKey,
            Buffer.from(iv, "hex")
        );
        decipher.setAuthTag(Buffer.from(authTag, "hex"));
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (error) {
        logger.logMessage(
            "error",
            `Failed to decrypt message: ${error.message}`
        );
        return "[Decryption Failed]";
    }
};

// Socket event for new message (Updated to emit to userId rooms)
const emitNewMessage = async (io, chatId, message) => {
    try {
        // Fetch the chat to get participants
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new Error("Chat not found");
        }

        // Emit to each participant's userId room
        chat.participants.forEach((userId) => {
            io.to(userId.toString()).emit("newMessage", {
                chatId,
                message: {
                    _id: message._id,
                    chat: chatId,
                    sender: message.sender,
                    content: message.content, // Encrypted content
                    createdAt: message.createdAt,
                    readBy: message.readBy,
                },
            });
        });

        // TODO: Queue for offline users (e.g., redis.lpush(`offlineMessages:${chatId}`, message))
    } catch (error) {
        logger.logMessage(
            "error",
            `Failed to emit newMessage for chat ${chatId}: ${error.message}`
        );
    }
};

// Send a message to a chat
const sendMessage = async (
    chatId,
    senderId,
    content,
    suggestionId,
    createdBy
) => {
    try {
        // Rate limiting hook (e.g., redis.incr(`rateLimit:${senderId}`))
        // TODO: Implement rate limiting logic

        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new ApiError(httpStatus.NOT_FOUND, "Chat not found");
        }
        if (!chat.participants.includes(senderId)) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                "User is not a participant in this chat"
            );
        }

        // Sanitize message content
        const sanitizedContent = sanitizeHtml(content, {
            allowedTags: [],
            allowedAttributes: {},
        });
        if (!sanitizedContent) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Invalid message content"
            );
        }

        // Get symmetric key for encryption
        const symmetricKey = await EncryptionKeyService.getSymmetricKeyForChat(
            chatId,
            senderId
        );

        // Encrypt the message content
        const { encrypted, iv, authTag } = encryptMessage(
            sanitizedContent,
            symmetricKey
        );

        // Create the message
        const message = await Message.createMessage(
            chatId,
            senderId,
            JSON.stringify({ encrypted, iv, authTag }),
            suggestionId,
            createdBy
        );

        // Link suggestion if provided
        if (suggestionId) {
            const suggestion = await UserSuggestions.findById(suggestionId);
            if (!suggestion) {
                throw new ApiError(
                    httpStatus.NOT_FOUND,
                    "Suggestion not found"
                );
            }
            await UserSuggestions.linkToMessage(
                suggestionId,
                message._id,
                createdBy
            );
        }

        // Emit socket event
        await emitNewMessage(io, chatId, message);

        return message;
    } catch (error) {
        logger.logMessage(
            "error",
            `Failed to send message to chat ${chatId}: ${error.message}`
        );
        throw error instanceof ApiError
            ? error
            : new ApiError(
                  httpStatus.INTERNAL_SERVER_ERROR,
                  "Failed to send message"
              );
    }
};

// Get messages for a chat (Updated to support pagination)
const getMessages = async (chatId, userId, page = 1, limit = 100) => {
    try {
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(userId)) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                "User is not a participant in this chat"
            );
        }

        const symmetricKey = await EncryptionKeyService.getSymmetricKeyForChat(
            chatId,
            userId
        );
        const messages = await Message.find({ chat: chatId })
            .sort({ createdAt: -1 }) // Sort by latest first
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("sender suggestion")
            .lean();

        // Decrypt messages
        const decryptedMessages = messages.map((msg) => {
            try {
                const { encrypted, iv, authTag } = JSON.parse(msg.content);
                const decryptedContent = decryptMessage(
                    encrypted,
                    symmetricKey,
                    iv,
                    authTag
                );
                return {
                    ...msg,
                    content: decryptedContent,
                };
            } catch (error) {
                logger.logMessage(
                    "error",
                    `Failed to decrypt message ${msg._id}: ${error.message}`
                );
                return {
                    ...msg,
                    content: "[Decryption Failed]",
                };
            }
        });

        return decryptedMessages.reverse(); // Reverse to show oldest first in UI
    } catch (error) {
        logger.logMessage(
            "error",
            `Failed to fetch messages for chat ${chatId}: ${error.message}`
        );
        throw error instanceof ApiError
            ? error
            : new ApiError(
                  httpStatus.INTERNAL_SERVER_ERROR,
                  "Failed to fetch messages"
              );
    }
};

// Mark a message as read
const markMessageAsRead = async (messageId, userId, updatedBy) => {
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
        }

        const chat = await Chat.findById(message.chat);
        if (!chat || !chat.participants.includes(userId)) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                "User is not a participant in this chat"
            );
        }

        const updatedMessage = await Message.markAsRead(
            messageId,
            userId,
            updatedBy
        );

        // Emit socket event
        io.to(chat._id.toString()).emit("messageRead", { messageId, userId });

        return updatedMessage;
    } catch (error) {
        logger.logMessage(
            "error",
            `Failed to mark message ${messageId} as read: ${error.message}`
        );
        throw error instanceof ApiError
            ? error
            : new ApiError(
                  httpStatus.INTERNAL_SERVER_ERROR,
                  "Failed to mark message as read"
              );
    }
};

const messageService = {
    sendMessage,
    getMessages,
    markMessageAsRead,
};

export default messageService;
