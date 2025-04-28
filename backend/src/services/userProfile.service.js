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

const viewOtherUserProfile = async (req) => {
    const viewer = req.user;
    const profileOwnerId = req.params.userId;
    if (viewer?._id === profileOwnerId) {
        return userService.getUserProfileDetails(viewer);
    }

    const user = await userService.findUserById(profileOwnerId);
    await user.populate("profile");
    const userRelations = await userService.getUserRelations(user._id);

    const userProfile = await getUserProfile(profileOwnerId);
    const { isFollowed, accessibleFields } =
        await models.UserRelationship.getProfileAccess(
            viewer?._id,
            profileOwnerId
        );

    if (!userProfile) {
        throw new ApiError(httpStatus.NOT_FOUND, "User Profile Not Found");
    }

    if (!isFollowed) {
        if (!userProfile?.isPublic) {
            const selectedFields = {
                id: user._id,
                fullName: user.fullName,
                userName: user.userName,
                fullNameString: user.fullNameString,
                profile: {
                    avatar: user?.profile?.avatar,
                    bio: user?.profile?.bio,
                    location: user?.profile?.location,
                    displayName: user?.profile?.displayName,
                    isPublic: user?.profile?.isPublic,
                    isVerified: user?.profile?.isVerified,
                },
                relations: userRelations,
                createdAt: user.createdAt,
            };

            return selectedFields;
        }
    }
    const profileData = {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        userName: user.userName,
        contactNumber: user.contactNumber,
        fullNameString: user.fullNameString,
        profile: {
            avatar: user?.profile?.avatar,
            bio: user?.profile?.bio,
            location: user?.profile?.location,
            displayName: user?.profile?.displayName,
            socialLinks: user?.profile?.socialLinks,
            preferences: user?.profile?.preferences,
            isPublic: user?.profile?.isPublic,
            isVerified: user?.profile?.isVerified,
        },
        relations: userRelations,
        createdAt: user.createdAt,
    };

    return profileData;
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

const userProfileService = {
    updateAvatar,
    getUserProfile,
    updateUserProfile,
    viewOtherUserProfile,
};
export default userProfileService;
