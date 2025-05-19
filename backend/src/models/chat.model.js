import mongoose from "mongoose";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const chatSchema = new mongoose.Schema(
    {
        chatType: {
            type: String,
            enum: {
                values: ["private", "group"],
                message: "Chat type must be either 'private' or 'group'",
            },
            required: [true, "Chat type is required"],
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: [true, "Participant reference is required"],
                index: true,
            },
        ],
        groupName: {
            type: String,
            trim: true,
            maxlength: [100, "Group name cannot exceed 100 characters"],
            required: function () {
                return this.chatType === "group";
            },
        },
        groupAvatar: {
            type: String,
            trim: true,
            validate: {
                validator: (value) => !value || validator.isURL(value),
                message: "Invalid group avatar URL",
            },
            required: false,
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
chatSchema.plugin(plugins.paginate);
chatSchema.plugin(plugins.softDelete);
chatSchema.plugin(plugins.privatePlugin);

// Indexes for performance
chatSchema.index({ participants: 1 });
chatSchema.index({ chatType: 1 });
chatSchema.index({ encryptionKey: 1 });

// Pre-save hook for logging
chatSchema.pre("save", function (next) {
    return middlewares.dbLogger("Chat").call(this, next);
});

// Pre-save hook to validate participants
chatSchema.pre("save", function (next) {
    if (this.chatType === "private" && this.participants.length !== 2) {
        return next(new Error("Private chats must have exactly 2 participants"));
    }
    if (this.chatType === "group" && this.participants.length < 2) {
        return next(new Error("Group chats must have at least 2 participants"));
    }
    next();
});

// Query only active records by default
chatSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

// Utility method to create a private chat
chatSchema.statics.createPrivateChat = async function (userId1, userId2, createdBy) {
    const chat = await this.create({
        chatType: "private",
        participants: [userId1, userId2],
        createdBy,
        updatedBy: createdBy,
    });
    return chat;
};

// Utility method to create a group chat
chatSchema.statics.createGroupChat = async function (groupName, participants, createdBy) {
    const chat = await this.create({
        chatType: "group",
        groupName,
        participants,
        createdBy,
        updatedBy: createdBy,
    });
    return chat;
};

// Utility method to add participant to group chat
chatSchema.statics.addParticipant = async function (chatId, userId, updatedBy) {
    return this.findByIdAndUpdate(
        chatId,
        { $addToSet: { participants: userId }, updatedBy },
        { new: true }
    );
};

// Utility method to remove participant from group chat
chatSchema.statics.removeParticipant = async function (chatId, userId, updatedBy) {
    return this.findByIdAndUpdate(
        chatId,
        { $pull: { participants: userId }, updatedBy },
        { new: true }
    );
};

// Utility method to fetch chats for a user
chatSchema.statics.findByUserId = async function (userId) {
    return this.find({ participants: userId })
        .populate("participants")
        .populate("encryptionKey")
        .populate("createdBy")
        .populate("updatedBy");
};

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;