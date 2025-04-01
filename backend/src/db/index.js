import mongoose from "mongoose";
import config from "../config/env.config.js";
import constants from "../constants/index.js";
import logger from "../config/logger.config.js";

const connectDB = async () => {
    try {
        logger.logMessage(
            "info",
            `${config.mongoose.url}/${constants.DB_CONSTANTS.DB_NAME}`
        );

        const connectionInstance = await mongoose.connect(
            `${config.mongoose.url}/${constants.DB_CONSTANTS.DB_NAME}`
        );
        logger.logMessage( "success",
            `MongoDB Connected Successfully !!! Hostname : ${connectionInstance.connections[0]?.host}`
        );
    } catch (error) {
        logger.logMessage("error","MongoDB connection error : ", error);
        logger.logMessage("info","Exiting the program");
        process.exit(1);
    }
};

export default connectDB;
