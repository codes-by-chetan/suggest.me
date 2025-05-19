import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import services from "../services/index.js";
import User from "../models/user.model.js";

// Create or update a user's public key for a specific session
const createUserKey = asyncHandler(async (req, res) => {
    const { publicKey } = req.body;
    const userId = req.user._id;
    const sessionId = req.session.tokenId; // From auth middleware

    if (!publicKey) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Public key toh daal bhai, khaali haath nahi chalega!"
        );
    }

    const userKey = await services.userKeyService.createUserKey(
        userId,
        sessionId,
        publicKey
    );

    // Update the session with the keyId
    await User.updateOne(
        { _id: userId, "sessions.tokenId": sessionId },
        { $set: { "sessions.$.keyId": userKey._id } }
    );

    const response = new ApiResponse(
        httpStatus.OK,
        { keyId: userKey._id, sessionId: userKey.session },
        "Public key set ho gaya bhai, ab encrypt kar sakta hai!"
    );
    return res.status(httpStatus.OK).json(response);
});

// Get user's public key for a specific session
const getUserPublicKey = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const sessionId = req.session.tokenId; // From auth middleware

    const publicKey = await services.userKeyService.getUserPublicKey(
        userId,
        sessionId
    );

    const response = new ApiResponse(
        httpStatus.OK,
        { publicKey: publicKey.toString("base64") },
        "Public key mil gaya bhai, ab kaam shuru kar!"
    );
    return res.status(httpStatus.OK).json(response);
});

// Get all public keys for the user
const getAllUserKeys = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userKeys = await services.userKeyService.getAllUserKeys(userId);

    const response = new ApiResponse(
        httpStatus.OK,
        userKeys,
        "Saare public keys mil gaye bhai, dekh le!"
    );
    return res.status(httpStatus.OK).json(response);
});

// Get all public keys for the user
const getUserAllKeys = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const userKeys = await services.userKeyService.getAllUserKeys(userId);

    const response = new ApiResponse(
        httpStatus.OK,
        userKeys,
        "Saare public keys mil gaye bhai, dekh le!"
    );
    return res.status(httpStatus.OK).json(response);
});

// Deactivate a key by session ID
const deactivateKeyBySession = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const sessionId = req.session.tokenId; // From auth middleware

    const key = await services.userKeyService.deactivateKeyBySession(
        userId,
        sessionId
    );

    const response = new ApiResponse(
        httpStatus.OK,
        { keyId: key._id, sessionId: key.session },
        "Key deactivate ho gaya bhai, ab yeh session kaam nahi karega!"
    );
    return res.status(httpStatus.OK).json(response);
});

// Deactivate a key by key ID
const deactivateKeyById = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { keyId } = req.params;

    if (!keyId) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Key ID toh daal bhai, kaise deactivate karoon?"
        );
    }

    const key = await services.userKeyService.deactivateKeyById(keyId, userId);

    const response = new ApiResponse(
        httpStatus.OK,
        { keyId: key._id, sessionId: key.session },
        "Key deactivate ho gaya bhai, yeh key ab kaam nahi karega!"
    );
    return res.status(httpStatus.OK).json(response);
});

const userKeyController = {
    createUserKey,
    getUserPublicKey,
    getAllUserKeys,
    deactivateKeyBySession,
    deactivateKeyById,
    getUserAllKeys,
};

export default userKeyController;
