// notification.js
import mongoose from "mongoose";
import validator from "validator";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

/**
 * Schema for storing user notifications (e.g., follow requests, suggestions, likes, comments).
 * Tracks sender, recipient, type, and related content with read/unread status.
 */
const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [
                true,
                "Recipient is required for notification creation.",
            ],
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Optional for system-generated notifications
            index: true,
        },
        type: {
            type: String,
            required: [true, "Notification type is required."],
            enum: {
                values: [
                    "Followed",
                    "FollowRequest",
                    "FollowAccepted",
                    "Suggestion",
                    "Like",
                    "Comment",
                    "NewContent",
                    "Mention",
                    "System",
                    "Other",
                ],
                message:
                    "Type must be one of: FollowRequest, FollowAccepted, Suggestion, Like, Comment, NewContent, Mention, System, Other.",
            },
            index: true,
        },
        message: {
            type: String,
            required: [true, "Message is required for notification creation."],
            trim: true,
            maxlength: [500, "Message cannot exceed 500 characters."],
        },
        relatedContent: {
            type: {
                contentType: {
                    type: String,
                    enum: [
                        "Movie",
                        "Book",
                        "Series",
                        "Video",
                        "Music",
                        "Comment",
                        "Other",
                    ],
                    required: [
                        true,
                        "Content type is required if related content is provided.",
                    ],
                },
                content: {
                    type: mongoose.Schema.Types.ObjectId,
                    refPath: "contentType",
                    required: [
                        true,
                        "Content ID is required if related content is provided.",
                    ],
                },
            },
            required: false, // Optional for notifications like FollowRequest
        },
        status: {
            type: String,
            enum: {
                values: ["Unread", "Read", "Dismissed"],
                message: "Status must be one of: Unread, Read, Dismissed.",
            },
            default: "Unread",
        },
        actionUrl: {
            type: String,
        },
        metadata: {
            type: {
                suggestionType: {
                    type: String,
                    enum: [
                        "Movie",
                        "Book",
                        "Music",
                        "Series",
                        "Video",
                        "Other",
                    ],
                    required: false,
                },
                commentText: {
                    type: String,
                    maxlength: [
                        500,
                        "Comment text cannot exceed 500 characters.",
                    ],
                },
                followRequestStatus: {
                    type: String,
                    enum: ["Pending", "Accepted", "Rejected"],
                },
                followRequestId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "UserRelationship",
                },
            },
            required: false, // Additional context for specific notification types
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Optional at creation
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Plugins
notificationSchema.plugin(plugins.paginate);
notificationSchema.plugin(plugins.privatePlugin);
notificationSchema.plugin(plugins.softDelete);

// Indexes for performance
notificationSchema.index({ recipient: 1, createdAt: -1 }); // For fetching user notifications
notificationSchema.index({ sender: 1 });
notificationSchema.index({ type: 1, status: 1 });

// Pre-save hook for logging
notificationSchema.pre("save", function (next) {
    return middlewares.dbLogger("Notification").call(this, next);
});
// Method to mark as read
notificationSchema.methods.markAsRead = async function () {
    this.status = "Read";
    return this.save();
};

// Method to mark as dismissed
notificationSchema.methods.markAsDismissed = async function () {
    this.status = "Dismissed";
    return this.save();
};

// Soft delete method
notificationSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

// Restore soft-deleted document
notificationSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

// Query only active records by default
notificationSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

// Utility method for populated data
notificationSchema.statics.findPopulatedById = async function (id) {
    return this.findById(id)
        .populate("recipient")
        .populate("sender")
        .populate("createdBy")
        .populate("updatedBy")
        .populate({
            path: "relatedContent.contentId",
            model: (doc) => doc.relatedContent.contentType, // Dynamically select model
        });
};

// Find notifications for a user
notificationSchema.statics.findByRecipient = async function (
    recipientId,
    status = "Unread"
) {
    return this.find({ recipient: recipientId, status })
        .populate("sender")
        .sort({ createdAt: -1 });
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
