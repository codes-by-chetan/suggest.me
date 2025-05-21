import mongoose from "mongoose";
import validator from "validator";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

/**
 * Schema for UserContent to store user preferences for content (Movies, Series, Books, Music).
 * One document per user-content pair, supporting WantToConsume, Consuming, Consumed, and NotInterested statuses.
 */
const userContentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User reference is required"],
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
            required: [true, "Status is required"],
            default: "WantToConsume",
        },
        suggestion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserSuggestions",
            required: false,
            index: true,
        },
        addedAt: {
            type: Date,
            default: Date.now,
            required: [true, "Added timestamp is required"],
        },
        lastUpdatedAt: {
            type: Date,
            default: Date.now,
            required: [true, "Last updated timestamp is required"],
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
userContentSchema.plugin(plugins.paginate);
userContentSchema.plugin(plugins.privatePlugin);
userContentSchema.plugin(plugins.softDelete);

// Indexes for performance
userContentSchema.index({ user: 1, content: 1 }, { unique: true });
userContentSchema.index({ user: 1, status: 1 });
userContentSchema.index({ user: 1, contentType: 1 });
userContentSchema.index({ content: 1 });
userContentSchema.index({ suggestion: 1 });

// Pre-save hook to update lastUpdatedAt on status change
userContentSchema.pre("save", function (next) {
    if (this.isModified("status")) {
        this.lastUpdatedAt = Date.now();
    }
    next();
});

// Pre-save hook for logging
userContentSchema.pre("save", function (next) {
    return middlewares.dbLogger("UserContent").call(this, next);
});

// Method to mark as verified
userContentSchema.methods.markAsVerified = async function () {
    this.isVerified = true;
    return this.save();
};

// Soft delete method
userContentSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

// Restore soft-deleted document
userContentSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

// Query only active records by default
userContentSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

// Utility method to add content
userContentSchema.statics.addContent = async function (
    userId,
    contentId,
    contentType,
    status = "WantToConsume",
    suggestionId
) {
    return this.create({
        user: userId,
        content: contentId,
        contentType,
        status,
        suggestion: suggestionId,
        createdBy: userId,
    });
};

// Utility method to update status
userContentSchema.statics.updateStatus = async function (
    userId,
    contentId,
    status,
    updatedBy
) {
    return this.findOneAndUpdate(
        { user: userId, content: contentId },
        { status, lastUpdatedAt: Date.now(), updatedBy },
        { new: true }
    );
};

// Utility method to fetch user’s list with populated content
userContentSchema.statics.findByUserId = async function (userId) {
    return this.find({ user: userId })
        .populate("content")
        .populate("user")
        .populate("suggestion")
        .populate("createdBy")
        .populate("updatedBy");
};

// Utility method for populated single entry
userContentSchema.statics.findPopulatedById = async function (id) {
    return this.findById(id)
        .populate("content")
        .populate("user")
        .populate("suggestion")
        .populate("createdBy")
        .populate("updatedBy");
};

const UserContent = mongoose.model("UserContent", userContentSchema);

export default UserContent;
