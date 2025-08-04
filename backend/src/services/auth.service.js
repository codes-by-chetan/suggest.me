import constants from "../constants/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import services from "./index.js";
import userService from "./user.service.js";
import jwt from "jsonwebtoken";
import config from "../config/env.config.js";
import models from "../models/index.js";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

const googleClient = new OAuth2Client(config.google_client_id);

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
const loginWithEmailAndPassword = async (req) => {
    const credentials = req.body;
    console.log(credentials);

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

    const isPasswordValid = await user.isPasswordCorrect(credentials.password);
    if (!isPasswordValid) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Password is incorrect!!!");
    }

    const token = await user.generateAccessToken(req);

    return token;
};

/**
 * Handles social login by generating a token for an authenticated user.
 *
 * @param {Object} user - The authenticated user object.
 * @param {Object} req - The request object.
 * @returns {Promise<Object>} - A promise that resolves to the access token and expiry.
 */
const socialLogin = async (user, req) => {
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    if (user.status === constants.UserStatus.Inactive) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User is inactive");
    }
    return await user.generateAccessToken(req);
};

/**
 * Verifies a social login token and returns a JWT for the user.
 *
 * @param {string} provider - The social provider ("google" or "facebook").
 * @param {string} token - The social provider's access token.
 * @param {Object} req - The request object.
 * @returns {Promise<Object>} - A promise that resolves to the access token and expiry.
 * @throws {ApiError} - Throws an error if the token is invalid or user creation fails.
 */
const verifySocialToken = async (provider, token, req) => {
    let userData;

    if (provider === "google") {
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: config.google.oAuth.clientId,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Google token, bhai!");
            }
            userData = {
                oauthId: payload.sub,
                oauthProvider: "google",
                email: payload.email,
                fullName: {
                    firstName: payload.given_name || "User",
                    lastName: payload.family_name || "",
                },
            };
        } catch (error) {
            console.error("Google token verification error:", error);
            throw new ApiError(httpStatus.UNAUTHORIZED, "Google token verification failed, kuch toh gadbad hai!");
        }
    } else if (provider === "facebook") {
        try {
            const response = await axios.get(
                `https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token=${token}`
            );
            const fbData = response.data;
            if (!fbData.id) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Facebook token, bhai!");
            }
            userData = {
                oauthId: fbData.id,
                oauthProvider: "facebook",
                email: fbData.email,
                fullName: {
                    firstName: fbData.first_name || "User",
                    lastName: fbData.last_name || "",
                },
            };
        } catch (error) {
            console.error("Facebook token verification error:", error);
            throw new ApiError(httpStatus.UNAUTHORIZED, "Facebook token verification failed, kuch toh gadbad hai!");
        }
    } else {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid provider, yeh kya bakchodi hai?");
    }

    // Find or create user
    let user = await models.User.findOne({
        oauthId: userData.oauthId,
        oauthProvider: userData.oauthProvider,
        deleted: { $ne: true },
    });

    if (!user) {
        // Check if email is taken by non-OAuth user
        const emailTaken = await models.User.isEmailTaken(userData.email);
        if (emailTaken) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Email already in use with different login method!");
        }

        user = await services.userService.createUser({
            fullName: userData.fullName,
            email: userData.email,
            oauthId: userData.oauthId,
            oauthProvider: userData.oauthProvider,
            role: constants.UserRoles.USER,
            status: constants.UserStatus.Active,
        });
    }

    if (user.status === constants.UserStatus.Inactive) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User is inactive, bhai!");
    }

    return await user.generateAccessToken(req);
};

/**
 * Registers a new user.
 *
 * @param {Object} userDetails - The details of the user to register.
 * @returns {Promise<Object>} - A promise that resolves to the registered user.
 */
const registerUser = async (userDetails) => {
    const user = await services.userService.createUser(userDetails);
    return user.populate("profile");
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

/**
 * Logs out a user by revoking the specified session.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} token - The JWT token to revoke.
 * @returns {Promise<void>} - A promise that resolves when the session is revoked.
 * @throws {ApiError} - Throws an error if the token is invalid or the session is not found.
 */
const logout = async (userId, token) => {
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const tokenId = decoded.jti;
        const sessions = await models.User.getActiveSessions(userId);
        console.log("sessions===>", sessions);

        const result = await models.User.revokeSession(userId, tokenId);
        if (result.modifiedCount === 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Session not found or already revoked"
            );
        }
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
        }
        throw error;
    }
};

const authService = {
    loginWithEmailAndPassword,
    socialLogin,
    verifySocialToken,
    registerOrganisation,
    registerUser,
    changeUserPassword,
    logout,
};

export default authService;