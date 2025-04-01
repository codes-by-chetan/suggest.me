import jwt from "jsonwebtoken";
import models from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";
import config from "../config/env.config.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import constants from "../constants/index.js";

/**
 * Middleware to authenticate a user using a JWT access token
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function    
 */
const authMiddleware = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        throw new ApiError(401, "Access token is missing or invalid");
    }
    let decoded;

    try {
        decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
        console.log(err.message);
        if (err.message === "jwt expired") {
            throw new ApiError(httpStatus.UNAUTHORIZED, "session expired");
        }
        
    }
    const user = await models.User.findById(decoded?.id); // Assuming the token contains the user ID

    if (!user) {
        throw new ApiError(404, "User not found");
    } else if (user.status === constants.UserStatus.Inactive) {
        throw new ApiError(403, "User is inactive");
    } else if (user.deleted) {
        throw new ApiError(403, "User is deleted");
    }

    req.user = user;
    next();
});

export default authMiddleware;
