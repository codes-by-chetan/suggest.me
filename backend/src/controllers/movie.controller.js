import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const getMovieDetails = asyncHandler(async (req, res) => {
    const movieId = req.params.movieId;
    const result = await services.movieService.getMovieDetails(movieId);
    const response = new ApiResponse(200, result, "Movie details fetched!!!");
    res.status(200).json(response);
});

const movieController = { getMovieDetails };
export default movieController;
