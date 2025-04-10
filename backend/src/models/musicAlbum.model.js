import mongoose from "mongoose";
import validator from "validator";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const musicAlbumSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Album title is required."],
            trim: true,
            minlength: [1, "Album title must be at least 1 character long."],
            maxlength: [100, "Album title cannot exceed 100 characters."],
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
        releaseYear: {
            type: Number,
            required: [true, "Release year is required."],
            min: [1888, "Release year cannot be earlier than 1888."],
            max: [
                new Date().getFullYear() + 5,
                "Release year cannot be more than 5 years in the future.",
            ],
        },
        coverImage: {
            url: {
                type: String,
                required: [true, "Cover image URL is required."],
                validate: {
                    validator: (value) => validator.isURL(value),
                    message: "Cover image URL must be a valid URL.",
                },
            },
            publicId: {
                type: String,
                required: [true, "Cover image Public ID is required."],
            },
        },
        recordLabel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RecordLabel",
            required: [true, "Record label is required for an album."],
        },
        genres: {
            type: [String],
            validate: {
                validator: (arr) => !arr.length || (arr.length > 0 && arr.length <= 5),
                message: "Genres, if provided, must be between 1 and 5 entries.",
            },
            index: true,
        },
        productionCompanies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ProductionCompany",
            },
        ],
        distributors: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Distributor",
            },
        ],
        tracks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Music",
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Created by field is required."],
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

musicAlbumSchema.plugin(plugins.paginate);
musicAlbumSchema.plugin(plugins.privatePlugin);
musicAlbumSchema.plugin(plugins.softDelete);

musicAlbumSchema.index({ slug: 1 });
musicAlbumSchema.index({ title: 1, releaseYear: 1 });

musicAlbumSchema.pre("save", async function (next) {
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

musicAlbumSchema.pre("save", middlewares.dbLogger("Album"));

musicAlbumSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

musicAlbumSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

musicAlbumSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

musicAlbumSchema.statics.findPopulatedById = async function (id) {
    return this.findById(id)
        .populate("recordLabel")
        .populate("productionCompanies")
        .populate("distributors")
        .populate("tracks")
        .populate("createdBy")
        .populate("updatedBy");
};

const MusicAlbum = mongoose.model("Album", musicAlbumSchema);

export default MusicAlbum;