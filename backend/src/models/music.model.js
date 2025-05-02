import mongoose from "mongoose";
import validator from "validator";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const musicSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required for music creation."],
            trim: true,
            minlength: [1, "Title must be at least 1 character long."],
            maxlength: [100, "Title cannot exceed 100 characters."],
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
        artist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Person",
            required: [true, "Artist reference is required."],
        },
        featuredArtists: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person",
            },
        ],
        album: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MusicAlbum",
        },
        releaseYear: {
            type: Number,
            required: [true, "Release year is required."],
            min: [1888, "Release year cannot be earlier than 1888."],
            max: [
                new Date().getFullYear() + 5,
                "Release year cannot be more than 5 years in the future.",
            ],
        },
        duration: {
            type: String,
            match: [
                /^\d+ min( \d+ sec)?$/,
                "Duration must be in the format 'X min Y sec' (e.g., '3 min 22 sec').",
            ],
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
        mood: {
            type: [String],
            validate: {
                validator: (arr) => !arr.length || arr.length <= 5,
                message: "Mood entries, if provided, cannot exceed 5.",
            },
        },
        language: {
            type: String,
            trim: true,
        },
        bpm: {
            type: Number,
            min: [20, "BPM must be at least 20."],
            max: [300, "BPM cannot exceed 300."],
            validate: {
                validator: Number.isInteger,
                message: "BPM must be an integer.",
            },
        },
        key: {
            type: String,
            trim: true,
            maxlength: [20, "Key cannot exceed 20 characters."],
        },
        formats: {
            type: [String],
            enum: ["Digital", "CD", "Vinyl", "Cassette", "Other"],
        },
        writers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person",
                validate: {
                    validator: (arr) => !arr.length || arr.length <= 10,
                    message:
                        "Writers list, if provided, cannot exceed 10 entries.",
                },
            },
        ],
        producers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person",
                validate: {
                    validator: (arr) => !arr.length || arr.length <= 10,
                    message:
                        "Producers list, if provided, cannot exceed 10 entries.",
                },
            },
        ],
        engineers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person",
                validate: {
                    validator: (arr) => !arr.length || arr.length <= 10,
                    message:
                        "Engineers list, if provided, cannot exceed 10 entries.",
                },
            },
        ],
        certifications: {
            type: Map,
            of: String,
        },
        remixes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Music",
                required: false,
            },
        ],
        spotifyId: { type: String },
        availableOn: {
            spotify: {
                plays: { type: String },
                link: {
                    type: String,
                    validate: {
                        validator: (value) => !value || validator.isURL(value),
                        message:
                            "Spotify link must be a valid URL if provided.",
                    },
                },
            },
            appleMusic: {
                plays: { type: String },
                link: {
                    type: String,
                    validate: {
                        validator: (value) => !value || validator.isURL(value),
                        message:
                            "Apple Music link must be a valid URL if provided.",
                    },
                },
            },
            youtube: {
                views: { type: String },
                link: {
                    type: String,
                    validate: {
                        validator: (value) => !value || validator.isURL(value),
                        message:
                            "YouTube link must be a valid URL if provided.",
                    },
                },
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
            grammys: {
                wins: {
                    type: Number,
                    default: 0,
                    min: [0, "Grammy wins cannot be negative."],
                },
                nominations: {
                    type: Number,
                    default: 0,
                    min: [0, "Grammy nominations cannot be negative."],
                },
            },
            billboardMusicAwards: {
                wins: {
                    type: Number,
                    default: 0,
                    min: [0, "Billboard Music Award wins cannot be negative."],
                },
                nominations: {
                    type: Number,
                    default: 0,
                    min: [
                        0,
                        "Billboard Music Award nominations cannot be negative.",
                    ],
                },
            },
        },
        ratings: {
            metacritic: {
                score: {
                    type: Number,
                    min: [0, "Metacritic score cannot be less than 0."],
                    max: [100, "Metacritic score cannot exceed 100."],
                },
                votes: {
                    type: Number,
                    min: [0, "Metacritic votes cannot be negative."],
                },
            },
            pitchfork: {
                score: {
                    type: Number,
                    min: [0, "Pitchfork score cannot be less than 0."],
                    max: [10, "Pitchfork score cannot exceed 10."],
                },
            },
            userReviews: {
                type: [
                    {
                        reviewer: {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: "User",
                            required: true,
                        },
                        rating: {
                            type: Number,
                            required: true,
                            min: [1, "Rating must be at least 1."],
                            max: [10, "Rating cannot exceed 10."],
                        },
                        comment: {
                            type: String,
                            maxlength: [
                                500,
                                "Comment cannot exceed 500 characters.",
                            ],
                        },
                    },
                ],
                validate: {
                    validator: (arr) => !arr.length || arr.length <= 100,
                    message: "User reviews cannot exceed 100 entries.",
                },
            },
        },
        lyrics: {
            preview: { type: String },
            fullLyricsLink: {
                type: String,
                validate: {
                    validator: (value) => !value || validator.isURL(value),
                    message:
                        "Full lyrics link must be a valid URL if provided.",
                },
            },
        },
        recommendedBy: {
            name: { type: String },
            contact: { type: String },
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
            required: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

musicSchema.plugin(plugins.paginate);
musicSchema.plugin(plugins.privatePlugin);
musicSchema.plugin(plugins.softDelete);

musicSchema.index({ slug: 1 });
musicSchema.index({ title: 1, releaseYear: 1 });
musicSchema.index({ genres: 1 });

musicSchema.pre("save", async function (next) {
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

musicSchema.pre("save", function (next) {
    return middlewares.dbLogger("Music").call(this, next);
});
musicSchema.methods.markAsVerified = async function () {
    this.isVerified = true;
    return this.save();
};

musicSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

musicSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

musicSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

musicSchema.statics.findPopulatedById = async function (id) {
    return this.findById(id)
        .populate("artist")
        .populate("featuredArtists")
        .populate("album")
        .populate("writers")
        .populate("producers")
        .populate("engineers")
        .populate("ratings.userReviews.reviewer")
        .populate("createdBy")
        .populate("updatedBy");
};

const Music = mongoose.model("Music", musicSchema);

export default Music;
