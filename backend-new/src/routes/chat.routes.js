import express from "express";
import controllers from "../controllers/index.js";
import middleware from "../middlewares/index.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(middleware.authMiddleware);

// Get all chats for the user
router.get("/", controllers.chatController.getChats);

// Get messages for a specific chat
router.get("/:chatId/messages", controllers.chatController.getChatMessages);

// Send a message in a chat
router.post("/:chatId/messages", controllers.chatController.sendMessage);

// Mark a chat as read (marks all messages as read)
router.put("/:chatId/mark-read", controllers.chatController.markChatAsRead);

// Create a new chat (private or group)
router.post("/", controllers.chatController.createChat);

// Add a participant to a group chat
router.post("/:chatId/participants", controllers.chatController.addParticipant);

// Remove a participant from a group chat
router.delete("/:chatId/participants/:userId", controllers.chatController.removeParticipant);

const chatRouter = router;
export default chatRouter;