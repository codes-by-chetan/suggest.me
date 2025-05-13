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
    console.log(req.body.avatar);
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
const updateUserKeys = asyncHandler(async (req, res) => {
    const { publicKey } = req.body;
    const userId = req.user._id;
    const sessionId = req.session.tokenId; // From auth middleware

    // Validate input
    if (!publicKey) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Public key is required");
    }

    // Store public key for the session
    const userKey = await services.userKeyService.storeUserKeys(
        userId,
        sessionId,
        publicKey
    );

    // Update the session with the keyId
    await User.updateOne(
        { _id: userId, "sessions.tokenId": sessionId },
        { $set: { "sessions.$.keyId": userKey._id } }
    );

    // Find all unencrypted chats for this user
    const unencryptedChats = await Chat.find({
        participants: userId,
        isEncrypted: false,
        deleted: false,
    });

    // Initialize encryption for each unencrypted chat
    await Promise.all(
        unencryptedChats.map(async (chat) => {
            try {
                await services.chatService.initializeChatEncryption(
                    chat._id,
                    userId
                );
            } catch (error) {
                console.error(
                    `Failed to initialize encryption for chat ${chat._id}: ${error.message}`
                );
            }
        })
    );

    const response = new ApiResponse(
        httpStatus.OK,
        null,
        "User public key updated and chat encryption initialized successfully"
    );
    return res.status(httpStatus.OK).json(response);
});

const getUserKeys = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userKeys = await services.userKeyService.getAllUserKeys(userId);

    const response = new ApiResponse(
        httpStatus.OK,
        userKeys,
        "User public keys fetched successfully"
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
    getUserKeys,
    updateUserKeys,
};
export default userController;
