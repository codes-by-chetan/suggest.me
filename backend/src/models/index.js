import Book from "./book.model.js";
import Chat from "./chat.model.js";
import DbLogs from "./dbLogs.model.js";
import Distributor from "./distributor.model.js";
import LivePerformance from "./livePerformance.model.js";
import Movie from "./movie.model.js";
import Music from "./music.model.js";
import MusicAlbum from "./musicAlbum.model.js";
import MusicVideo from "./musicVideo.model.js";
import Notification from "./notification.model.js";
import Person from "./person.model.js";
import ProductionCompany from "./productionCompany.model.js";
import Publisher from "./publisher.model.js";
import RecordLabel from "./recordLabel.model.js";
import RequestLog from "./requestLogs.model.js";
import Series from "./series.model.js";
import Studio from "./studio.model.js";
import User from "./user.model.js";
import UserContent from "./userContent.model.js";
import UserProfile from "./userProfile.model.js";
import UserRelationship from "./userRelationship.model.js";
import UserSuggestions from "./userSuggestion.model.js";
import Video from "./video.model.js";

const models = {
    User,
    RequestLog,
    DbLogs,
    Movie,
    ProductionCompany,
    Person,
    Studio,
    Distributor,
    Book,
    Series,
    MusicAlbum,
    MusicVideo,
    LivePerformance,
    UserContent,
    Music,
    Publisher,
    RecordLabel,
    UserSuggestions,
    UserProfile,
    Video,
    UserRelationship,
    Notification,
    Chat
};

export default models;
