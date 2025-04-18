import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const getUserProfile = asyncHandler(async (req, res) => {
    const profileData = await services.userService.getUserProfile(req.user._id);
    const response = new ApiResponse(
        httpStatus.OK,
        profileData,
        "User profile fetched successfully"
    );
    res.status(httpStatus.OK).json(response);
});

const userController = { getUserProfile };
export default userController;
