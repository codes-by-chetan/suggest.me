import constants from "../constants/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import services from "./index.js";
import userService from "./user.service.js";

/**
 * Authenticates a user using their email or username and password.
 *
 * @param {Object} credentials - The login credentials.
 * @param {string} [credentials.userName] - The username of the user.
 * @param {string} [credentials.email] - The email of the user.
 * @param {string} credentials.password - The password of the user.
 * @returns {Promise<string>} - A promise that resolves to the access token if authentication is successful.
 * @throws {ApiError} - Throws an error if the username or email is not provided, user is not found, user is inactive, or password is incorrect.
 */
const loginWithEmailAndPassword = async (credentials) => {
    if (!credentials.userName && !credentials.email) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "User name or Email is not provided!!!"
        );
    }

    const user = await userService.findOneUser(
        credentials.email,
        credentials.userName
    );

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!!!");
    }

    if (user.status === constants.UserStatus.Inactive) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User is inactive!!!");
    }

    if (!user.isPasswordCorrect(credentials.password)) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Password is incorrect!!!");
    }

    const token = user.generateAccessToken();

    return token;
};

/**
 * Registers a new user.
 *
 * @param {Object} userDetails - The details of the user to register.
 * @returns {Promise<Object>} - A promise that resolves to the registered user.
 */
const registerUser = async (userDetails) => {
    const user = await services.userService.createUser(userDetails);
    return user;
};

/**
 * Registers a new organisation and associates it with a user.
 *
 * @param {Object} orgDetails - The details of the organisation to register.
 * @param {Object} user - The user to associate with the organisation.
 * @returns {Promise<Object>} - A promise that resolves to the registered organisation.
 */
const registerOrganisation = async (orgDetails, user) => {
    const organisation = await services.organisationService.createOrgnisation(
        orgDetails,
        user
    );
    user.organisation = organisation._id;
    await user.save();
    return organisation;
};

/**
 * Changes the password of a user.
 *
 * @param {string} oldPassword - The current password of the user.
 * @param {string} newPassword - The new password to set.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<void>} - A promise that resolves when the password is changed.
 * @throws {ApiError} - Throws an error if the user is not found or the old password is incorrect.
 */
const changeUserPassword = async (oldPassword, newPassword, userId) => {
    const user = await userService.findUserById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save();
};

const authService = {
    loginWithEmailAndPassword,
    registerOrganisation,
    registerUser,
    changeUserPassword,
};

export default authService;
