import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification =
        await services.notificationService.markNotificationAsRead(
            req.user,
            req.params.notificationId
        );
    const response = new ApiResponse(
        httpStatus.OK,
        notification,
        "Notification marked as read!!!"
    );
    res.status(200).json(response);
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const notifications =
        await services.notificationService.markAllNotificationsAsRead(req.user);
    const response = new ApiResponse(
        httpStatus.OK,
        notifications,
        "All notifications marked as read!!!"
    );
    res.status(200).json(response);
});

const dismissNotification = asyncHandler(async (req, res) => {
    const notification = await services.notificationService.dismissNotification(
        req.user,
        req.params.notificationId
    );

    const response = new ApiResponse(
        httpStatus.OK,
        notification,
        "Notification dismissed!!!"
    );
    res.status(200).json(response);
});
const dismissAllNotifications = asyncHandler(async (req, res) => {
    const notifications =
        await services.notificationService.dismissAllNotifications(req.user);
    const response = new ApiResponse(
        httpStatus.OK,
        notifications,
        "All notifications dismissed!!!"
    );
    res.status(200).json(response);
});

const notificationController = {
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
    dismissAllNotifications,
};
export default notificationController;
