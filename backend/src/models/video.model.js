import mongoose from "mongoose";
import validator from "validator";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

/**
 * Schema for web-based video content (e.g., YouTube videos, Instagram Reels, TikTok videos, etc.).
 * Stores metadata, creator details, engagement metrics, and availability details.
 */
const videoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required for initial video creation."],
            trim: true,
            minlength: [1, "Title must be at least 1 character long."],
            maxlength: [200, "Title cannot exceed 200 characters."], // Longer for YouTube titles
            index: true,
        },
        slug: {
            type: String,
            unique: true,
            required: [true, "Slug is required for URL generation."],
            lowercase: true,
            trim: true,
            match: [
                /^[a-z0-9-]+$/,
                "Slug must contain only lowercase letters, numbers, or hyphens.",
            ],
        },
        creator: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person",
                validate: {
                    validator: (arr) => !arr.length || arr.length <= 5,
                    message:
                        "Creators list, if provided, cannot exceed 5 entries.",
                },
            },
        ],
        platform: {
            type: String,
            required: [
                true,
                "Platform is required for initial video creation.",
            ],
            trim: true,
            enum: {
                values: [
                    "YouTube",
                    "Instagram",
                    "TikTok",
                    "Vimeo",
                    "Twitch",
                    "Other",
                ],
                message:
                    "Platform must be one of: YouTube, Instagram, TikTok, Vimeo, Twitch, Other.",
            },
        },
        videoType: {
            type: String,
            enum: {
                values: ["Video", "Short", "Reel", "Live", "Other"],
                message:
                    "Video type must be one of: Video, Short, Reel, Live, Other.",
            },
            default: "Video",
        },
        publishedDate: {
            type: Date,
            validate: {
                validator: (value) => !value || value <= new Date(),
                message:
                    "Published date cannot be in the future for existing records.",
            },
        },
        duration: {
            type: Number,
            min: [1, "Duration must be at least 1 second."],
            max: [86400, "Duration cannot exceed 24 hours (86400 seconds)."],
            validate: {
                validator: Number.isInteger,
                message: "Duration must be an integer number of seconds.",
            },
        },
        genres: {
            type: [String],
            validate: {
                validator: (arr) =>
                    !arr.length || (arr.length > 0 && arr.length <= 5),
                message:
                    "Genres, if provided, must be between 1 and 5 entries.",
            },
            index: true,
        },
        language: {
            type: [String],
            validate: {
                validator: (arr) => !arr.length || arr.length > 0,
                message: "At least one language must be specified if provided.",
            },
        },
        country: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            maxlength: [5000, "Description cannot exceed 5000 characters."], // YouTube allows long descriptions
            trim: true,
        },
        engagement: {
            views: {
                type: Number,
                default: 0,
                min: [0, "Views cannot be negative."],
            },
            likes: {
                type: Number,
                default: 0,
                min: [0, "Likes cannot be negative."],
            },
            comments: {
                type: Number,
                default: 0,
                min: [0, "Comments cannot be negative."],
            },
        },
        awards: {
            wins: {
                type: Number,
                default: 0,
                min: [0, "Award wins cannot be negative."],
            },
            nominations: {
                type: Number,
                default: 0,
                min: [0, "Award nominations cannot be negative."],
            },
            awardsDetails: {
                type: [
                    {
                        awardName: {
                            type: String,
                            required: [true, "Award name is required"],
                        },
                        awardFor: {
                            type: String,
                            required: false,
                        },
                    },
                ],
                required: false,
            },
        },
        ratings: {
            youtube: {
                // Platform-specific for YouTube
                likes: {
                    type: Number,
                    min: [0, "YouTube likes cannot be negative."],
                },
                dislikes: {
                    type: Number,
                    min: [0, "YouTube dislikes cannot be negative."],
                },
            },
            custom: {
                // For other platforms or user ratings
                score: {
                    type: Number,
                    min: [0, "Custom score cannot be less than 0."],
                    max: [5, "Custom score cannot exceed 5."],
                },
                votes: {
                    type: Number,
                    min: [0, "Custom votes cannot be negative."],
                },
            },
        },
        production: {
            companies: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "ProductionCompany",
                },
            ],
            studios: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Studio",
                },
            ],
            distributors: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Distributor",
                },
            ],
        },
        poster: {
            url: {
                type: String,
                required: false,
                validate: {
                    validator: (value) => validator.isURL(value),
                    message: "Poster URL must be a valid URL.",
                },
            },
            publicId: {
                type: String,
                required: false,
            },
        },
        videoUrl: {
            type: String,
            required: [
                true,
                "Video URL is required for initial video creation.",
            ],
            validate: {
                validator: (value) => validator.isURL(value),
                message: "Video URL must be a valid URL.",
            },
        },
        keywords: {
            type: [String],
            validate: {
                validator: (arr) => !arr.length || arr.length <= 20,
                message: "Keywords, if provided, cannot exceed 20 entries.",
            },
            index: true,
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
            required: [true, "Created by is required"],
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
videoSchema.plugin(plugins.paginate);
videoSchema.plugin(plugins.privatePlugin);
videoSchema.plugin(plugins.softDelete);

// Indexes for performance
videoSchema.index({ title: 1, publishedDate: 1 });
videoSchema.index({ genres: 1, "engagement.views": -1 });

// Pre-save hook to generate slug
videoSchema.pre("save", async function (next) {
    if (this.isModified("title") || !this.slug) {
        const baseSlug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        let slug = baseSlug;
        let counter = 1;
        while (
            await this.constructor.findOne({ slug, _id: { $ne: this._id } })
        ) {
            slug = `${baseSlug}-${counter++}`;
        }
        this.slug = slug;
    }
    next();
});


// Pre-save validation for creator size
videoSchema.pre("save", function (next) {
    if (this.creator && this.creator.length > 5) {
        return next(new Error("Creator list cannot exceed 5 entries."));
    }
    next();
});

// Pre-save hook for logging
videoSchema.pre("save", function (next) {
    return middlewares.dbLogger("Video").call(this, next);
});

// Method to mark as verified
videoSchema.methods.markAsVerified = async function () {
    this.isVerified = true;
    return this.save();
};

// Soft delete method
videoSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

// Restore soft-deleted document
videoSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

// Query only active records by default
videoSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

// Utility method for populated data
videoSchema.statics.findPopulatedById = async function (id) {
    return this.findById(id)
        .populate("creator")
        .populate("production.companies")
        .populate("production.studios")
        .populate("production.distributors")
        .populate("createdBy")
        .populate("updatedBy");
};

const Video = mongoose.model("Video", videoSchema);

export default Video;
