import mongoose from "mongoose";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";
import reusableSchemas from "./reusableSchemas/index.js";

const distributorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required for a distributor."],
            trim: true,
            minlength: [1, "Name must be at least 1 characters long."],
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
        tmdbId: {
            type: String,
            required: false,
            unique: true,
            sparse: true,
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
    }
);

distributorSchema.plugin(plugins.paginate);
distributorSchema.plugin(plugins.privatePlugin);
distributorSchema.plugin(plugins.softDelete);

// Pre-save hook to generate slug
distributorSchema.pre("save", async function (next) {
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

distributorSchema.pre("save", function () {
    middlewares.dbLogger("Distributor");
});

// Index for efficient querying
distributorSchema.index({ name: 1 });
distributorSchema.index({ slug: 1 });
distributorSchema.index({ tmdbId: 1 }, { sparse: true });

const Distributor = mongoose.model("Distributor", distributorSchema);

export default Distributor;