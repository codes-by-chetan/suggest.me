// File: src/routes/trending.routes.js
import express from "express";
import controllers from "../controllers/index.js";

const router = express.Router();

router.get("/movies", controllers.trendingController.getTrendingMovies);
router.get("/series", controllers.trendingController.getTrendingSeries);
router.get("/music", controllers.trendingController.getTrendingMusic);
router.get("/books", controllers.trendingController.getTrendingBooks);

const trendingRouter = router;
export default trendingRouter;