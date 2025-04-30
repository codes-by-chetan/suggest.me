import mongoose from "mongoose";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";
import reusableSchemas from "./reusableSchemas/index.js";

const productionCompanySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required for a production company."],
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

productionCompanySchema.plugin(plugins.paginate);
productionCompanySchema.plugin(plugins.privatePlugin);
productionCompanySchema.plugin(plugins.softDelete);

// Pre-save hook to generate slug
productionCompanySchema.pre("save", async function (next) {
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

productionCompanySchema.pre("save", function () {
    middlewares.dbLogger("ProductionCompany");
});

// Index for efficient querying
productionCompanySchema.index({ name: 1 });
productionCompanySchema.index({ slug: 1 });
productionCompanySchema.index({ tmdbId: 1 }, { sparse: true });

const ProductionCompany = mongoose.model(
    "ProductionCompany",
    productionCompanySchema
);

export default ProductionCompany;