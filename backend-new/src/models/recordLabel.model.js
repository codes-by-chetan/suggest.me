import mongoose from "mongoose";
import validator from "validator";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";
import logoSchema from "./reusableSchemas/logo.schema.js";
import reusableSchemas from "./reusableSchemas/index.js";

const recordLabelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required for a record label."],
            trim: true,
            minlength: [1, "Name must be at least 1 character long."],
            maxlength: [100, "Name cannot exceed 100 characters."],
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
        founded: {
            type: Date,
            validate: {
                validator: (value) => !value || value <= new Date(),
                message: "Founding date cannot be in the future.",
            },
        },
        headquarters: {
            type: String,
            trim: true,
        },
        logo: {
            type: reusableSchemas.logoSchema,
            required: false,
        },
        website: {
            type: String,
            validate: {
                validator: (value) => !value || validator.isURL(value),
                message: "Website must be a valid URL if provided.",
            },
        },
        description: {
            type: String,
            maxlength: [1000, "Description cannot exceed 1000 characters."],
            trim: true,
        },
        parentCompany: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RecordLabel", // Allows nesting (e.g., a subsidiary label under a parent label)
        },
        subsidiaries: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "RecordLabel",
            },
        ],
        artists: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person",
                validate: {
                    validator: (arr) => !arr.length || arr.length <= 100,
                    message: "Artists list cannot exceed 100 entries.",
                },
            },
        ],
        albums: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Album",
            },
        ],
        distributors: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Distributor",
            },
        ],
        productionCompanies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ProductionCompany",
            },
        ],
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
recordLabelSchema.plugin(plugins.paginate);
recordLabelSchema.plugin(plugins.privatePlugin);
recordLabelSchema.plugin(plugins.softDelete);

// Indexes for performance

recordLabelSchema.index({ name: 1 });
recordLabelSchema.index({ artists: 1 });

// Pre-save hook to generate slug
recordLabelSchema.pre("save", async function (next) {
    if (this.isModified("name") || !this.slug) {
        const baseSlug = this.name
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

// Pre-save hook for logging
recordLabelSchema.pre("save", function (next) {
    return middlewares.dbLogger("RecordLabel").call(this, next);
});

// Soft delete method
recordLabelSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

// Restore soft-deleted document
recordLabelSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

// Query only active records by default
recordLabelSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

// Utility method for populated data
recordLabelSchema.statics.findPopulatedById = async function (id) {
    return this.findById(id)
        .populate("parentCompany")
        .populate("subsidiaries")
        .populate("artists")
        .populate("albums")
        .populate("distributors")
        .populate("productionCompanies")
        .populate("createdBy")
        .populate("updatedBy");
};

const RecordLabel = mongoose.model("RecordLabel", recordLabelSchema);

export default RecordLabel;
