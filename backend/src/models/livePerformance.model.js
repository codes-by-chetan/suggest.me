import mongoose from "mongoose";
import validator from "validator";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";

const livePerformanceSchema = new mongoose.Schema(
    {
        music: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Music",
            required: [true, "Music reference is required."],
        },
        event: {
            type: String,
            required: [true, "Event name is required."],
            trim: true,
            maxlength: [100, "Event name cannot exceed 100 characters."],
        },
        date: {
            type: Date,
            validate: {
                validator: (value) => !value || value <= new Date(),
                message: "Performance date cannot be in the future.",
            },
        },
        location: {
            type: String,
            trim: true,
        },
        url: {
            type: String,
            validate: {
                validator: (value) => !value || validator.isURL(value),
                message: "Performance URL must be a valid URL if provided.",
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

livePerformanceSchema.plugin(plugins.paginate);
livePerformanceSchema.plugin(plugins.privatePlugin);
livePerformanceSchema.plugin(plugins.softDelete);

livePerformanceSchema.index({ music: 1 });
livePerformanceSchema.index({ event: 1 });

livePerformanceSchema.pre("save", function (next) {
    return middlewares.dbLogger("LivePerformance").call(this, next);
});


livePerformanceSchema.statics.softDelete = async function (id) {
    return this.updateOne({ _id: id }, { isActive: false });
};

livePerformanceSchema.statics.restore = async function (id) {
    return this.updateOne({ _id: id }, { isActive: true });
};

livePerformanceSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

const LivePerformance = mongoose.model(
    "LivePerformance",
    livePerformanceSchema
);

export default LivePerformance;
