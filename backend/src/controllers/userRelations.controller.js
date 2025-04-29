import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const followUser = asyncHandler(async (req, res) => {
    const followerId = req.user._id;
    const followingId = req.params.followingId;
    const result = await services.userRelationsService.followUser(
        followerId,
        followingId
    );
    const response = new ApiResponse(200, result, "Follow request sent!!!");
    res.status(200).json(response);
});

const getRelation = asyncHandler(async (req, res) => {
    const followerId = req.user._id;
    const followingId = req.params.followingId;

    const result = await services.userRelationsService.getRelation(
        followerId,
        followingId
    );
    const response = new ApiResponse(200, result, "Relation Fetched!!!");
    res.status(200).json(response);
});
const acceptFollowRequest = asyncHandler(async (req, res) => {
    const requestId = req.params.requestId;

    const result = await services.userRelationsService.acceptFollowRequest(
        req,
        requestId
    );
    const response = new ApiResponse(200, result, "Request Accepted!!!");
    res.status(200).json(response);
});

const getFollowsYou = asyncHandler(async (req, res) => {
    const followingId = req.user._id;
    const followerId = req.params.followingId;
    // console.log("followerId:  ", followerId, "followingId : ", followingId);

    const result = await services.userRelationsService.getRelation(
        followerId,
        followingId
    );
    const response = new ApiResponse(200, result, "Relation Fetched!!!");
    res.status(200).json(response);
});

const unfollowUser = asyncHandler(async (req, res) => {
    const followerId = req.user._id;
    const followingId = req.params.followingId;
    const result = await services.userRelationsService.unfollowUser(
        followerId,
        followingId
    );
    const response = new ApiResponse(200, result, "Unfollowed User!!!");
    
    res.status(200).json(response);
});

const userRelationsController = {
    followUser,
    getRelation,
    acceptFollowRequest,
    getFollowsYou,
    unfollowUser,
};
export default userRelationsController;
