import mongoose from "mongoose";
import validator from "validator";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const musicRemixSchema = new mongoose.Schema(
    {
        music: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Music",
            required: [true, "Music reference is required."],
        },
        remixer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Person",
            required: [true, "Remixer is required."],
        },
        version: {
            type: String,
            required: [true, "Remix version is required."],
            trim: true,
            maxlength: [100, "Version name cannot exceed 100 characters."],
        },
        releaseDate: {
            type: Date,
            validate: {
                validator: (value) => !value || value <= new Date(),
                message: "Remix release date cannot be in the future.",
            },
        },
        url: {
            type: String,
            validate: {
                validator: (value) => !value || validator.isURL(value),
                message: "Remix URL must be a valid URL if provided.",
            },
        },
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

musicRemixSchema.plugin(plugins.paginate);
musicRemixSchema.plugin(plugins.privatePlugin);
musicRemixSchema.plugin(plugins.softDelete);

musicRemixSchema.index({ music: 1 });
musicRemixSchema.index({ remixer: 1 });

musicRemixSchema.pre("save", middlewares.dbLogger("Remix"));

musicRemixSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

musicRemixSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

musicRemixSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

const MusicRemix = mongoose.model("Remix", musicRemixSchema);

export default MusicRemix;
