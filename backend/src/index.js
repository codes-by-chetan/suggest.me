import app from "./app.js";
import config from "./config/env.config.js";
import logger from "./config/logger.config.js";
import connectDB from "./db/index.js";
import getHostIpAddress from "./utils/hostIP.js";
import { Server } from "socket.io";
import { initializeSocket } from "./sockets/socket.js";
import nodemailer from "nodemailer";
import { sendTestMail } from "./utils/mailer.js";

let io;
let transporter;

connectDB()
    .then(() => {
        const host = getHostIpAddress();
        const port = config.port || 5000;
        const serverUrl = `http://${host}:${port}`;
        const server = app.listen(config.port || 5000, () => {
            logger.logMessage("success", "Server Started Successfully");
            logger.logMessage("info", `Server is listening at Port : ${port}`);
            logger.logMessage("info", `Server url ==> ${serverUrl}`);
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

        transporter = nodemailer.createTransport({
            service: config.email.service,
            auth: {
                user: config.email.id,
                pass: config.email.passkey,
            },
        });
        // sendTestMail({ port, host, url: serverUrl });
    })
    .catch((err) => {
        logger.logMessage("error", "Error While Creating Server!!! : ", err);
    });

export { io, transporter };
