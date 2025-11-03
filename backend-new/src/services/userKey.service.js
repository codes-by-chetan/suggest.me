import UserKey from "../models/userKey.model.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import logger from "../config/logger.config.js";

// Create or update a user's public key for a specific session
const createUserKey = async (userId, sessionId, publicKey) => {
    try {
        // Validate inputs
        if (!userId || !sessionId || !publicKey) {
            throw new ApiError(httpStatus.BAD_REQUEST, "User ID, session ID, and public key are required, bhai!");
        }

        // Check if user already has active keys for this session
        const existingKey = await UserKey.findOne({ user: userId, session: sessionId, isActive: true });
        if (existingKey) {
            // Deactivate existing key if present
            existingKey.isActive = false;
            existingKey.updatedAt = Date.now();
            await existingKey.save();
            logger.logMessage("info", `Deactivated previous key for user ${userId}, session ${sessionId}, ab naya daalenge!`);
        }

        // Create new key entry
        const newKey = await UserKey.createOrUpdateKey(userId, sessionId, publicKey.toString("base64"));

        logger.logMessage("info", `Naya public key store ho gaya for user ${userId}, session ${sessionId}`);
        return newKey;
    } catch (error) {
        logger.logMessage("error", `Key store karne mein gadbad ho gayi for user ${userId}, session ${sessionId}: ${error.message}`);
        throw error instanceof ApiError
            ? error
            : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Public key store karne mein problem ho gayi, bhai!");
    }
};

// Retrieve user's public key for a specific session
const getUserPublicKey = async (userId, sessionId) => {
    try {
        // TODO: Add Redis caching (e.g., redis.get(`publicKey:${userId}:${sessionId}`))
        const userKey = await UserKey.findByUserAndSession(userId, sessionId);
        if (!userKey || !userKey.publicKey) {
            logger.logMessage("info", `Public key nahi mila for user ${userId}, session ${sessionId}`);
            throw new ApiError(httpStatus.NOT_FOUND, "Public key nahi mila for this user and session, bhai!");
        }
        // TODO: Cache public key (e.g., redis.set(`publicKey:${userId}:${sessionId}`, userKey.publicKey))
        return Buffer.from(userKey.publicKey, "base64");
    } catch (error) {
        logger.logMessage("error", `Public key fetch karne mein gadbad for user ${userId}, session ${sessionId}: ${error.message}`);
        throw error instanceof ApiError
            ? error
            : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Public key fetch karne mein problem ho gayi, bhai!");
    }
};

// Retrieve all public keys for a user (across all sessions)
const getAllUserKeys = async (userId) => {
    try {
        const userKeys = await UserKey.findAllByUser(userId);
        if (!userKeys || userKeys.length === 0) {
            logger.logMessage("info", `Koi active keys nahi mile for user ${userId}`);
            return [];
        }
        return userKeys.map((key) => ({
            keyId: key._id,
            sessionId: key.session,
            publicKey: key.publicKey,
            createdAt: key.createdAt,
            updatedAt: key.updatedAt,
        }));
    } catch (error) {
        logger.logMessage("error", `Saare keys fetch karne mein gadbad for user ${userId}: ${error.message}`);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "User keys fetch karne mein problem ho gayi, bhai!");
    }
};

// Deactivate a key by user ID and session ID
const deactivateKeyBySession = async (userId, sessionId) => {
    try {
        const key = await UserKey.deactivateKey(userId, sessionId);
        logger.logMessage("info", `Key deactivate ho gaya for user ${userId}, session ${sessionId}`);
        return key;
    } catch (error) {
        logger.logMessage("error", `Key deactivate karne mein gadbad for user ${userId}, session ${sessionId}: ${error.message}`);
        throw error instanceof ApiError
            ? error
            : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Key deactivate karne mein problem ho gayi, bhai!");
    }
};

// Deactivate a key by key ID
const deactivateKeyById = async (keyId, userId) => {
    try {
        const key = await UserKey.findOne({ _id: keyId, user: userId, isActive: true });
        if (!key) {
            throw new ApiError(httpStatus.NOT_FOUND, "Key nahi mila ya pehle se deactivate hai, bhai!");
        }
        key.isActive = false;
        key.updatedAt = Date.now();
        await key.save();
        logger.logMessage("info", `Key deactivate ho gaya with ID ${keyId} for user ${userId}`);
        return key;
    } catch (error) {
        logger.logMessage("error", `Key deactivate karne mein gadbad for key ID ${keyId}, user ${userId}: ${error.message}`);
        throw error instanceof ApiError
            ? error
            : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Key deactivate karne mein problem ho gayi, bhai!");
    }
};

// Retrieve a specific user's public key by user ID and session ID
const getPublicKeyByUserIdAndSessionId = async (userId, sessionId) => {
    try {
        const userKey = await UserKey.findByUserAndSession(userId, sessionId);
        if (!userKey || !userKey.publicKey) {
            logger.logMessage("info", `Public key nahi mila for user ${userId}, session ${sessionId}`);
            throw new ApiError(httpStatus.NOT_FOUND, "Public key nahi mila for this user and session, bhai!");
        }
        return Buffer.from(userKey.publicKey, "base64");
    } catch (error) {
        logger.logMessage("error", `Public key fetch karne mein gadbad for user ${userId}, session ${sessionId}: ${error.message}`);
        throw error instanceof ApiError
            ? error
            : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Public key fetch karne mein problem ho gayi, bhai!");
    }
};

const userKeyService = {
    createUserKey,
    getUserPublicKey,
    getAllUserKeys,
    deactivateKeyBySession,
    deactivateKeyById,
    getPublicKeyByUserIdAndSessionId,
};

export default userKeyService;