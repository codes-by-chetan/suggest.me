import express from "express";
import authRoutes from "./auth.routes.js";
import logsRouter from "./logs.routes.js";
import searchRouter from "./search.routes.js";
const router = express.Router();

// Routes index
const defaultRoutes = [
    {
        path: "/auth", // base path for auth routes
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
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

const mainRouter = router;
export default mainRouter;
