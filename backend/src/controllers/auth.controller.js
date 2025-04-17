import constants from "../constants/index.js";
import services from "../services/index.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpStatus from "http-status";

const register = asyncHandler(async (req, res) => {
    const user = await services.authService.registerUser(req.body);
    const authTokens = await user.generateAccessToken(req);
    const response = new ApiResponse(
        httpStatus.CREATED,
        { user, ...authTokens },
        "user created successfully"
    );
    res.status(httpStatus.CREATED).json(response);
});

const login = asyncHandler(async (req, res) => {
    const token = await services.authService.loginWithEmailAndPassword(
        req
    );

    const response = new ApiResponse(
        httpStatus.OK,
        token,
        "Login Successfull!!!"
    );

    res.status(httpStatus.OK).json(response);
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



const authController = {
    register,
    login,
    changePassword,
    isAdmin,
    verifyUser,
    verifyRegistrationToken,
};

export default authController;
