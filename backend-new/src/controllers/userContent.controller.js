import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const addContent = asyncHandler(async (req, res) => {
    const { content, status, suggestionId } = req?.body;
    if (!content?.id || !content?.type) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, content ID ya type toh daal!"
        );
    }
    const result = await services.userContentService.addContent(
        req.user,
        content,
        status,
        suggestionId
    );
    const response = new ApiResponse(200, result, "Content watchlist mein jod diya!!!");
    res.status(200).json(response);
});

const updateContentStatus = asyncHandler(async (req, res) => {
    const { contentId } = req?.params;
    const { status } = req?.body;
    if (!status) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, status toh daal!"
        );
    }
    const result = await services.userContentService.updateContentStatus(
        req.user._id,
        contentId,
        status
    );
    const response = new ApiResponse(
        200,
        result,
        "Content ka status update ho gaya!!!"
    );
    res.status(200).json(response);
});

const getUserContent = asyncHandler(async (req, res) => {
    const { page, limit, type } = req.query;
    const params = {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        type,
    };
    const result = await services.userContentService.getUserContent(
        req.user._id,
        params
    );
    const response = new ApiResponse(
        200,
        result,
        "Teri watchlist fetch ho gayi!!!"
    );
    res.status(200).json(response);
});

const getContentById = asyncHandler(async (req, res) => {
    const { contentId } = req?.params;
    const result = await services.userContentService.getContentById(contentId);
    const response = new ApiResponse(
        200,
        result,
        "Content details fetch ho gaye!!!"
    );
    res.status(200).json(response);
});

const deleteContent = asyncHandler(async (req, res) => {
    const { contentId } = req?.params;
    const result = await services.userContentService.deleteContent(contentId);
    const response = new ApiResponse(
        200,
        result,
        "Content watchlist se hata diya!!!"
    );
    res.status(200).json(response);
});

const checkContent = asyncHandler(async (req, res) => {
    const { contentId, suggestionId } = req?.query;
    if (!contentId && !suggestionId) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, content ID ya suggestion ID, kuch toh daal!"
        );
    }
    const result = await services.userContentService.checkContent(
        req.user._id,
        contentId,
        suggestionId
    );
    const response = new ApiResponse(
        200,
        result,
        result ? "Content watchlist mein mil gaya!!!" : "Content watchlist mein nahi hai!"
    );
    res.status(200).json(response);
});

const userContentController = {
    addContent,
    updateContentStatus,
    getUserContent,
    getContentById,
    deleteContent,
    checkContent,
};

export default userContentController;