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
    const response = new ApiResponse(200, result, "suggestion sent!!!");
    res.status(200).json(response);
});
const getSuggestionDetails = asyncHandler(async (req, res) => {
    const suggestionId = req?.params?.suggestionId;
    const result = await services.suggestionService.getSuggestionDetails(
        suggestionId,
        req?.user._id
    );
    const response = new ApiResponse(
        200,
        result,
        "Suggestion details fetched!!!"
    );
    res.status(200).json(response);
});

const getSuggestionsSentByYou = asyncHandler(async (req, res) => {
    const result = await services.suggestionService.getSuggestionsByUser(
        req?.user._id
    );
    const response = new ApiResponse(
        200,
        result,
        "Suggestion sent by you fetched!!!"
    );
    res.status(200).json(response);
});
const getSuggestionsForYou = asyncHandler(async (req, res) => {
    const result = await services.suggestionService.getSuggestionsForUser(
        req?.user._id
    );
    const response = new ApiResponse(
        200,
        result,
        "Suggestion for you fetched!!!"
    );
    res.status(200).json(response);
});

const suggestionController = {
    suggestContent,
    getSuggestionDetails,
    getSuggestionsSentByYou,
    getSuggestionsForYou,
};
export default suggestionController;
