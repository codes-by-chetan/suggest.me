import logger from "../config/logger.config.js";

const initializeSocket = (io) => {
    io.on("connection", (socket) => {
        logger.logMessage("info", "A user connected: " + socket.id, "SOCKET");

        // User joins a room based on their userId
        socket.on("join", (userId) => {
            socket.join(userId);
            logger.logMessage(
                "info",
                `User ${userId} joined their room`,
                "SOCKET"
            );
        });

        // Example event: when a user sends a message (from previous setup)
        socket.on("message", (msg) => {
            logger.logMessage("info", "Message received: " + msg, "SOCKET");
            io.emit("message", msg);
        });

        // Test event (from previous setup)
        socket.on("test-connection", (data) => {
            logger.logMessage(
                "info",
                "Test connection message received: " + data,
                "SOCKET"
            );
            socket.emit("test-response", "Connection is working fine, bhai!");
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
const sendNotification = async (io, userId, notification) => {
    io.to(userId).emit("notification", notification);
    logger.logMessage(
        "info",
        `Notification sent to user ${userId}: ${JSON.stringify(notification)}`,
        "SOCKET"
    );
};

// Export both the initialize function and the notification method
export { initializeSocket, sendNotification };
