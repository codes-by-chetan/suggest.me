import express from "express";
import controllers from "../controllers/index.js";
import validations from "../validations/index.js";
import validate from "../middlewares/validate.js";
import middleware from "../middlewares/index.js";
import userRelationsRouter from "./userRelations.routes.js";

const router = express.Router();

router.use(middleware.authMiddleware);
router.get("/profile", controllers.userController.getUserProfile);

router.get("/profile-whole", controllers.userController.getUserFullProfile);
router.post("/update/profile", controllers.userController.updateUserProfile);
router.post(
    "/avatar",
    middleware.upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
    ]),
    controllers.userController.updateUserAvatar
);
const userRouter = router;
export default userRouter;
