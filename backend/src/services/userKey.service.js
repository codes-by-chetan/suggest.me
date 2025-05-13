import UserKey from "../models/userKey.model.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import logger from "../config/logger.config.js";

// Store user's public key for a specific session
const storeUserKeys = async (userId, sessionId, publicKey) => {
    try {
        // Validate inputs
        if (!userId || !sessionId || !publicKey) {
            throw new ApiError(httpStatus.BAD_REQUEST, "User ID, session ID, and public key are required");
        }

        // Check if user already has active keys for this session
        const existingKey = await UserKey.findOne({ user: userId, session: sessionId, isActive: true });
        if (existingKey) {
            // Deactivate existing key if present
            existingKey.isActive = false;
            existingKey.updatedAt = Date.now();
            await existingKey.save();
            logger.logMessage("info", `Deactivated previous key for user ${userId}, session ${sessionId}`);
        }

        // Create new key entry
        const newKey = await UserKey.createOrUpdateKey(userId, sessionId, publicKey.toString("base64"));

        logger.logMessage("info", `Stored new public key for user ${userId}, session ${sessionId}`);
        return newKey;
    } catch (error) {
        logger.logMessage("error", `Failed to store keys for user ${userId}, session ${sessionId}: ${error.message}`);
        throw error instanceof ApiError
            ? error
            : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to store user keys");
    }
};

// Retrieve user's public key for a specific session
const getUserPublicKey = async (userId, sessionId) => {
    try {
        // TODO: Add Redis caching (e.g., redis.get(`publicKey:${userId}:${sessionId}`))
        const userKey = await UserKey.findByUserAndSession(userId, sessionId);
        if (!userKey || !userKey.publicKey) {
            logger.logMessage("info", `Public key not found for user ${userId}, session ${sessionId}`);
            return null; // Return null instead of throwing error
        }
        // TODO: Cache public key (e.g., redis.set(`publicKey:${userId}:${sessionId}`, userKey.publicKey))
        return Buffer.from(userKey.publicKey, "base64");
    } catch (error) {
        logger.logMessage("error", `Error fetching public key for user ${userId}, session ${sessionId}: ${error.message}`);
        return null; // Return null on error
    }
};

// Retrieve all public keys for a user (across all sessions)
const getAllUserKeys = async (userId) => {
    try {
        const userKeys = await UserKey.find({ user: userId, isActive: true }).select("session publicKey createdAt updatedAt");
        if (!userKeys || userKeys.length === 0) {
            logger.logMessage("info", `No active keys found for user ${userId}`);
            return [];
        }
        return userKeys.map((key) => ({
            sessionId: key.session,
            publicKey: key.publicKey,
            createdAt: key.createdAt,
            updatedAt: key.updatedAt,
        }));
    } catch (error) {
        logger.logMessage("error", `Error fetching all keys for user ${userId}: ${error.message}`);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch user keys");
    }
};

const userKeyService = {
    storeUserKeys,
    getUserPublicKey,
    getAllUserKeys,
};

export default userKeyService;