import mongoose from "mongoose";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const userSuggestionsSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Sender reference is required"],
            index: true,
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Recipient reference is required"],
            index: true,
        },
        content: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "contentType",
            required: [true, "Content reference is required"],
        },
        contentType: {
            type: String,
            enum: {
                values: ["Movie", "Series", "Book", "Music"],
                message:
                    "Content type must be one of: Movie, Series, Book, Music",
            },
            required: [true, "Content type is required"],
        },
        status: {
            type: String,
            enum: {
                values: [
                    "WantToConsume",
                    "Consuming",
                    "Consumed",
                    "NotInterested",
                ],
                message:
                    "Status must be one of: WantToConsume, Consuming, Consumed, NotInterested",
            },
            required: false,
        },
        note: {
            type: String,
            trim: true,
            maxlength: [500, "Note cannot exceed 500 characters"],
            required: false,
        },
        userContent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserContent",
            required: false,
            index: true,
        },
        respondedAt: {
            type: Date,
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

userSuggestionsSchema.plugin(plugins.paginate);
userSuggestionsSchema.plugin(plugins.privatePlugin);
userSuggestionsSchema.plugin(plugins.softDelete);

userSuggestionsSchema.index(
    { sender: 1, recipient: 1, content: 1 },
    { unique: true }
);
userSuggestionsSchema.index({ sender: 1, status: 1 });
userSuggestionsSchema.index({ recipient: 1, status: 1 });
userSuggestionsSchema.index({ content: 1 });
userSuggestionsSchema.index({ userContent: 1 });

// Pre-save hook to update respondedAt on status or note change
userSuggestionsSchema.pre("save", function (next) {
    if (this.isModified("status") || this.isModified("note")) {
        if (this.status !== "Pending" && !this.respondedAt) {
            this.respondedAt = Date.now();
        }
    }
    next();
});

// Pre-save hook for logging
userSuggestionsSchema.pre("save", function (next) {
    return middlewares.dbLogger("UserSuggestions").call(this, next);
});

// Method to mark as verified
userSuggestionsSchema.methods.markAsVerified = async function () {
    this.isVerified = true;
    return this.save();
};

// Soft delete method
userSuggestionsSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

// Restore soft-deleted document
userSuggestionsSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

// Query only active records by default
userSuggestionsSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

// Utility method to create a suggestion
userSuggestionsSchema.statics.createSuggestion = async function (
    senderId,
    recipientId,
    contentId,
    contentType
) {
    return this.create({
        sender: senderId,
        recipient: recipientId,
        content: contentId,
        contentType,
        status: "Pending",
        createdBy: senderId,
    });
};

// Utility method to respond to a suggestion
userSuggestionsSchema.statics.respondToSuggestion = async function (
    suggestionId,
    status,
    note,
    updatedBy
) {
    return this.findByIdAndUpdate(
        suggestionId,
        {
            status,
            note,
            respondedAt: Date.now(),
            updatedBy,
        },
        { new: true }
    );
};

// Utility method to link suggestion to UserContent
userSuggestionsSchema.statics.linkToUserContent = async function (
    suggestionId,
    userContentId,
    updatedBy
) {
    return this.findByIdAndUpdate(
        suggestionId,
        { userContent: userContentId, updatedBy },
        { new: true }
    );
};

// Utility method to fetch suggestions sent by a user
userSuggestionsSchema.statics.findSentByUserId = async function (userId) {
    return this.find({ sender: userId })
        .populate("content")
        .populate("sender")
        .populate("recipient")
        .populate("userContent")
        .populate("createdBy")
        .populate("updatedBy");
};

// Utility method to fetch suggestions received by a user
userSuggestionsSchema.statics.findReceivedByUserId = async function (userId) {
    return this.find({ recipient: userId })
        .populate("content")
        .populate("sender")
        .populate("recipient")
        .populate("userContent")
        .populate("createdBy")
        .populate("updatedBy");
};

// Utility method for populated single suggestion
userSuggestionsSchema.statics.findPopulatedById = async function (id) {
    return this.findById(id)
        .populate("content")
        .populate("sender")
        .populate("recipient")
        .populate("userContent")
        .populate("createdBy")
        .populate("updatedBy");
};

const UserSuggestions = mongoose.model(
    "UserSuggestions",
    userSuggestionsSchema
);

export default UserSuggestions;
