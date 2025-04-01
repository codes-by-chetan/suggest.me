import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";

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

    if (await models.User.isUserNameTaken(userBody.userName)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `user name ${userBody.userName} is already taken!!`
        );
    }

    return models.User.create(userBody);
};

/**
 * Finds a single user by email or username that hasn't been marked as deleted
 * @param {string} email - The email address to search for
 * @param {string} userName - The username to search for
 * @returns {Promise<Object|null>} A promise that resolves to the user document if found, null otherwise
 * @throws {Error} If there's an error during the database operation
 */
const findOneUser = async (email, userName) => {
    return await models.User.findOne({
        $or: [{ email }, { userName }],
        deleted: { $ne: true },
    });
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
    const user = await models.User.findById(id)
        .populate("organisation")
        .populate("profile");
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    return user;
};

const userService = {
    createUser,
    findOneUser,
    findUserById,
    updateUserInfo,
    getUserProfile,
};
export default userService;
