import app from "./app.js";
import config from "./config/env.config.js";
import logger from "./config/logger.config.js";
import connectDB from "./db/index.js";
import getHostIpAddress from "./utils/hostIP.js";

connectDB()
    .then(() => {
        app.listen(config.port || 5000, () => {
            const host = getHostIpAddress();
            const port = config.port || 5000;
            logger.logMessage("success", "Server Started Successfully")
            logger.logMessage("info",`Server is listening at Port : ${port}`);
            logger.logMessage("info",`Server url ==> http://${host}:${port}`);
        });
    })
    .catch((err) => {
        logger.logMessage("error","Error While Creating Server!!! : ", err);
    });
