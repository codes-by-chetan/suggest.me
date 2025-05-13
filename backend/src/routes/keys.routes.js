import { Router } from "express";
import controllers from "../controllers/index.js";
const router = Router();

router.post("/store/key/public", (req,res)=>{});
router.post("/update-keys", controllers.userController.updateUserKeys);
router.get("/keys", controllers.userController.getUserKeys);

const keysRouter = router;
export default keysRouter;
