import mongoose from "mongoose";
import validator from "validator"; // Corrected import
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

// Sub-schema for episode details
const episodeDetailsSchema = {
    title: {
        type: String,
        required: [true, "Episode title is required"],
        trim: true,
        maxlength: [100, "Episode title cannot exceed 100 characters."],
    },
    episodeNumber: {
        type: Number,
        required: [true, "Episode number is required"],
        validate: {
            validator: (value) => value > 0 && Number.isInteger(value),
            message: "Episode number must be a positive integer.",
        },
    },
    runtime: {
        type: Number,
        min: [1, "Runtime must be at least 1 minute."],
        max: [600, "Runtime cannot exceed 600 minutes (10 hours)."],
        validate: {
            validator: Number.isInteger,
            message: "Runtime must be an integer number of minutes.",
        },
    },
};

// Sub-schema for season details
const seasonDetailsSchema = {
    seasonNumber: {
        type: Number,
        required: [true, "Season number is required"],
        min: [1, "Season number must be at least 1."],
    },
    title: {
        type: String,
        trim: true,
        maxlength: [100, "Season title cannot exceed 100 characters."],
    },
    numberOfEpisodes: {
        type: Number,
        required: [true, "Number of episodes is required"],
        min: [1, "Number of episodes must be at least 1."],
    },
    episodes: {
        type: [episodeDetailsSchema],
        required: false,
    },
};

/**
 * Schema for all types of series (TV series, web series, etc.).
 * Stores detailed metadata, cast, episodes, and production details.
 */
const seriesSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required for initial series creation."],
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
        year: {
            type: Number,
            required: [true, "Year is required for initial series creation."],
            min: [1888, "Year cannot be earlier than 1888."],
            max: [
                new Date().getFullYear() + 5,
                "Year cannot be more than 5 years in the future.",
            ],
        },
        rated: {
            type: String,
            enum: {
                values: ["TV-G", "TV-PG", "TV-14", "TV-MA", "R", "Unrated"],
                message:
                    "Rating must be one of: TV-G, TV-PG, TV-14, TV-MA, R, Unrated.",
            },
        },
        released: {
            // Added from Movie
            type: Date,
            validate: {
                validator: (value) => !value || value <= new Date(),
                message:
                    "Release date cannot be in the future for existing records.",
            },
        },
        runtime: {
            // Added from Movie, average runtime
            type: Number,
            min: [1, "Average runtime must be at least 1 minute."],
            max: [600, "Average runtime cannot exceed 600 minutes."],
            validate: {
                validator: Number.isInteger,
                message:
                    "Average runtime must be an integer number of minutes.",
            },
        },
        seriesType: {
            type: String,
            enum: [
                "Web Series",
                "TV Series",
                "Anime Series",
                "Mini Series",
                "Documentary Series",
                "Other",
            ],
            default: "Other",
            required: false,
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
            // Added from Movie
            type: String,
            trim: true,
        },
        seasons: {
            type: Number,
            min: [1, "Seasons must be at least 1."],
            validate: {
                validator: Number.isInteger,
                message: "Seasons must be an integer.",
            },
        },
        episodes: {
            type: Number,
            min: [1, "Episodes must be at least 1."],
            validate: {
                validator: Number.isInteger,
                message: "Episodes must be an integer.",
            },
        },
        seasonsDetails: {
            type: [seasonDetailsSchema],
            required: false,
        },
        status: {
            type: String,
            enum: {
                values: ["Ongoing", "Completed", "Canceled", "Limited"],
                message:
                    "Status must be one of: Ongoing, Completed, Canceled, Limited.",
            },
        },
        creators: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person",
                validate: {
                    validator: (arr) => !arr.length || arr.length <= 10,
                    message:
                        "Creators list, if provided, cannot exceed 10 entries.",
                },
            },
        ],
        cast: [
            {
                person: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Person",
                    required: [true, "Person ID is required for cast entry."],
                },
                character: {
                    type: String,
                    required: [
                        true,
                        "Character name is required for cast entry.",
                    ],
                    trim: true,
                },
                _id: false,
            },
        ],
        plot: {
            type: String,
            maxlength: [1000, "Plot summary cannot exceed 1000 characters."],
            trim: true,
        },
        platform: {
            type: String,
            trim: true,
            description:
                "The primary platform (e.g., Netflix, HBO, YouTube) where the series is released.",
        },
        firstAired: {
            type: Date,
            validate: {
                validator: (value) => !value || value <= new Date(),
                message: "First aired date cannot be in the future.",
            },
        },
        lastAired: {
            type: Date,
            validate: {
                validator: (value) => !value || value <= new Date(),
                message: "Last aired date cannot be in the future.",
            },
        },
        episodesList: [
            {
                season: {
                    type: Number,
                    required: [true, "Season number is required."],
                    min: [1, "Season must be at least 1."],
                },
                episode: {
                    type: Number,
                    required: [true, "Episode number is required."],
                    min: [1, "Episode must be at least 1."],
                },
                title: {
                    type: String,
                    required: [true, "Episode title is required."],
                    trim: true,
                    maxlength: [
                        100,
                        "Episode title cannot exceed 100 characters.",
                    ],
                },
                aired: {
                    type: Date,
                    validate: {
                        validator: (value) => !value || value <= new Date(),
                        message: "Aired date cannot be in the future.",
                    },
                },
                runtime: {
                    type: String,
                    match: [
                        /^\d+ min$/,
                        "Runtime must be in the format 'X min' (e.g., '47 min').",
                    ],
                },
                plot: {
                    type: String,
                    maxlength: [
                        500,
                        "Episode plot cannot exceed 500 characters.",
                    ],
                },
                _id: false,
            },
        ],
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
            emmys: {
                wins: {
                    type: Number,
                    default: 0,
                    min: [0, "Emmy wins cannot be negative."],
                },
                nominations: {
                    type: Number,
                    default: 0,
                    min: [0, "Emmy nominations cannot be negative."],
                },
            },
            awardsDetails: {
                // Added from Movie/Book
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
            imdb: {
                score: {
                    type: Number,
                    min: [0, "IMDb score cannot be less than 0."],
                    max: [10, "IMDb score cannot exceed 10."],
                },
                votes: {
                    type: Number,
                    min: [0, "IMDb votes cannot be negative."],
                },
            },
            rottenTomatoes: {
                score: {
                    type: Number,
                    min: [0, "Rotten Tomatoes score cannot be less than 0."],
                    max: [100, "Rotten Tomatoes score cannot exceed 100."],
                },
            },
            metacritic: {
                score: {
                    type: Number,
                    min: [0, "Metacritic score cannot be less than 0."],
                    max: [100, "Metacritic score cannot exceed 100."],
                },
            },
        },
        boxOffice: {
            // Added from Movie
            budget: {
                type: String,
                match: [
                    /^\$?\d+.*$/,
                    "Budget must be a valid monetary value (e.g., '$1000000').",
                ],
            },
            grossUSA: {
                type: String,
                match: [
                    /^\$?\d+.*$/,
                    "Gross USA must be a valid monetary value.",
                ],
            },
            grossWorldwide: {
                type: String,
                match: [
                    /^\$?\d+.*$/,
                    "Gross Worldwide must be a valid monetary value.",
                ],
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
        trailer: {
            // Updated from Movie
            type: {
                url: {
                    type: String,
                    validate: {
                        validator: (value) => !value || validator.isURL(value),
                        message: "Trailer URL must be a valid URL if provided.",
                    },
                },
                language: {
                    type: String,
                },
            },
            required: false, // Optional, unlike Movie
        },
        poster: {
            // Updated from Movie/Book
            url: {
                type: String,
                required: [
                    true,
                    "Poster URL is required for initial series creation.",
                ],
                validate: {
                    validator: (value) => validator.isURL(value),
                    message: "Poster URL must be a valid URL.",
                },
            },
            publicId: {
                type: String,
                required: [
                    true,
                    "Poster Public ID is required for initial series creation.",
                ],
            },
        },
        references: {
            imdbId: {
                type: String,
                required: false,
            },
            tmdbId: {
                type: String,
                required: false,
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
        availableOn: {
            streaming: {
                type: [
                    {
                        platform: {
                            type: String,
                        },
                        link: {
                            type: String,
                            validate: {
                                validator: (value) =>
                                    !value || validator.isURL(value),
                                message:
                                    "Streaming link must be a valid URL if provided.",
                            },
                        },
                    },
                ],
                required: false,
            },
            purchase: {
                type: [
                    {
                        platform: {
                            type: String,
                        },
                        link: {
                            type: String,
                            validate: {
                                validator: (value) =>
                                    !value || validator.isURL(value),
                                message:
                                    "Purchase link must be a valid URL if provided.",
                            },
                        },
                    },
                ],
                required: false,
            },
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
seriesSchema.plugin(plugins.paginate);
seriesSchema.plugin(plugins.privatePlugin);
seriesSchema.plugin(plugins.softDelete);

// Indexes for performance
seriesSchema.index({ slug: 1 });
seriesSchema.index({ title: 1, year: 1 });
seriesSchema.index({ genres: 1, "ratings.imdb.score": -1 });

// Pre-save hook to generate slug
seriesSchema.pre("save", async function (next) {
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

// Pre-save validation for cast, episodesList, and seasonsDetails size
seriesSchema.pre("save", function (next) {
    if (this.cast && this.cast.length > 50) {
        return next(new Error("Cast list cannot exceed 50 entries."));
    }
    if (this.episodesList && this.episodesList.length > 500) {
        return next(new Error("Episodes list cannot exceed 500 entries."));
    }
    if (this.seasonsDetails) {
        const totalEpisodes = this.seasonsDetails.reduce(
            (sum, season) =>
                sum + (season.episodes ? season.episodes.length : 0),
            0
        );
        if (totalEpisodes > 500) {
            return next(
                new Error("Total episodes in seasonsDetails cannot exceed 500.")
            );
        }
    }
    next();
});

// Pre-save hook for logging
seriesSchema.pre("save", function () {
    middlewares.dbLogger("Series");
});

// Method to mark as verified
seriesSchema.methods.markAsVerified = async function () {
    this.isVerified = true;
    return this.save();
};

// Soft delete method
seriesSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

// Restore soft-deleted document
seriesSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

// Query only active records by default
seriesSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

// Utility method for populated data
seriesSchema.statics.findPopulatedById = async function (id) {
    return this.findById(id)
        .populate("creators")
        .populate("cast.person")
        .populate("production.companies")
        .populate("production.studios")
        .populate("production.distributors")
        .populate("createdBy")
        .populate("updatedBy");
};

const Series = mongoose.model("Series", seriesSchema);

export default Series;
