import dbLogger from "./dbLogger.middleware.js";
import errorHandler from "./errorHandler.middleware.js";
import requestLoggerMiddleware from "./requestLogger.middleware.js";

const middlewares = { dbLogger, errorHandler, requestLoggerMiddleware };

export default middlewares;
