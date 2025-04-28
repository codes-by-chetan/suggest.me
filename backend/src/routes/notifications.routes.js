import express from "express";
import controllers from "../controllers/index.js";
import validations from "../validations/index.js";
import validate from "../middlewares/validate.js";
import middleware from "../middlewares/index.js";
import userRelationsRouter from "./userRelations.routes.js";

const router = express.Router();

router.use(middleware.authMiddleware);
router.get("/", controllers.userController.getAllNotifications);
router.post(
    "/mark/all/read",
    controllers.notificationController.markAllNotificationsAsRead
);
router.post(
    "/mark/all/dismiss/",
    controllers.notificationController.dismissNotification
);
router.post(
    "/mark/read/:notificationId/",
    controllers.notificationController.markNotificationAsRead
);

router.post(
    "/mark/dismiss/:notificationId/",
    controllers.notificationController.dismissNotification
);

const notificationRouter = router;
export default notificationRouter;
