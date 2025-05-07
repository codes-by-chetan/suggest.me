import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const suggestContent = asyncHandler(async (req, res) => {
    const { content, note, recipients } = req?.body;
    const result = await services.suggestionService.createSuggestion(
        req.user,
        content,
        note,
        recipients
    );
    const response = new ApiResponse(200, result, "Series details fetched!!!");
    res.status(200).json(response);
});

const suggestionController = {suggestContent};
export default suggestionController;
