import authService from "./auth.service.js";
import bookService from "./book.service.js";
import chatService from "./chat.service.js";
import encryptionKeyService from "./encryptionKey.service.js";
import messageService from "./message.service.js";
import movieService from "./movie.service.js";
import musicService from "./music.service.js";
import notificationService from "./notification.service.js";
import researchService from "./research.service.js";
import searchService from "./search.service.js";
import seriesService from "./series.service.js";
import suggestionService from "./suggestion.service.js";
import trendingService from "./trending.service.js";
import userService from "./user.service.js";
import userContentService from "./userContent.service.js";
import userKeyService from "./userKey.service.js";
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
    researchService,
    suggestionService,
    chatService,
    encryptionKeyService,
    messageService,
    userKeyService,
    userContentService,
    trendingService,
};

export default services;
