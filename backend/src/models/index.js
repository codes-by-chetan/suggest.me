import Book from "./book.model.js";
import DbLogs from "./dbLogs.model.js";
import Distributor from "./distributor.model.js";
import Movie from "./movie.model.js";
import Person from "./person.model.js";
import ProductionCompany from "./productionCompany.model.js";
import RequestLog from "./requestLogs.model.js";
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
};

export default models;
