import app from "./app.js";
import config from "./config/env.config.js";
import logger from "./config/logger.config.js";
import connectDB from "./db/index.js";
import getHostIpAddress from "./utils/hostIP.js";
import { Server } from "socket.io";
import { initializeSocket } from "./sockets/socket.js";
let io;

connectDB()
    .then(() => {
        const server = app.listen(config.port || 5000, () => {
            const host = getHostIpAddress();
            const port = config.port || 5000;
            logger.logMessage("success", "Server Started Successfully");
            logger.logMessage("info", `Server is listening at Port : ${port}`);
            logger.logMessage("info", `Server url ==> http://${host}:${port}`);
        });

        io = new Server(server, {
            cors: {
                origin: [
                    "http://localhost:5173",
                    "http://192.168.0.39:5173",
                    "http://localhost:5174",
                    "https://suggest-me-prototype.netlify.app/",
                    "https://suggest-me-prototype.netlify.app",
                ],
                credentials: true,
            },
        });

        // Initialize socket.io logic
        initializeSocket(io);
    })
    .catch((err) => {
        logger.logMessage("error", "Error While Creating Server!!! : ", err);
    });

export { io };
