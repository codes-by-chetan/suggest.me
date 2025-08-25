// File: src/controllers/trending.controller.js
import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getTrendingMovies = asyncHandler(async (req, res) => {
    const result = await services.trendingService.getTrendingMovies();
    const response = new ApiResponse(200, result, "Trending movies fetched successfully.");
    res.status(200).json(response);
});

const getTrendingSeries = asyncHandler(async (req, res) => {
    const result = await services.trendingService.getTrendingSeries();
    const response = new ApiResponse(200, result, "Trending series fetched successfully.");
    res.status(200).json(response);
});

const getTrendingMusic = asyncHandler(async (req, res) => {
    const result = await services.trendingService.getTrendingMusic();
    const response = new ApiResponse(200, result, "Trending music fetched successfully.");
    res.status(200).json(response);
});

const getTrendingBooks = asyncHandler(async (req, res) => {
    const result = await services.trendingService.getTrendingBooks();
    const response = new ApiResponse(200, result, "Trending books fetched successfully.");
    res.status(200).json(response);
});

const trendingController = {
    getTrendingMovies,
    getTrendingSeries,
    getTrendingMusic,
    getTrendingBooks,
};

export default trendingController;