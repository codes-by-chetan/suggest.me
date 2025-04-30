import express from "express";
import controllers from "../controllers/index.js";
import validations from "../validations/index.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

router.get("/tv/details/:seriesId", controllers.seriesController.getSeriesDetails)

const seriesRouter = router;
export default seriesRouter;
