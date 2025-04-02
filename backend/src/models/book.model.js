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
        author: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person",
                validate: {
                    validator: (arr) => !arr.length || arr.length <= 5,
                    message:
                        "Authors list, if provided, cannot exceed 5 entries.",
                },
            },
        ],
        bookType: {
            type: String,
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
        isbn: {
            type: String,
            unique: true,
            trim: true,
            match: [
                /^\d{3}-?\d{10}$/,
                "ISBN must be in the format 'XXX-XXXXXXXXXX' (e.g., '978-0261102385').",
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
        language: {
            type: String,
            trim: true,
        },
        pages: {
            type: Number,
            min: [1, "Pages must be at least 1."],
            validate: {
                validator: Number.isInteger,
                message: "Pages must be an integer.",
            },
        },
        publisher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Publisher",
        },
        description: {
            type: String,
            maxlength: [1000, "Description cannot exceed 1000 characters."],
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
            audiobooks: {
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

// Plugins (mirroring Movie)
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
        let slug = baseSlug; // Fixed typo from your Movie model
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

// Pre-save validation for characters size
bookSchema.pre("save", function (next) {
    if (this.characters && this.characters.length > 50) {
        return next(new Error("Characters list cannot exceed 50 entries."));
    }
    next();
});

// Pre-save hook for logging (mirroring Movie)
bookSchema.pre("save", middlewares.dbLogger("Book"));

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
