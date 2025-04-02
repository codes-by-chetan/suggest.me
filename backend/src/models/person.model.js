import mongoose from "mongoose";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const personSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required for a person."],
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
        birthDate: {
            type: Date,
            validate: {
                validator: (value) => !value || value <= new Date(),
                message: "Birth date cannot be in the future.",
            },
        },
        birthPlace: {
            type: String,
            trim: true,
        },
        biography: {
            type: String,
            maxlength: [1000, "Biography cannot exceed 1000 characters."],
        },
        profileImage: {
            type: String,
            validate: {
                validator: (value) => !value || validator.isURL(value),
                message: "Profile image must be a valid URL if provided.",
            },
        },
        professions: {
            type: [String],
            default: [],
            validate: {
                validator: (arr) =>
                    arr.every(
                        (role) => typeof role === "string" && role.length > 0
                    ),
                message: "Each profession must be a non-empty string.",
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "created by is required"],
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "updated by is required"],
        },
    },
    {
        timestamps: true,
    }
);

personSchema.plugin(plugins.paginate);
personSchema.plugin(plugins.privatePlugin);
personSchema.plugin(plugins.softDelete);

// Pre-save hook to generate slug
personSchema.pre("save", async function (next) {
    if (this.isModified("name") || !this.slug) {
        const baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        let slug = slug;
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

personSchema.pre("save", middlewares.dbLogger("Person"))

// Index for efficient querying
personSchema.index({ name: 1 });
personSchema.index({ slug: 1 });
personSchema.index({ professions: 1 }); // For querying by profession


const Person = mongoose.model("Person", personSchema);

export default Person;
