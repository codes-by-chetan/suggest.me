import logger from "../config/logger.config.js";

const initializeSocket = (io) => {
    io.on("connection", (socket) => {
        logger.logMessage("info", "A user connected: " + socket.id, "SOCKET");

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
        console.log("Checking room for userId:", userId, "Room exists:", !!room);
        if (!room) {
            console.log(`User ${userId} is not in the room, cannot emit notification`);
            continue; // Uncomment this to skip emission if room doesn't exist
        }

        console.log(`Emitting to room ${userId}:`, notification);
        io.to(userId.toString()).emit("notification", notification);
        logger.logMessage(
            "debug",
            `Emitting notification to user ${userId}: ${JSON.stringify(notification)}`,
            "SOCKET"
        );
        logger.logMessage(
            "info",
            `Notification sent to user ${userId}: ${JSON.stringify(notification)}`,
            "SOCKET"
        );
    }
};
// Export both the initialize function and the notification method
export { initializeSocket, sendNotification };
