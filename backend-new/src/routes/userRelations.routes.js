import express from "express";
import controllers from "../controllers/index.js";
import validations from "../validations/index.js";
import validate from "../middlewares/validate.js";
import middlewares from "../middlewares/index.js";

const router = express.Router();

router.use(middlewares.authMiddleware);

router.get(
    "/follow/:followingId",
    controllers.userRelationsController.followUser
);
router.get(
    "/unfollow/:followingId",
    controllers.userRelationsController.unfollowUser
);
router.get(
    "/accept/follow/:requestId",
    controllers.userRelationsController.acceptFollowRequest
);
router.get(
    "/relation/:followingId",
    controllers.userRelationsController.getRelation
);
router.get(
    "/follows/you/:followingId",
    controllers.userRelationsController.getFollowsYou
);

router.get("/friends", controllers.userRelationsController.getFriends);
const userRelationsRouter = router;
export default userRelationsRouter;
