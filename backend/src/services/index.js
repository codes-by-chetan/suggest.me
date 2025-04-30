import authService from "./auth.service.js";
import bookService from "./book.service.js";
import movieService from "./movie.service.js";
import musicService from "./music.service.js";
import notificationService from "./notification.service.js";
import searchService from "./search.service.js";
import seriesService from "./series.service.js";
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
    movieService,
    seriesService,
    bookService,
    musicService,
};

export default services;
