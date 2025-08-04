import constants from "../constants/index.js";
import services from "../services/index.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpStatus from "http-status";
import passport from "passport";
import config from "../config/env.config.js";

const register = asyncHandler(async (req, res) => {
    const userData = await services.authService.registerUser(req.body);
    const authTokens = await userData.generateAccessToken(req);
    const choosenFields = {
        fullName: userData.fullName,
        email: userData.email,
        contactNumber: userData.contactNumber,
        role: userData.role,
        fullNameString: userData.fullNameString,
        avatar: userData?.profile?.avatar,
    };
    const response = new ApiResponse(
        httpStatus.CREATED,
        { user: choosenFields, ...authTokens },
        "user created successfully"
    );
    res.status(httpStatus.CREATED).json(response);
});

const login = asyncHandler(async (req, res) => {
    const token = await services.authService.loginWithEmailAndPassword(req);
    const response = new ApiResponse(
        httpStatus.OK,
        token,
        "Login Successfull!!!"
    );
    res.status(httpStatus.OK).json(response);
});

// Social login handlers
const googleLogin = passport.authenticate("google", {
    scope: ["profile", "email"],
});

const googleCallback = asyncHandler(async (req, res) => {
    const token = await services.authService.socialLogin(req.user, req);
    const response = new ApiResponse(
        httpStatus.OK,
        token,
        "Google login successful"
    );
    res.status(httpStatus.OK).json(response);
});

const facebookLogin = passport.authenticate("facebook", {
    scope: ["email"],
});

const facebookCallback = asyncHandler(async (req, res) => {
    const token = await services.authService.socialLogin(req.user, req);
    const response = new ApiResponse(
        httpStatus.OK,
        token,
        "Facebook login successful"
    );
    res.status(httpStatus.OK).json(response);
});

// Verify social token
const verifySocialToken = asyncHandler(async (req, res) => {
    const { provider, token } = req.body;
    const authTokens = await services.authService.verifySocialToken(provider, token, req);
    
    // Redirect to frontend callback with provider and token
    const redirectUrl = `${config.frontend_url}/auth/callback?provider=${provider}&token=${authTokens.token}`;
    res.redirect(redirectUrl);
});

// Change password callback function
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id;
    await services.authService.changeUserPassword(
        oldPassword,
        newPassword,
        userId
    );

    const response = new ApiResponse(
        200,
        null,
        "Password changed successfully"
    );
    res.status(200).json(response);
});

const verifyUser = asyncHandler(async (req, res) => {
    const response = new ApiResponse(200, null, "user is verified");
    res.status(200).json(response);
});

const isAdmin = asyncHandler(async (req, res) => {
    if (req.user.role !== constants.UserRoles.ADMIN) {
        throw new ApiError(401, "user is not admin");
    }

    const response = new ApiResponse(200, null, "user is admin");
    res.status(200).json(response);
});

const verifyRegistrationToken = asyncHandler(async (req, res) => {
    const token = decodeURIComponent(req.params.token);
    const { registrationToken } = req.user;
    await req.user.save();
    if (req.user.organisation)
        throw new ApiError(401, "Already registered please login", "/");

    if (token !== registrationToken) {
        console.log(token, " <===> ", registrationToken);
        throw new ApiError(401, "Invalid registration token", "/auth/sign-up");
    }

    const response = new ApiResponse(200, true, "Registration token is valid");
    res.status(200).json(response);
});

const getUserDetails = asyncHandler(async (req, res) => {
    const user = await services.userService.getUserDetails(req.user._id);
    const response = new ApiResponse(
        httpStatus.OK,
        { user: user },
        "user details fetched successfully"
    );
    res.status(httpStatus.OK).json(response);
});

const logout = asyncHandler(async (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Token not provided");
    }

    await services.authService.logout(req.user._id, token);

    const response = new ApiResponse(
        httpStatus.OK,
        null,
        "Logged out successfully"
    );
    res.status(httpStatus.OK).json(response);
});

const authController = {
    register,
    login,
    googleLogin,
    googleCallback,
    facebookLogin,
    facebookCallback,
    verifySocialToken,
    changePassword,
    isAdmin,
    verifyUser,
    verifyRegistrationToken,
    getUserDetails,
    logout,
};

export default authController;