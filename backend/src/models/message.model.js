import mongoose from "mongoose";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const messageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: [true, "Chat reference is required"],
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Sender reference is required"],
            index: true,
        },
        contentData: [
            {
                session: {
                    type: String,
                    required: [
                        function () {
                            return this.isEncrypted === true;
                        },
                        "Session reference is required for encrypted messages",
                    ],
                },
                content: {
                    type: String,
                    required: [true, "Message content is required"],
                    trim: true, // Encrypted content as base64 or hex string
                },
                isEncrypted: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        suggestion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserSuggestions",
            required: false,
            index: true,
        },
        readBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: [true, "Read by user reference is required"],
                },
                readAt: {
                    type: Date,
                    default: Date.now,
                    required: [true, "Read timestamp is required"],
                },
            },
        ],
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
messageSchema.plugin(plugins.paginate);
messageSchema.plugin(plugins.softDelete);
messageSchema.plugin(plugins.privatePlugin);

// Indexes for performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ suggestion: 1 });

// Pre-save hook for logging
messageSchema.pre("save", function (next) {
    return middlewares.dbLogger("Message").call(this, next);
});

// Query only active records by default
messageSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

// Utility method to create a message
messageSchema.statics.createMessage = async function (
    chatId,
    senderId,
    content,
    suggestionId,
    createdBy
) {
    const message = await this.create({
        chat: chatId,
        sender: senderId,
        content,
        suggestion: suggestionId,
        createdBy,
        updatedBy: createdBy,
    });
    return message;
};

// Utility method to mark message as read
messageSchema.statics.markAsRead = async function (
    messageId,
    userId,
    updatedBy
) {
    return this.findByIdAndUpdate(
        messageId,
        {
            $addToSet: { readBy: { user: userId, readAt: Date.now() } },
            updatedBy,
        },
        { new: true }
    );
};

// Utility method to fetch messages for a chat
messageSchema.statics.findByChatId = async function (chatId) {
    return this.find({ chat: chatId })
        .populate("sender")
        .populate("suggestion")
        .populate("readBy.user")
        .populate("createdBy")
        .populate("updatedBy")
        .sort({ createdAt: 1 });
};

const Message = mongoose.model("Message", messageSchema);

export default Message;
