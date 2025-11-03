import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import mongoose from "mongoose";
/**
 * Create a new user.
 * @param {Object} userBody - The user data.
 * @param {string} userBody.email - The email of the user.
 * @param {string} userBody.userName - The username of the user.
 * @returns {Promise<Object>} The created user.
 * @throws {ApiError} If the email or username is already taken.
 */
const createUser = async (userBody) => {
    if (await models.User.isEmailTaken(userBody.email)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `email ${userBody.email} is already taken!!`
        );
    }

    if (
        userBody.userName &&
        (await models.User.isUserNameTaken(userBody.userName))
    ) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `user name ${userBody.userName} is already taken!!`
        );
    }
    const createdUser = await models.User.create(userBody);
    if (!createdUser) {
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "User creation failed"
        );
    }
    const userProfile = await models.UserProfile.create({
        user: createdUser._id,
        createdBy: createdUser._id,
    });
    if (!userProfile) {
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "User profile creation failed"
        );
    }
    createdUser.profile = userProfile._id;
    await createdUser.save();
    await createdUser.populate("profile");

    return createdUser;
};

/**
 * Finds a single user by email or username that hasn't been marked as deleted
 * @param {string} email - The email address to search for
 * @param {string} userName - The username to search for
 * @returns {Promise<Object|null>} A promise that resolves to the user document if found, null otherwise
 * @throws {Error} If there's an error during the database operation
 */
const findOneUser = async (email, userName) => {
    const query = { deleted: { $ne: true } };

    if (email) {
        query.email = email.toLowerCase().trim();
    } else if (userName) {
        query.userName = userName.toLowerCase().trim();
    } else {
        return null; // neither email nor userName is provided
    }

    return await models.User.findOne(query);
};


/**
 * Finds a single user by id
 * @param {string} id - The id to search for
 * @returns {Promise<Object|null>} A promise that resolves to the user document if found, null otherwise
 * @throws {Error} If there's an error during the database operation
 */
const findUserById = async (id) => {
    return await models.User.findById(id);
};

/**
 * Update user information
 * @param {string} id - The id of the user to update
 * @param {Object} userBody - The user data to update
 * @returns {Promise<Object>} The updated user
 * @throws {ApiError} If the user is not found
 */
const updateUserInfo = async (id, userBody) => {
    const user = await models.User.findById(id);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    if (userBody.email && user.email !== userBody.email) {
        if (await models.User.isEmailTaken(userBody.email, id)) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `email ${userBody.email} is already taken!!`
            );
        }
    }
    if (userBody.userName && user.userName !== userBody.userName) {
        if (await models.User.isUserNameTaken(userBody.userName, id)) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `user name ${userBody.userName} is already taken!!`
            );
        }
    }
    user.set(userBody);
    await user.save();
    return user;
};

/**
 * Get user profile
 * @param {string} id - The id of the user to get profile
 * @returns {Promise<Object>} The user profile
 * @throws {ApiError} If the user is not found
 */
const getUserProfile = async (id) => {
    const userProfile = await models.UserProfile.findByUserId(id);
    if (!userProfile) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    return userProfile;
};
const getUserDetails = async (id) => {
    const user = await findUserById(id);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    const userData = await user.populate("profile");

    const choosenFields = {
        _id: userData._id,
        fullName: userData.fullName,
        email: userData.email,
        contactNumber: userData.contactNumber,
        role: userData.role,
        fullNameString: userData.fullNameString,
        avatar: userData?.profile?.avatar,
    };
    return choosenFields;
};

const getUserFollowers = async (id) => {
    const followers = await models.UserRelationship.getFollowers(id);

    const data = {
        count: followers.length,
        followers: followers.map((follower) => {
            return {
                id: follower.follower._id,
                fullName: follower.follower.fullName,
                avatar: follower.follower?.profile?.avatar,
                createdAt: follower.createdAt,
            };
        }),
    };
    return data;
};
const getUserFollowings = async (id) => {
    const followings = await models.UserRelationship.getFollowing(id);
    const data = {
        count: followings.length,
        followings: followings.map((following) => {
            return {
                id: following.follower?._id,
                fullName: following.follower?.fullName,
                avatar: following.follower?.profile?.avatar,
                createdAt: following.createdAt,
            };
        }),
    };
    return data;
};
const getUserRelations = async (id) => {
    const followers = await getUserFollowers(id);
    const followings = await getUserFollowings(id);
    return {
        followers,
        followings,
    };
};

const getUserProfileDetails = async (user) => {
    await user.populate("profile");
    const userRelations = await getUserRelations(user._id);
    const profileData = {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        userName: user.userName,
        contactNumber: user.contactNumber,
        fullNameString: user.fullNameString,
        profile: {
            avatar: user?.profile?.avatar,
            bio: user?.profile?.bio,
            location: user?.profile?.location,
            displayName: user?.profile?.displayName,
            socialLinks: user?.profile?.socialLinks,
            preferences: user?.profile?.preferences,
            isPublic: user?.profile?.isPublic,
            isVerified: user?.profile?.isVerified,
        },
        relations: userRelations,
        createdAt: user.createdAt,
    };
    return profileData;
};

const getOtherUserProfileDetails = async (id) => {
    const user = await findUserById(id);
    await user.populate("profile");
    const userRelations = await getUserRelations(user._id);
    const profileData = {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        userName: user.userName,
        contactNumber: user.contactNumber,
        fullNameString: user.fullNameString,
        profile: {
            avatar: user?.profile?.avatar,
            bio: user?.profile?.bio,
            location: user?.profile?.location,
            displayName: user?.profile?.displayName,
            socialLinks: user?.profile?.socialLinks,
            preferences: user?.profile?.preferences,
            isPublic: user?.profile?.isPublic,
            isVerified: user?.profile?.isVerified,
        },
        relations: userRelations,
        createdAt: user.createdAt,
    };
    return profileData;
};

/**
 * Get suggested users to follow
 * @param {string} userId - The id of the current user
 * @param {number} [limit=5] - Number of users to return
 * @returns {Promise<Array>} List of suggested users
 */
const getSuggestedUsers = async (userId, limit = 5) => {
    const currentUser = await models.User.findById(userId).populate("profile");
    if (!currentUser) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Get current user's followings to exclude them
    const followings = await models.UserRelationship.getFollowing(userId);
    const followingIds = followings.map((f) => f.following._id.toString());

    // Get current user's preferences
    const userPreferences =
        currentUser.profile?.preferences?.preferredContentTypes || [];

    // Find users with similar preferences or mutual connections
    const suggestedUsers = await models.UserProfile.aggregate([
        // Match public or verified profiles, exclude current user and followed users
        {
            $match: {
                user: {
                    $ne: new mongoose.Types.ObjectId(userId),
                    $nin: followingIds.map(
                        (id) => new mongoose.Types.ObjectId(id)
                    ),
                },
                $or: [{ isPublic: true }, { isVerified: true }],
                isActive: true,
            },
        },
        // Lookup user details
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails",
            },
        },
        { $unwind: "$userDetails" },
        // Lookup followers for mutual connections
        {
            $lookup: {
                from: "userrelationships",
                let: { userId: "$user" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$following", "$$userId"] } } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "follower",
                            foreignField: "_id",
                            as: "followerDetails",
                        },
                    },
                    { $unwind: "$followerDetails" },
                ],
                as: "followers",
            },
        },
        // Calculate match score based on preferences and mutual followers
        {
            $addFields: {
                commonPreferences: {
                    $size: {
                        $setIntersection: [
                            "$preferences.preferredContentTypes",
                            userPreferences,
                        ],
                    },
                },
                mutualFollowers: {
                    $size: {
                        $filter: {
                            input: "$followers",
                            as: "follower",
                            cond: {
                                $in: [
                                    "$$follower.follower",
                                    followingIds.map(
                                        (id) => new mongoose.Types.ObjectId(id)
                                    ),
                                ],
                            },
                        },
                    },
                },
            },
        },
        // Sort by match score (common preferences + mutual followers)
        {
            $sort: {
                commonPreferences: -1,
                mutualFollowers: -1,
                "userDetails.createdAt": -1,
            },
        },
        // Limit results
        { $limit: limit },
        // Project relevant fields
        {
            $project: {
                id: "$userDetails._id",
                fullName: "$userDetails.fullName",
                userName: "$userDetails.userName",
                fullNameString: "$userDetails.fullNameString",
                avatar: "$avatar",
                bio: "$bio",
                isVerified: "$isVerified",
                commonPreferences: 1,
                mutualFollowers: 1,
            },
        },
    ]);

    return suggestedUsers;
};

const userService = {
    createUser,
    findOneUser,
    findUserById,
    updateUserInfo,
    getUserProfile,
    getUserDetails,
    getUserFollowers,
    getUserFollowings,
    getUserRelations,
    getUserProfileDetails,
    getOtherUserProfileDetails,
    getSuggestedUsers,
};
export default userService;
