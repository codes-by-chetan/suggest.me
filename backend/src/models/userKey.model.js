import mongoose from "mongoose";
import logger from "../config/logger.config.js";

const userKeySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    session: {
        type: String, // Links to the session's tokenId in User model
        required: true,
    },
    publicKey: {
        type: String,
        required: true,
        validate: {
            validator: (value) => /^[A-Za-z0-9+/=]+$/.test(value), // Base64 validation
            message: "Public key must be a valid base64-encoded string",
        },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Ensure unique key pair per user and session
userKeySchema.index({ user: 1, session: 1 }, { unique: true });

// Update `updatedAt` timestamp on save
userKeySchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

// Method to deactivate a key for a specific session
userKeySchema.statics.deactivateKey = async function (userId, sessionId) {
    try {
        const key = await this.findOne({ user: userId, session: sessionId, isActive: true });
        if (!key) {
            throw new Error(`No active key found for user ${userId} and session ${sessionId}`);
        }
        key.isActive = false;
        await key.save();
        return key;
    } catch (error) {
        logger.logMessage("error", `Error deactivating key for user ${userId}, session ${sessionId}: ${error.message}`);
        throw error;
    }
};

// Method to create or update a key pair for a specific session
userKeySchema.statics.createOrUpdateKey = async function (userId, sessionId, publicKey) {
    try {
        const existingKey = await this.findOne({ user: userId, session: sessionId });
        if (existingKey) {
            existingKey.publicKey = publicKey;
            existingKey.isActive = true;
            existingKey.updatedAt = Date.now();
            await existingKey.save();
            return existingKey;
        }
        return this.create({
            user: userId,
            session: sessionId,
            publicKey,
            createdBy: userId,
            updatedBy: userId,
        });
    } catch (error) {
        logger.logMessage("error", `Error creating/updating key for user ${userId}, session ${sessionId}: ${error.message}`);
        throw error;
    }
};

// Method to find key by user and session
userKeySchema.statics.findByUserAndSession = async function (userId, sessionId) {
    try {
        return await this.findOne({ user: userId, session: sessionId, isActive: true });
    } catch (error) {
        logger.logMessage("error", `Error finding key for user ${userId}, session ${sessionId}: ${error.message}`);
        throw error;
    }
};

// Method to find all active keys for a user
userKeySchema.statics.findAllByUser = async function (userId) {
    try {
        return await this.find({ user: userId, isActive: true }).select("session publicKey createdAt updatedAt");
    } catch (error) {
        logger.logMessage("error", `Error fetching all keys for user ${userId}: ${error.message}`);
        throw error;
    }
};

export default mongoose.model("UserKey", userKeySchema);