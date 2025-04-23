import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";

const followUser = asyncHandler(async (req, res) => {
    const followerId = req.user._id;
    const followingId = req.params.followingId;
    const result = services.userRelationsService.followUser(
        followerId,
        followingId
    );
    const response = new ApiResponse(200, result, "Follow request sent!!!");
    res.status(200).json(response);
});

const userRelationsController = {followUser};
export default userRelationsController;
