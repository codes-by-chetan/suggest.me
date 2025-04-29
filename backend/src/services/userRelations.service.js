import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import userService from "./user.service.js";
import notificationService from "./notification.service.js";
import userProfileService from "./userProfile.service.js";
import {
    EmmitFollowAcceptedEvent,
    EmmitFollowedYouEvent,
    EmmitUnFollowedYouEvent,
} from "../sockets/socket.js";
import { io } from "../index.js";

const followUser = async (userId, userIdToFollow) => {
    const userTOFollowProfile =
        await userProfileService.getUserProfile(userIdToFollow);
    const status = userTOFollowProfile?.isPublic ? "Accepted" : "Pending";
    const relation = await models.UserRelationship.follow(
        userId,
        userIdToFollow,
        status
    );
    if (!relation) {
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Unable to Process Your Request!!!"
        );
    }
    let result;
    if (status === "Pending") {
        result = await notificationService.sendFollowRequstNotification(
            userIdToFollow,
            userId,
            relation._id
        );
    } else {
        result = await notificationService.sendFollowedNotification(
            userIdToFollow,
            userId,
            relation._id
        );
    }
    await EmmitFollowedYouEvent(io, userIdToFollow, relation);

    return relation;
};

const acceptFollowRequest = async (req, requestId) => {
    const user = req.user;
    const relation = await models.UserRelationship.findById(requestId);
    if (!relation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Request Not Found!!!");
    }
    if (user._id.toString() !== relation.following.toString()) {
        console.log(
            user._id,
            "====",
            relation.following,
            "===>>>",
            user._id.toString() !== relation.following.toString()
        );
        throw new ApiError(
            httpStatus.NOT_ACCEPTABLE,
            "Request Not Related to the logged in user!!!"
        );
    }
    relation.status = "Accepted";
    await relation.save();
    console.log("request accepted", relation);
    const userIdToFollow = relation.following;
    const userId = relation.follower;

    const result1 =
        await notificationService.sendFollowRequstAcceptedNotification(
            userIdToFollow,
            userId
        );
    const result2 = await notificationService.sendFollowedNotification(
        userIdToFollow,
        userId,
        [result1]
    );
    await EmmitFollowAcceptedEvent(io, relation.follower, relation);
    await EmmitFollowedYouEvent(io, user._id, relation);
    return relation;
};

const getRelation = async (follower, following) => {
    // console.log("Follower:  ", follower, "Following : ", following);

    const relation = await models.UserRelationship.findOne({
        follower: follower,
        following: following,
        deleted: false,
    });
    // console.log(relation);
    if (!relation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Relation Not found");
    }
    return relation;
};

const unfollowUser = async (userId, userIdToUnFollow) => {
    const result = await models.UserRelationship.unfollow(
        userId,
        userIdToUnFollow
    );
    EmmitUnFollowedYouEvent(io, userIdToUnFollow, result);
    await notificationService.dismissFollowRequestNotification(result);
    return result;
};

const userRelationsService = {
    followUser,
    getRelation,
    acceptFollowRequest,
    unfollowUser,
};
export default userRelationsService;
