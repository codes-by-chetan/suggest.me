import logger from "../config/logger.config.js";

const initializeSocket = (io) => {
    io.on("connection", (socket) => {
        logger.logMessage(
            "info",
            "A user connected: " + socket.id,
            "SOCKET",
            "SOCKET"
        );

        // User joins a room based on their userId
        socket.on("join", (userId) => {
            const userIdString = userId.toString(); // Convert ObjectId to string
            socket.join(userIdString);
            logger.logMessage(
                "info",
                `User ${userIdString} joined their room`,
                "SOCKET"
            );
            // Debug log to confirm room state after joining
            console.log("Rooms after join:", io.sockets.adapter.rooms);
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            logger.logMessage(
                "info",
                "A user disconnected: " + socket.id,
                "SOCKET"
            );
        });
    });
};

// Methods to send notifications
const sendNotification = async (io, userId, notifications) => {
    for (const notification of notifications) {
        // Check if the user is in the room
        const room = io.sockets.adapter.rooms.get(userId.toString());
        console.log("rooms : ", io.sockets.adapter.rooms);
        console.log(
            "Checking room for userId:",
            userId,
            "Room exists:",
            !!room
        );
        if (!room) {
            logger.logMessage(
                "warn",
                `User ${userId} is not in the room, cannot emit notification`,
                "SOCKET"
            );
            continue; // Uncomment this to skip emission if room doesn't exist
        }

        logger.logMessage("debug", `Emitting to room ${userId}:`);
        io.to(userId.toString()).emit("notification", notification);
        logger.logMessage(
            "info",
            `Notification sent to user ${userId}: ${JSON.stringify(notification)}`,
            "SOCKET"
        );
    }
};

const EmmitFollowAcceptedEvent = async (io, userId, data) => {
    const room = io.sockets.adapter.rooms.get(userId.toString());
    if (!room) {
        logger.logMessage(
            "warn",
            `User ${userId} is not in the room, cannot emit followAcceptedEvent`,
            "SOCKET"
        );
        return;
    }
    io.to(userId.toString()).emit("followAccepted", data);
    logger.logMessage(
        "info",
        `followAcceptedEvent sent to user ${userId}: ${JSON.stringify(data)}`,
        "SOCKET"
    );
};

const EmmitFollowedYouEvent = async (io, userId, data) => {
    const room = io.sockets.adapter.rooms.get(userId.toString());
    if (!room) {
        logger.logMessage(
            "warn",
            `User ${userId} is not in the room, cannot emit followedYouEvent`,
            "SOCKET"
        );
        return;
    }
    io.to(userId.toString()).emit("followedYou", data);
    logger.logMessage(
        "info",
        `followedYouEvent sent to user ${userId}: ${JSON.stringify(data)}`,
        "SOCKET"
    );
};

const EmmitUnFollowedYouEvent = async (io, userId, data = null) => {
    const room = io.sockets.adapter.rooms.get(userId.toString());
    if (!room) {
        logger.logMessage(
            "warn",
            `User ${userId} is not in the room, cannot emit unFollowedYouEvent`,
            "SOCKET"
        );
        return;
    }
    io.to(userId.toString()).emit("unFollowedYou", data);
    logger.logMessage(
        "info",
        `unFollowedYouEvent sent to user ${userId}: ${JSON.stringify(data)}`,
        "SOCKET"
    );
};

// Export both the initialize function and the notification method
export {
    initializeSocket,
    sendNotification,
    EmmitFollowAcceptedEvent,
    EmmitFollowedYouEvent,
    EmmitUnFollowedYouEvent,
};
