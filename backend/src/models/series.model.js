import mongoose from "mongoose";
import validator from "validator";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

// Sub-schema for episode details
const episodeDetailsSchema = {
    title: {
        type: String,
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
    overview: {
        type: String,
        trim: true,
        maxlength: [1500, "Episode overview cannot exceed 1500 characters."],
    },
    air_date: {
        type: Date,
    },
    vote_average: {
        type: Number,
        min: [0, "Vote average cannot be less than 0."],
        max: [10, "Vote average cannot exceed 10."],
    },
    vote_count: {
        type: Number,
        min: [0, "Vote count cannot be negative."],
    },
};

// Sub-schema for season details
const seasonDetailsSchema = {
    seasonNumber: {
        type: Number,
        required: [true, "Season number is required"],
        min: [0, "Season number can be 0 for specials."], // TMDB uses 0 for specials
    },
    title: {
        type: String,
        trim: true,
        maxlength: [100, "Season title cannot exceed 100 characters."],
    },
    episodeCount: {
        type: Number,
        required: [true, "Number of episodes is required"],
        min: [1, "Number of episodes must be at least 1."],
    },
    overview: {
        type: String,
        trim: true,
        maxlength: [1500, "Season overview cannot exceed 1500 characters."],
    },
    air_date: {
        type: Date,
    },
    poster_path: {
        type: String,
        trim: true,
    },
    vote_average: {
        type: Number,
        min: [0, "Vote average cannot be less than 0."],
        max: [10, "Vote average cannot exceed 10."],
    },
    episodes: {
        type: [episodeDetailsSchema],
        required: false,
    },
};

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
            required: false,
            min: [1888, "Year cannot be earlier than 1888."],
            max: [
                new Date().getFullYear() + 5,
                "Year cannot be more than 5 years in the future.",
            ],
        },
        rated: {
            type: String,
        },
        released: {
            type: Date,
            validate: {
                validator: (value) => !value || value <= new Date(),
                message:
                    "Release date cannot be in the future for existing records.",
            },
        },
        plot: {
            type: String,
            maxlength: [1500, "Plot summary cannot exceed 1500 characters."],
            trim: true,
        },
        runtime: {
            type: [Number], // Changed to array to support TMDB's episode_run_time
            validate: {
                validator: (arr) => {
                    if (!arr) return;
                    return arr.every(
                        (r) => Number.isInteger(r) && r >= 1 && r <= 600
                    );
                },
                message:
                    "All runtimes must be integers between 1 and 600 minutes.",
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
                "Reality Show",
                "Talk Show",
                "Scripted",
                "Miniseries", // Added for TMDB's type
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
            type: [String], // Changed to array for production_countries
            trim: true,
        },
        seasons: {
            type: Number,
            min: [0, "Seasons can be 0 for specials."],
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
        },
        creators: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Person" }],
            required: false,
        },
        cast: {
            type: [
                {
                    person: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Person",
                    },
                    character: String,
                },
            ],
            validate: {
                validator: (arr) => arr.length <= 50,
                message: "Cast list cannot exceed 50 entries.",
            },
        },
        production: {
            companies: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "ProductionCompany",
                },
            ],
            networks: [
                {
                    name: String,
                    id: Number, // TMDB's network ID
                    logo_path: String,
                    origin_country: String,
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
        references: {
            tmdbId: {
                type: String,
                unique: true,
                sparse: true,
            },
            imdbId: String,
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
            tmdb: {
                score: {
                    type: Number,
                    min: [0, "TMDB score cannot be less than 0."],
                    max: [10, "TMDB score cannot exceed 10."],
                },
                votes: {
                    type: Number,
                    min: [0, "TMDB votes cannot be negative."],
                },
            },
        },
        poster: {
            url: {
                type: String,
                trim: true,
            },
            publicId: String,
        },
        backdrop: {
            url: {
                type: String,
                trim: true,
            },
            publicId: String,
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

// Plugins
seriesSchema.plugin(plugins.paginate);
seriesSchema.plugin(plugins.privatePlugin);
seriesSchema.plugin(plugins.softDelete);

// Indexes for performance
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

// Pre-save validation for cast and seasonsDetails size
seriesSchema.pre("save", function (next) {
    if (this.cast && this.cast.length > 50) {
        return next(new Error("Cast list cannot exceed 50 entries."));
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
seriesSchema.pre("save", function (next) {
    return middlewares.dbLogger("Series").call(this, next);
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
