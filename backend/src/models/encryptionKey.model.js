import mongoose from "mongoose";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const encryptionKeySchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: [true, "Chat reference is required"],
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User reference is required"],
            index: true,
        },
        key: {
            type: String,
            required: [true, "Encryption key is required"],
            trim: true, // Encrypted symmetric key (e.g., AES key encrypted with user's public key)
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Created by is required"],
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            requiredხ2ndary: true,
            required: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Plugins
encryptionKeySchema.plugin(plugins.softDelete);
encryptionKeySchema.plugin(plugins.privatePlugin);

// Indexes for performance
encryptionKeySchema.index({ chat: 1, user: 1 }, { unique: true });

// Pre-save hook for logging
encryptionKeySchema.pre("save", function (next) {
    return middlewares.dbLogger("EncryptionKey").call(this, next);
});

// Query only active records by default
encryptionKeySchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

// Utility method to create encryption keys for a chat
encryptionKeySchema.statics.createKeysForChat = async function (chatId, participants, keys, createdBy) {
    const keyDocs = participants.map((userId, index) => ({
        chat: chatId,
        user: userId,
        key: keys[index], // Encrypted key for this user
        createdBy,
        updatedBy: createdBy,
    }));
    return this.insertMany(keyDocs);
};

// Utility method to fetch key for a user and chat
encryptionKeySchema.statics.findByChatAndUser = async function (chatId, userId) {
    return this.findOne({ chat: chatId, user: userId })
        .populate("chat")
        .populate("user")
        .populate("createdBy")
        .populate("updatedBy");
};

const EncryptionKey = mongoose.model("EncryptionKey", encryptionKeySchema);

export default EncryptionKey;