import mongoose from "mongoose";
import validator from "validator"; // Correct import
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const movieSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required for initial movie creation."],
            trim: true,
            minlength: [1, "Title must be at least 1 characters long."],
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
            required: [
                true,
                "Release year is required for initial movie creation.",
            ],
            min: [1888, "Year cannot be earlier than 1888."],
            max: [
                new Date().getFullYear() + 5,
                "Year cannot be more than 5 years in the future.",
            ],
        },
        poster: {
            url: {
                type: String,
                required: false, // Relaxed requirement
                default: "https://via.placeholder.com/500", // Default placeholder
                validate: {
                    validator: (value) => !value || validator.isURL(value),
                    message: "Poster must be a valid URL.",
                },
            },
            publicId: {
                type: String,
                required: false, // Relaxed requirement
                default: "default-poster",
            },
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
        runtime: {
            type: Number,
            min: [1, "Runtime must be at least 1 minute."],
            max: [600, "Runtime cannot exceed 600 minutes (10 hours)."],
            validate: {
                validator: Number.isInteger,
                message: "Runtime must be an integer number of minutes.",
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
        director: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person",
            },
        ],
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
        cast: [
            {
                person: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Person",
                    required: [true, "Person ID is required for cast entry."],
                },
                character: {
                    type: String,
                    required: false,
                    trim: true,
                },
                _id: false,
            },
        ],
        plot: {
            type: String,
            maxlength: [1500, "Plot summary cannot exceed 1500 characters."],
            trim: true,
        },
        language: {
            type: [String],
            validate: {
                validator: (arr) => !arr.length || arr.length > 0,
                message: "At least one language must be specified if provided.",
            },
        },
        country: {
            type: [String],
            trim: true,
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
            oscars: {
                wins: {
                    type: Number,
                    default: 0,
                    min: [0, "Oscar wins cannot be negative."],
                },
                nominations: {
                    type: Number,
                    default: 0,
                    min: [0, "Oscar nominations cannot be negative."],
                },
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
            type: {
                url: {
                    type: String,
                    required: [true, "trailer url is required"],
                    validate: {
                        validator: (value) => !value || validator.isURL(value),
                        message: "Trailer must be a valid URL if provided.",
                    },
                },
                language: {
                    type: String,
                    required: [true, "trailer language is required"],
                    default: "NA",
                },
            },
            required: false,
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
                            required: [true, "streaming platform is required"],
                        },
                        link: {
                            type: String,
                            required: [true, " streaming link is required"],
                            validate: {
                                validator: (value) =>
                                    !value || validator.isURL(value),
                                message:
                                    "streaming link must be a valid URL if provided.",
                            },
                        },
                    },
                ],
            },
            purchase: {
                type: [
                    {
                        platform: {
                            type: String,
                            required: [true, "purchase platform is required"],
                        },
                        link: {
                            type: String,
                            required: [true, " purchase link is required"],
                            validate: {
                                validator: (value) =>
                                    !value || validator.isURL(value),
                                message:
                                    "purchase link must be a valid URL if provided.",
                            },
                        },
                    },
                ],
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
            required: false, // Relaxed requirement
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Relaxed requirement
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

movieSchema.plugin(plugins.paginate);
movieSchema.plugin(plugins.privatePlugin);
movieSchema.plugin(plugins.softDelete);

// Indexes for performance
movieSchema.index({ slug: 1 });
movieSchema.index({ title: 1, year: 1 });
movieSchema.index({ genres: 1, "ratings.imdb.score": -1 });

// Pre-save hook to generate slug
movieSchema.pre("save", async function (next) {
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

// Pre-save validation for cast size
movieSchema.pre("save", function (next) {
    if (this.cast && this.cast.length > 50) {
        return next(new Error("Cast list cannot exceed 50 entries."));
    }
    next();
});

// Method to mark as verified
movieSchema.methods.markAsVerified = async function () {
    this.isVerified = true;
    return this.save();
};

// Soft delete method
movieSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

// Restore soft-deleted document
movieSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

// Query only active records by default
movieSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

movieSchema.pre("save", function () {
    middlewares.dbLogger("Movie");
});

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;
