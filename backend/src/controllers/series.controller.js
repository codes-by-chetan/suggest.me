import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const getSeriesDetails = asyncHandler(async (req, res) => {
    const seriesId = req.params.seriesId;
    let data = { id: seriesId };
    if (req?.user) {
        data["userId"] = req.user._id;
    }
    const result = await services.seriesService.getSeriesDetails(data);
    const response = new ApiResponse(200, result, "Series details fetched!!!");
    res.status(200).json(response);
});

const seriesController = { getSeriesDetails };
export default seriesController;
