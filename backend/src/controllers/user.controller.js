import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";

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
