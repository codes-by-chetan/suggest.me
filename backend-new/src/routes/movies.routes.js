import express from "express";
import controllers from "../controllers/index.js";
import validations from "../validations/index.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

router.get("/movie/details/:movieId", controllers.movieController.getMovieDetails)

const moviesRouter = router;
export default moviesRouter;
