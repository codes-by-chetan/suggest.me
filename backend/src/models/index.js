import Book from "./book.model.js";
import DbLogs from "./dbLogs.model.js";
import Distributor from "./distributor.model.js";
import LivePerformance from "./livePerformance.model.js";
import Movie from "./movie.model.js";
import MusicAlbum from "./musicAlbum.model.js";
import MusicRemix from "./musicRemix.model.js";
import MusicVideo from "./musicVideo.model.js";
import Person from "./person.model.js";
import ProductionCompany from "./productionCompany.model.js";
import RequestLog from "./requestLogs.model.js";
import Series from "./series.model.js";
import Studio from "./studio.model.js";
import User from "./user.model.js";

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
    MusicRemix,
};

export default models;
