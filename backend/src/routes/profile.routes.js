import express from "express";
import controllers from "../controllers/index.js";
import validations from "../validations/index.js";
import validate from "../middlewares/validate.js";
import middlewares from "../middlewares/index.js";

const router = express.Router();


router.get("/:userId", middlewares.userMiddleware, controllers.userController.getUserFullProfileById);

const profileRouter = router;
export default profileRouter;
