import { Router } from "express";
import controllers from "../controllers/index.js";
const router = Router();

router.post("/store/key/public", controllers.userKeyController.createUserKey);
router.get("/", controllers.userKeyController.getAllUserKeys);
router.get("/public/:userId", controllers.userKeyController.getUserAllKeys);

const keysRouter = router;
export default keysRouter;
