import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import userService from "./user.service.js";

const updateAvatar = async (req) => {
    const avatarLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }
    const avatar = await uploadOnCloudinary(
        avatarLocalPath,
        "profile_picutres"
    );

    const userProfile = await models.UserProfile.findOne({
        user: req.user._id,
    });
    if (!userProfile) {
        throw new ApiError(httpStatus.NOT_FOUND, "User Not Found");
    }

    userProfile.avatar = { url: avatar.url, publicId: avatar.public_id };
    userProfile.updatedBy = req.user._id;
    await userProfile.save();
    return true;
};

const getUserProfile = async (id) => {
    const userProfile = await models.UserProfile.findByUserId(id);
    return userProfile;
};

const updateUserProfile = async (profileData, userId) => {
    // Validate input
    if (!userId) {
        throw new ApiError(
            httpStatus.UNAUTHORIZED,
            "User authentication required"
        );
    }

    // Use upsertProfile to update or create the profile
    const updatedProfile = await models.UserProfile.upsertProfile(
        userId,
        profileData,
        userId // updatedBy
    );

    if (!updatedProfile) {
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Failed to update profile"
        );
    }

    return true;
};

const userProfileService = { updateAvatar, getUserProfile, updateUserProfile };
export default userProfileService;
