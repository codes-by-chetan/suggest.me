import authService from "./auth.service.js";
import notificationService from "./notification.service.js";
import searchService from "./search.service.js";
import userService from "./user.service.js";
import userProfileService from "./userProfile.service.js";
import userRelationsService from "./userRelations.service.js";

const services = {
    userService,
    authService,
    searchService,
    userProfileService,
    userRelationsService,
    notificationService,
};

export default services;
