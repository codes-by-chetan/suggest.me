import mongoose from "mongoose";
import plugins from "./plugins/index.js";
import middlewares from "../middlewares/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";

const userRelationshipSchema = new mongoose.Schema(
    {
        follower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Follower reference is required"],
            index: true,
        },
        following: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Following reference is required"],
            index: true,
        },
        status: {
            type: String,
            enum: {
                values: ["Pending", "Accepted"],
                message: "Status must be Pending or Accepted",
            },
            default: "Accepted",
            required: [true, "Status is required"],
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
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Plugins
userRelationshipSchema.plugin(plugins.softDelete);
userRelationshipSchema.plugin(plugins.paginate);
userRelationshipSchema.plugin(plugins.privatePlugin);

// Indexes for performance
userRelationshipSchema.index({ follower: 1, following: 1 }, { unique: true });
userRelationshipSchema.index({ follower: 1, status: 1 });
userRelationshipSchema.index({ following: 1, status: 1 });

// Prevent self-follow
userRelationshipSchema.pre("save", function (next) {
    if (this.follower.equals(this.following)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot follow yourself");
    }
    next();
});

// Pre-save hook for logging
userRelationshipSchema.pre("save", function () {
    middlewares.dbLogger("UserRelationship");
});

// Query only active records
userRelationshipSchema.pre(/^find/, function (next) {
    if (!this.getQuery().hasOwnProperty("isActive")) {
        this.where({ isActive: true });
    }
    next();
});

// Utility method to follow a user
userRelationshipSchema.statics.follow = async function (
    followerId,
    followingId,
    folowStatus = "Accepted"
) {
    const relationship = await this.create({
        follower: followerId,
        following: followingId,
        status: folowStatus,
        createdBy: followerId,
    });
    // Update counts
    // await Promise.all([
    //     mongoose
    //         .model("User")
    //         .updateOne({ _id: followerId }, { $inc: { followingCount: 1 } }),
    //     mongoose
    //         .model("User")
    //         .updateOne({ _id: followingId }, { $inc: { followersCount: 1 } }),
    // ]);
    return relationship;
};

// Utility method to unfollow
userRelationshipSchema.statics.unfollow = async function (
    followerId,
    followingId
) {
    const result = await this.deleteOne({
        follower: followerId,
        following: followingId,
        isActive: true,
    });
    if (result.deletedCount === 0) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "Follow relationship not found"
        );
    }
    // Update counts
    // await Promise.all([
    //     mongoose
    //         .model("User")
    //         .updateOne({ _id: followerId }, { $inc: { followingCount: -1 } }),
    //     mongoose
    //         .model("User")
    //         .updateOne({ _id: followingId }, { $inc: { followersCount: -1 } }),
    // ]);
    return result;
};

// Utility method to get followers
userRelationshipSchema.statics.getFollowers = async function (userId) {
    return this.find({ following: userId, status: "Accepted" })
        .populate("follower")
        .populate("createdBy");
};

// Utility method to get following
userRelationshipSchema.statics.getFollowing = async function (userId) {
    return this.find({ follower: userId, status: "Accepted" })
        .populate("following")
        .populate("createdBy");
};
// Utility method to check if userA follows userB
userRelationshipSchema.statics.isFollowing = async function (userAId, userBId) {
    const relationship = await this.findOne({
        follower: userAId,
        following: userBId,
        status: "Accepted",
        isActive: true,
    });
    return !!relationship; // Returns true if userA follows userB, else false
};

// Utility method to get restricted profile data based on follow status
userRelationshipSchema.statics.getProfileAccess = async function (viewerId, profileOwnerId) {
    const isFollowed = await this.isFollowing(viewerId, profileOwnerId);
    
    // Define what fields are visible based on follow status
    const restrictedFields = {
        public: ["username", "name", "profilePicture", "bio"], // Fields visible to everyone
        followed: ["username", "name", "profilePicture", "bio", "posts", "followersCount", "followingCount"], // Fields visible to followers
    };

    return {
        isFollowed,
        accessibleFields: isFollowed ? restrictedFields.followed : restrictedFields.public,
    };
};

const UserRelationship = mongoose.model(
    "UserRelationship",
    userRelationshipSchema
);
export default UserRelationship;
