import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const deepResearch = asyncHandler(async (req, res) => {
    const result = await services.researchService.deepResearch(req.body);
    const response = new ApiResponse(200, result, "Research Complete!!!");
    res.status(200).json(response);
});

const researchController = { deepResearch };
export default researchController;
