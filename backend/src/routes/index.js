import express from "express";
import authRoutes from "./auth.routes.js";
import logsRouter from "./logs.routes.js";
import searchRouter from "./search.routes.js";
import userRoutes from "./user.routes.js";
import profileRouter from "./profile.routes.js";
import userRelationsRouter from "./userRelations.routes.js";
const router = express.Router();

// Routes index
const defaultRoutes = [
    {
        path: "/auth",
        route: authRoutes,
    },
    {
        path: "/logs",
        route: logsRouter,
    },
    {
        path: "/search",
        route: searchRouter,
    },
    {
        path: "/user",
        route: userRoutes,
    },
    {
        path: "/profiles",
        route: profileRouter,
    },
    {
        path: "/relations",
        route: userRelationsRouter,
    },
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

const mainRouter = router;
export default mainRouter;
