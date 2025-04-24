import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import userService from "./user.service.js";
import notificationService from "./notification.service.js";
import userProfileService from "./userProfile.service.js";

const followUser = async (userId, userIdToFollow) => {
    const userTOFollowProfile =
        await userProfileService.getUserProfile(userIdToFollow);
    const status = userTOFollowProfile.isPublic ? "Accepted" : "Pending";
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
            userId
        );
    } else {
        result = await notificationService.sendFollowedNotification(
            userIdToFollow,
            userId
        );
    }

    return result;
};

const getRelation = async (follower, following) => {
    console.log();
    
    const relation = await models.UserRelationship.findOne({
        follower: follower,
        following: following,
    });
    if (!relation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Relation Not found");
    }
    return relation;
};

const userRelationsService = { followUser, getRelation };
export default userRelationsService;
