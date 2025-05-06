import express from "express";
import controllers from "../controllers/index.js";

const router = express.Router();
router.get("/users", controllers.searchController.searchUser);
router.get("/global", controllers.searchController.searchThroughGlobal);
router.get("/global/:type", controllers.searchController.searchThroughGlobal);


const searchRouter = router;
export default searchRouter;
