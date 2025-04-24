import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import userService from "./user.service.js";
import { sendNotification } from "../sockets/socket.js";
import { io } from "../index.js";

const sendFollowRequstNotification = async (recipientId, senderId) => {
    const sender = await models.User.findById(senderId);
    const recipient = await models.User.findById(recipientId);
    const notification = new models.Notification({
        recipient: recipient._id,
        sender: sender._id,
        type: "FollowRequest",
        message: `${sender.fullNameString} requested to follow you.`,
        metadata: { followRequestStatus: "Pending" },
        createdBy: sender._id,
    });
    await notification.save();
    await notification.populate({
        path: "sender",
        select: "_id fullName fullNameString profile",
        populate: {
            path: "profile",
            select: "avatar",
        },
    });
    await sendNotification(io, recipientId, notification);

    return true;
};
const sendFollowedNotification = async (recipientId, senderId) => {
    const sender = await models.User.findById(senderId);
    const recipient = await models.User.findById(recipientId);
    const notification = new models.Notification({
        recipient: recipient._id,
        sender: sender._id,
        type: "FollowRequest",
        message: `${sender.fullNameString} Has followed you.`,
        metadata: { followRequestStatus: "Accepted" },
        createdBy: sender._id,
    });
    await notification.save();
    await notification.populate({
        path: "sender",
        select: "_id fullName fullNameString profile",
        populate: {
            path: "profile",
            select: "avatar",
        },
    });
    await sendNotification(io, recipientId, notification);

    return true;
};
const sendSuggestionNotification = async (recipientId, senderId, content) => {
    const sender = await models.User.findById(senderId);
    const recipient = await models.User.findById(recipientId);

    const notification = new models.Notification({
        recipient: recipient._id,
        sender: sender._id,
        type: "Suggestion",
        message: `${sender.fullNameString} suggested you watch 'Epic Adventure Video'.`,
        relatedContent: { contentType: "Video", contentId: video._id },
        actionUrl: "https://www.youtube.com/watch?v=xyz123",
        metadata: { suggestionType: "Video" },
        createdBy: sender._id,
    });
    await notification.save();
    await notification.populate({
        path: "sender",
        select: "_id fullName fullNameString profile",
        populate: {
            path: "profile",
            select: "avatar",
        },
    });
    await sendNotification(io, recipientId, notification);

    return true;
};
const getNotificationsByRecipient = async (recipientId) => {
    const notifications = await models.Notification.find({
        recipient: recipientId,
    })
        .populate({
            path: "sender",
            select: "_id fullName fullNameString profile",
            populate: {
                path: "profile",
                select: "avatar",
            },
        })
        .sort({ createdAt: -1 }); // Sort by most recent first
    return notifications;
};
const notificationService = {
    sendFollowRequstNotification,
    sendSuggestionNotification,
    sendFollowedNotification,
    getNotificationsByRecipient,
};
export default notificationService;
