import authController from "./auth.controller.js";
import logsController from "./logs.controller.js";
import notificationController from "./notification.controller.js";
import searchController from "./search.controller.js";
import userController from "./user.controller.js";
import userRelationsController from "./userRelations.controller.js";

const controllers = {
    authController,
    logsController,
    userController,
    searchController,
    userRelationsController,
    notificationController,
};

export default controllers;
