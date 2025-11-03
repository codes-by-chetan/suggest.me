import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import Message from "../models/message.model.js";

const getChats = asyncHandler(async (req, res) => {
    const chats = await services.chatService.getUserChats(req.user._id);
    const response = new ApiResponse(
        httpStatus.OK,
        chats,
        "Chats fetched successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const getChatMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const messages = await services.messageService.getMessages(
        chatId,
        req.user._id,
        parseInt(page),
        parseInt(limit)
    );
    const response = new ApiResponse(
        httpStatus.OK,
        messages,
        "Messages fetched successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const sendMessage = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { content, suggestionId } = req.body;
    const message = await services.messageService.sendMessage(
        chatId,
        req.user._id,
        content,
        suggestionId || null,
        req.user._id
    );
    const response = new ApiResponse(
        httpStatus.OK,
        message,
        "Message sent successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const markChatAsRead = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Find all unread messages in the chat for this user
    const messages = await Message.find({
        chat: chatId,
        "readBy.user": { $ne: userId },
    });

    // Mark each message as read
    await Promise.all(
        messages.map((message) =>
            services.messageService.markMessageAsRead(message._id, userId, userId)
        )
    );

    const response = new ApiResponse(
        httpStatus.OK,
        null,
        "Chat marked as read successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const createChat = asyncHandler(async (req, res) => {
    const { participants, groupName, chatType } = req.body;
    const createdBy = req.user._id;

    let chat;
    if (chatType === "private") {
        if (participants.length !== 1) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Private chat requires exactly one other participant"
            );
        }
        const otherUserId = participants[0];
        chat = await services.chatService.createPrivateChat(
            createdBy,
            otherUserId,
            createdBy
        );
    } else if (chatType === "group") {
        chat = await services.chatService.createGroupChat(
            [...participants, createdBy],
            groupName,
            createdBy
        );
    } else {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid chat type");
    }

    const response = new ApiResponse(
        httpStatus.OK,
        chat,
        "Chat created successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const addParticipant = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { userId } = req.body;
    const addedBy = req.user._id;

    const chat = await services.chatService.addParticipant(chatId, userId, addedBy);
    const response = new ApiResponse(
        httpStatus.OK,
        chat,
        "Participant added successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const removeParticipant = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.params;
    const removedBy = req.user._id;

    const chat = await services.chatService.removeParticipant(chatId, userId, removedBy);
    const response = new ApiResponse(
        httpStatus.OK,
        chat,
        "Participant removed successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const chatController = {
    getChats,
    getChatMessages,
    sendMessage,
    markChatAsRead,
    createChat,
    addParticipant,
    removeParticipant,
};

export default chatController;