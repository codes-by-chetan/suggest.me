import mongoose from "mongoose";
import validator from "validator";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const musicVideoSchema = new mongoose.Schema(
    {
        music: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Music",
            required: [true, "Music reference is required."],
        },
        url: {
            type: String,
            required: [true, "Music video URL is required."],
            validate: {
                validator: (value) => validator.isURL(value),
                message: "Music video URL must be a valid URL.",
            },
        },
        director: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Person",
        },
        releaseDate: {
            type: Date,
            validate: {
                validator: (value) => !value || value <= new Date(),
                message: "Release date cannot be in the future.",
            },
        },
        productionCompanies: [
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

musicVideoSchema.plugin(plugins.paginate);
musicVideoSchema.plugin(plugins.privatePlugin);
musicVideoSchema.plugin(plugins.softDelete);

musicVideoSchema.index({ music: 1 });

musicVideoSchema.pre("save", function (next) {
    return middlewares.dbLogger("MusicVideo").call(this, next);
});

musicVideoSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

musicVideoSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

musicVideoSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

const MusicVideo = mongoose.model("MusicVideo", musicVideoSchema);

export default MusicVideo;
