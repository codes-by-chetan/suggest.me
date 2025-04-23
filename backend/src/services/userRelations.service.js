import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import userService from "./user.service.js";

const followUser = async (userId, userIdToFollow) => {
    const result = await models.UserRelationship.follow(
        userId,
        userIdToFollow,
        "Pending"
    );
    return result;
};

const userRelationsService = { followUser };
export default userRelationsService;
