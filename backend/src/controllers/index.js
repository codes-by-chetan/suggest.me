import authController from "./auth.controller.js";
import bookController from "./book.controller.js";
import chatController from "./chat.controller.js";
import logsController from "./logs.controller.js";
import movieController from "./movie.controller.js";
import musicController from "./music.controller.js";
import notificationController from "./notification.controller.js";
import researchController from "./research.controller.js";
import searchController from "./search.controller.js";
import seriesController from "./series.controller.js";
import suggestionController from "./suggestion.controller.js";
import trendingController from "./trending.controller.js";
import userController from "./user.controller.js";
import userContentController from "./userContent.controller.js";
import userKeyController from "./userKey.controller.js";
import userRelationsController from "./userRelations.controller.js";

const controllers = {
    authController,
    logsController,
    userController,
    searchController,
    userRelationsController,
    notificationController,
    movieController,
    seriesController,
    bookController,
    musicController,
    researchController,
    suggestionController,
    chatController,
    userKeyController,
    userContentController,
    trendingController,
};

export default controllers;
