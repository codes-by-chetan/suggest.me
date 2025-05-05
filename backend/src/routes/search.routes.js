import express from "express";
import controllers from "../controllers/index.js";

const router = express.Router();

router.get("/", controllers.searchController.searchThroughGlobal);
router.get("/:type", controllers.searchController.searchThroughGlobal);
router.get("/users", controllers.searchController.searchUser);

const searchRouter = router;
export default searchRouter;
