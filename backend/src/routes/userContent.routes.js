import express from "express";
import controllers from "../controllers/index.js";
import validations from "../validations/index.js";
import validate from "../middlewares/validate.js";
import middlewares from "../middlewares/index.js";

const router = express.Router();
router.use(middlewares.authMiddleware);

router.post("/", controllers.userContentController.addContent);
router.patch("/:contentId/status", controllers.userContentController.updateContentStatus);
router.get("/", controllers.userContentController.getUserContent);
router.get("/:contentId", controllers.userContentController.getContentById);
router.delete("/:contentId", controllers.userContentController.deleteContent);

const userContentRouter = router;
export default userContentRouter;