import express from "express";
import controllers from "../controllers/index.js";
import validations from "../validations/index.js";
import validate from "../middlewares/validate.js";
import middlewares from "../middlewares/index.js"
const router = express.Router();
router.use(middlewares.authMiddleware);

router.post("/suggest", controllers.suggestionController.suggestContent);

const suggestionRouter = router;
export default suggestionRouter;
