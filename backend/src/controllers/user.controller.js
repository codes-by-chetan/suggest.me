import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";

const getUserProfile = asyncHandler(async (req, res) => {
    const profileData = await services.userService.getUserProfileDetails(
        req.user
    );
    const response = new ApiResponse(
        httpStatus.OK,
        profileData,
        "User profile fetched successfully"
    );
    return res.status(httpStatus.OK).json(response);
});
const getUserFullProfile = asyncHandler(async (req, res) => {
    const profileData = await services.userProfileService.getUserProfile(
        req.user._id
    );
    const response = new ApiResponse(
        httpStatus.OK,
        profileData,
        "User profile fetched successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const getUserFullProfileById = asyncHandler(async (req, res) => {
    const profileData =
        await services.userProfileService.viewOtherUserProfile(req);

    const response = new ApiResponse(
        httpStatus.OK,
        profileData,
        "User profile fetched successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    await services.userProfileService.updateAvatar(req);
    const response = new ApiResponse(
        httpStatus.OK,
        null,
        "User Avatar Updated Successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const updateUserProfile = asyncHandler(async (req, res) => {
    await services.userProfileService.updateUserProfile(req.body, req.user._id);
    const response = new ApiResponse(
        httpStatus.OK,
        null,
        "User Profile Updated Successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const getAllNotifications = asyncHandler(async (req, res) => {
    const result =
        await services.notificationService.getNotificationsByRecipient(
            req.user._id
        );
    const response = new ApiResponse(
        httpStatus.OK,
        result,
        "Notifications Fetched Successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const userController = {
    getUserProfile,
    updateUserAvatar,
    getUserFullProfile,
    updateUserProfile,
    getUserFullProfileById,
    getAllNotifications,
};
export default userController;
