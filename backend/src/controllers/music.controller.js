import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const getMusicDetails = asyncHandler(async (req, res) => {
    const musicId = req.params.musicId;
    const result = await services.musicService.getMusicDetails(musicId);
    const response = new ApiResponse(200, result, "Series details fetched!!!");
    res.status(200).json(response);
});

const musicController = { getMusicDetails };
export default musicController;
