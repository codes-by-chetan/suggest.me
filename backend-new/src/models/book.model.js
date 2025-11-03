import mongoose from "mongoose";
import validator from "validator";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const bookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required for initial book creation."],
            trim: true,
            minlength: [1, "Title must be at least 1 character long."],
            maxlength: [150, "Title cannot exceed 150 characters."],
            index: true,
        },
        subtitle: {
            type: String,
            trim: true,
            maxlength: [150, "Subtitle cannot exceed 150 characters."],
            index: true,
        },
        slug: {
            type: String,
        },
        author: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person",
                validate: {
                    validator: (arr) => !arr.length || arr.length <= 5,
                    message: "Authors list, if provided, cannot exceed 5 entries.",
                },
            },
        ],
        bookType: {
            type: String,
            enum: [
                "Novel",
                "Manga",
                "Comics",
                "Manhwa",
                "Graphic Novel",
                "Anthology",
                "Light Novel",
                "Webtoon",
                "Novella",
                "Short Story",
                "Poetry",
                "Play",
                "Other",
                "paperback",
            ],
            required: true,
        },
        publishedYear: {
            type: Number,
            required: [
                true,
                "Published year is required for initial book creation.",
            ],
            min: [0, "Published year cannot be before 0 AD."],
            max: [
                new Date().getFullYear() + 5,
                "Published year cannot be more than 5 years in the future.",
            ],
        },
        industryIdentifiers: [
            {
                type: {
                    type: String,
                    enum: ["ISBN_10", "ISBN_13", "OTHER"],
                    required: true,
                },
                identifier: {
                    type: String,
                    required: true,
                    trim: true,
                },
            },
        ],
        genres: {
            type: [String],
            validate: {
                validator: (arr) =>
                    !arr.length || (arr.length > 0 && arr.length <= 10),
                message: "Genres, if provided, must be between 1 and 10 entries.",
            },
            index: true,
        },
        language: {
            type: String,
            trim: true,
            validate: {
                validator: (value) =>
                    !value || validator.isISO6391(value.toLowerCase()),
                message: "Language must be a valid ISO 639-1 code.",
            },
        },
        googleBooksId: {
            type: String,
            unique: true,
            sparse: true,
        },
        pages: {
            type: Number,
            min: [0, "Pages cannot be negative."],
        },
        publisher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Publisher",
        },
        description: {
            type: String,
            maxlength: [2000, "Description cannot exceed 2000 characters."],
            trim: true,
        },
        seriesInfo: {
            seriesId: {
                type: String,
                trim: true,
            },
            bookDisplayNumber: {
                type: String,
                trim: true,
            },
            seriesBookType: {
                type: String,
                enum: ["COLLECTED_EDITION", "SINGLE_ISSUE", "OTHER"],
            },
        },
        maturityRating: {
            type: String,
            enum: ["NOT_MATURE", "MATURE", "UNKNOWN"],
            default: "UNKNOWN",
        },
        readingModes: {
            text: {
                type: Boolean,
                default: false,
            },
            image: {
                type: Boolean,
                default: false,
            },
        },
        canonicalLink: {
            type: String,
            validate: {
                validator: (value) => !value || validator.isURL(value),
                message: "Canonical link must be a valid URL.",
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
            goodreads: {
                score: {
                    type: Number,
                    min: [0, "Goodreads score cannot be less than 0."],
                    max: [5, "Goodreads score cannot exceed 5."],
                },
                votes: {
                    type: Number,
                    min: [0, "Goodreads votes cannot be negative."],
                },
            },
            amazon: {
                score: {
                    type: Number,
                    min: [0, "Amazon score cannot be less than 0."],
                    max: [5, "Amazon score cannot exceed 5."],
                },
                votes: {
                    type: Number,
                    min: [0, "Amazon votes cannot be negative."],
                },
            },
        },
        sales: {
            copiesSold: {
                type: String,
                match: [
                    /^\d+.*$/,
                    "Copies sold must be a valid number (e.g., '150 million').",
                ],
            },
            bestSellerRank: {
                type: Number,
                min: [1, "Best seller rank must be at least 1."],
            },
        },
        adaptations: {
            movies: {
                type: [String],
            },
            tvSeries: {
                type: [String],
            },
        },
        coverImage: {
            url: {
                type: String,
                required: [
                    true,
                    "Cover image URL is required for initial book creation.",
                ],
                validate: {
                    validator: (value) => validator.isURL(value),
                    message: "Cover image must be a valid URL.",
                },
            },
            publicId: {
                type: String,
                required: [
                    true,
                    "Cover image Public ID is required for initial book creation.",
                ],
            },
        },
        availableOn: {
            bookstores: {
                type: [
                    {
                        name: {
                            type: String,
                            required: [true, "bookstore name is required"],
                        },
                        storeType: {
                            type: String,
                            enum: ["Physical", "Online"],
                            required: [true, "Store type is required"],
                        },
                        address: {
                            type: String,
                            required: false,
                        },
                        contactNumber: {
                            type: String,
                        },
                        link: {
                            type: String,
                            required: false,
                            validate: {
                                validator: (value) =>
                                    !value || validator.isURL(value),
                                message:
                                    "bookstore link must be a valid URL if provided.",
                            },
                        },
                    },
                ],
            },
            ebooks: {
                type: [
                    {
                        platform: {
                            type: String,
                            required: [true, "streaming platform is required"],
                        },
                        link: {
                            type: String,
                            required: [true, "streaming link is required"],
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
            audiobooks: {
                type: [
                    {
                        platform: {
                            type: String,
                            required: [true, "streaming platform is required"],
                        },
                        link: {
                            type: String,
                            required: [true, "streaming link is required"],
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
        },
        distributor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Distributor",
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
        reviews: {
            type: [
                {
                    reviewer: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                        required: [true, "Reviewer is required"],
                    },
                    rating: {
                        type: Number,
                        required: [true, "Rating is required"],
                        min: [1, "Rating must be at least 1"],
                        max: [5, "Rating cannot exceed 5"],
                    },
                    comment: {
                        type: String,
                        maxlength: [
                            500,
                            "Comment cannot exceed 500 characters",
                        ],
                    },
                    createdAt: {
                        type: Date,
                        default: Date.now,
                    },
                },
            ],
            validate: {
                validator: (arr) => !arr.length || arr.length <= 100,
                message: "Reviews cannot exceed 100 entries.",
            },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Plugins
bookSchema.plugin(plugins.paginate);
bookSchema.plugin(plugins.privatePlugin);
bookSchema.plugin(plugins.softDelete);

// Indexes for performance
bookSchema.index({ slug: 1 });
bookSchema.index({ title: 1, publishedYear: 1 });
bookSchema.index({ genres: 1 });

// Pre-save hook to generate slug
bookSchema.pre("save", async function (next) {
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

// Pre-save validation for characters size (removing invalid check)
bookSchema.pre("save", function (next) {
    // Removed characters validation as it's not in schema
    next();
});

// Pre-save hook for logging
bookSchema.pre("save", function (next) {
    return middlewares.dbLogger("Book").call(this, next);
});

// Method to mark as verified
bookSchema.methods.markAsVerified = async function () {
    this.isVerified = true;
    return this.save();
};

// Soft delete method
bookSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

// Restore soft-deleted document
bookSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

// Query only active records by default
bookSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

// Utility method for populated data
bookSchema.statics.findPopulatedById = async function (id) {
    return this.findById(id)
        .populate("author")
        .populate("publisher")
        .populate("distributor")
        .populate("createdBy")
        .populate("updatedBy");
};

const Book = mongoose.model("Book", bookSchema);

export default Book;