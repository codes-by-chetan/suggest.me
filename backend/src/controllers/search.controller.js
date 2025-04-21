import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const searchUser = asyncHandler(async (req, res) => {
    const { query } = req;
    const { search } = query;
    if (!search) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Search query is required");
    }
    const users = await services.searchService.searchUser(search);
    const response = new ApiResponse(
        httpStatus.OK,
        users,
        "Users fetched successfully"
    );
    res.status(httpStatus.OK).json(response);
});
const searchThroughGlobal = asyncHandler(async (req, res) => {
    const { query } = req;
    const { search } = query;
    if (!search) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Search query is required");
    }
    const searchResults = await services.searchService.globalSearch(search);
    const response = new ApiResponse(
        httpStatus.OK,
        searchResults,
        "Search results fetched successfully"
    );
    res.status(httpStatus.OK).json(response);
});

const searchController = { searchUser, searchThroughGlobal };
export default searchController;
