import express from "express";
import authRoutes from "./auth.routes.js";
import logsRouter from "./logs.routes.js";
import searchRouter from "./search.routes.js";
import userRoutes from "./user.routes.js";
import profileRouter from "./profile.routes.js";
import userRelationsRouter from "./userRelations.routes.js";
import notificationRouter from "./notifications.routes.js";
import moviesRouter from "./movies.routes.js";
import seriesRouter from "./series.routes.js";
import bookRouter from "./books.routes.js";
import musicRouter from "./music.routes.js";
import researchRouter from "./research.routes.js";
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
    {
        path: "/notifications",
        route: notificationRouter,
    },
    {
        path: "/movies",
        route: moviesRouter,
    },
    {
        path: "/series",
        route: seriesRouter,
    },
    {
        path: "/books",
        route: bookRouter,
    },
    {
        path: "/musics",
        route: musicRouter,
    },
    {
        path: "/research",
        route: researchRouter,
    },
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

const mainRouter = router;
export default mainRouter;
