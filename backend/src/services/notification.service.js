import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import userService from "./user.service.js";
import { sendNotification } from "../sockets/socket.js";
import { io } from "../index.js";
import logger from "../config/logger.config.js";

const sendFollowRequstNotification = async (
    recipientId,
    senderId,
    followRequestId
) => {
    const sender = await models.User.findById(senderId);
    const recipient = await models.User.findById(recipientId);
    const notification = new models.Notification({
        recipient: recipient._id,
        sender: sender._id,
        type: "FollowRequest",
        message: `${sender.fullNameString} requested to follow you.`,
        metadata: {
            followRequestStatus: "Pending",
            followRequestId: followRequestId,
        },
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
    await sendNotification(io, recipientId, [notification]);

    return true;
};

const sendFollowRequstAcceptedNotification = async (recipientId, senderId) => {
    const sender = await models.User.findById(senderId);
    const recipient = await models.User.findById(recipientId);
    const notificationOld = await models.Notification.findOne({
        recipient: recipient._id,
        sender: sender._id,
        type: "FollowRequest",
        createdBy: sender._id,
    });

    notificationOld.status = "Dismissed";
    await notificationOld.save();
    await notificationOld.populate({
        path: "sender",
        select: "_id fullName fullNameString profile",
        populate: {
            path: "profile",
            select: "avatar",
        },
    });

    const notification = new models.Notification({
        recipient: sender._id,
        sender: recipient._id,
        type: "FollowAccepted",
        message: `${recipient.fullNameString} accepted your follow request.`,
        metadata: { followRequestStatus: "Accepted" },
        createdBy: recipient._id,
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
    await sendNotification(io, sender._id, [notification]);

    return notificationOld;
};

const sendFollowedNotification = async (
    recipientId,
    senderId,
    followRequestId,
    oldNotifications = []
) => {
    const sender = await models.User.findById(senderId);
    const recipient = await models.User.findById(recipientId);
    const notification = new models.Notification({
        recipient: recipient._id,
        sender: sender._id,
        type: "Followed",
        message: `${sender.fullNameString} Has followed you.`,
        metadata: {
            followRequestStatus: "Accepted",
            followRequestId: followRequestId,
        },
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
    await sendNotification(io, recipientId, [
        notification,
        ...oldNotifications,
    ]);

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
    await sendNotification(io, recipientId, [notification]);

    return true;
};
const getNotificationsByRecipient = async (recipientId) => {
    const notifications = await models.Notification.find({
        recipient: recipientId,
        status: { $ne: "Dismissed" }, // Exclude notifications with status "Dismissed"
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

const dismissNotification = async (user, notificationId) => {
    const notification = await models.Notification.findOne({
        recipient: user._id,
        _id: notificationId,
    });

    if (!notification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Notification not found!!!");
    }

    notification.status = "Dismissed";

    await notification.save();
    console.log(notification);
    await notification.populate({
        path: "sender",
        select: "_id fullName fullNameString profile",
        populate: {
            path: "profile",
            select: "avatar",
        },
    });
    return notification;
};

const dismissAllNotifications = async (user) => {
    const notifications = await models.Notification.updateMany(
        { recipient: user._id, status: { $ne: "Dismissed" } },
        { $set: { status: "Read" } }
    );
    if (!notifications || notifications.modifiedCount < 1) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "No notifications found to dismiss!!!"
        );
    }

    return notifications;
};

const markNotificationAsRead = async (user, notificationId) => {
    const notification = await models.Notification.findOne({
        recipient: user._id,
        _id: notificationId,
    });

    if (!notification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Notification not found!!!");
    }

    notification.status = "Read";

    await notification.save();
    await notification.populate({
        path: "sender",
        select: "_id fullName fullNameString profile",
        populate: {
            path: "profile",
            select: "avatar",
        },
    });
    return notification;
};

const markAllNotificationsAsRead = async (user) => {
    const notifications = await models.Notification.updateMany(
        { recipient: user._id, status: "Unread" },
        { $set: { status: "Read" } }
    );

    if (!notifications || notifications.modifiedCount < 1) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "No notifications found to mark as read!!!"
        );
    }

    return notifications;
};

const dismissFollowRequestNotification = async (relation) => {
    const type = relation.status === "Accepted" ? "Followed" : "FollowRequest";
    console.log({
        recipient: relation.following,
        sender: relation.follower,
        type: type,
        "metadata.followRequestId": relation._id,
        createdBy: relation.follower,
        status: { $ne: "Dismissed" },
        deleted: false,
    });
    const notification = await models.Notification.findOne({
        recipient: relation.following,
        sender: relation.follower,
        type: type,
        "metadata.followRequestId": relation._id,
        createdBy: relation.follower,
        status: { $ne: "Dismissed" },
        deleted: false,
    });
    if (!notification) {
        logger.logMessage("warn", "Notification Not Found!!!");
        return;
    }
    notification.status = "Dismissed";
    notification.delete();
    await notification.populate({
        path: "sender",
        select: "_id fullName fullNameString profile",
        populate: {
            path: "profile",
            select: "avatar",
        },
    });
    await sendNotification(io, notification.recipient, [notification]);

    return true;
};

const notificationService = {
    sendFollowRequstNotification,
    sendFollowRequstAcceptedNotification,
    sendSuggestionNotification,
    sendFollowedNotification,
    getNotificationsByRecipient,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
    dismissAllNotifications,
    dismissFollowRequestNotification,
};
export default notificationService;
