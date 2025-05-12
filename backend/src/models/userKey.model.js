import mongoose from "mongoose";
import logger from "../config/logger.config.js";

const userKeySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    publicKey: {
        type: String,
        required: true,
        validate: {
            validator: (value) => /^[A-Za-z0-9+/=]+$/.test(value), // Base64 validation
            message: "Public key must be a valid base64-encoded string",
        },
    },
    privateKey: {
        type: String,
        required: true,
        validate: {
            validator: (value) => /^[A-Za-z0-9+/=]+$/.test(value), // Base64 validation
            message: "Private key must be a valid base64-encoded string",
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

// Update `updatedAt` timestamp on save
userKeySchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

// Method to deactivate a key
userKeySchema.statics.deactivateKey = async function (userId) {
    try {
        const key = await this.findOne({ user: userId, isActive: true });
        if (!key) {
            throw new Error("No active key found for user");
        }
        key.isActive = false;
        await key.save();
        return key;
    } catch (error) {
        logger.logMessage("error",`Error deactivating key for user ${userId}: ${error.message}`);
        throw error;
    }
};

// Method to create or update a key pair
userKeySchema.statics.createOrUpdateKey = async function (userId, publicKey, privateKey) {
    try {
        const existingKey = await this.findOne({ user: userId });
        if (existingKey) {
            existingKey.publicKey = publicKey;
            existingKey.privateKey = privateKey;
            existingKey.isActive = true;
            existingKey.updatedAt = Date.now();
            await existingKey.save();
            return existingKey;
        }
        return this.create({
            user: userId,
            publicKey,
            privateKey,
            createdBy: userId,
            updatedBy: userId,
        });
    } catch (error) {
        logger.logMessage("error",`Error creating/updating key for user ${userId}: ${error.message}`);
        throw error;
    }
};

export default mongoose.model("UserKey", userKeySchema);