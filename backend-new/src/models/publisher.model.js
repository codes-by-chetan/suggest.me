import mongoose from "mongoose";
import validator from "validator"; // Correct import
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";
import logoSchema from "./reusableSchemas/logo.schema.js";
import reusableSchemas from "./reusableSchemas/index.js";

const publisherSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required for a publisher."],
            trim: true,
            minlength: [1, "Name must be at least 1 character long."],
            maxlength: [100, "Name cannot exceed 100 characters."],
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
        logo: {
            type: reusableSchemas.logoSchema,
            required: false,
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
            required: false, // Optional at creation, updated later
        },
    },
    {
        timestamps: true,
    }
);

publisherSchema.plugin(plugins.paginate);
publisherSchema.plugin(plugins.privatePlugin);
publisherSchema.plugin(plugins.softDelete);

// Pre-save hook to generate slug
publisherSchema.pre("save", async function (next) {
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
publisherSchema.pre("save", function (next) {
    return middlewares.dbLogger("Publisher").call(this, next);
});

// Index for efficient querying
publisherSchema.index({ name: 1 });

// Soft delete method
publisherSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

// Restore soft-deleted document
publisherSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

// Query only active records by default
publisherSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

const Publisher = mongoose.model("Publisher", publisherSchema);

export default Publisher;
