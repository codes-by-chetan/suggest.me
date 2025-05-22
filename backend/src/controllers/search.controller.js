import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const searchUser = asyncHandler(async (req, res) => {
    const { query } = req;
    const { search, page = "1", limit = "10" } = query;

    // Validate search term
    if (!search || typeof search !== "string" || search.trim().length < 1) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Search query is required and must be a non-empty string");
    }

    // Parse pagination parameters
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || parsedPage < 1) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Page must be a positive integer");
    }
    if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Limit must be a positive integer");
    }

    const users = await services.searchService.searchPeople({
        searchTerm: search.trim(),
        page: parsedPage,
        limit: parsedLimit,
    });

    const response = new ApiResponse(
        httpStatus.OK,
        users,
        "Users fetched successfully"
    );
    res.status(httpStatus.OK).json(response);
});

const searchThroughGlobal = asyncHandler(async (req, res) => {
    const type = req?.params?.type;
    const { query } = req;
    const { search, page = "1", limit = "10", sortBy = "relevance" } = query;

    // Validate search term
    if (!search || typeof search !== "string" || search.trim().length < 1) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Search query is required and must be a non-empty string");
    }

    // Parse pagination and sort parameters
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || parsedPage < 1) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Page must be a positive integer");
    }
    if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Limit must be a positive integer");
    }

    // Validate sortBy
    const validSortOptions = ["relevance", "title", "year"];
    if (sortBy && !validSortOptions.includes(sortBy)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "sortBy must be one of: relevance, title, year");
    }

    console.log(`Search query: search=${search}, type=${type}, page=${parsedPage}, limit=${parsedLimit}, sortBy=${sortBy}`);

    const searchResults = await services.searchService.globalSearch({
        searchType: "global",
        searchTerm: search.trim(),
        contentTypes: [type ? type : "all"],
        page: parsedPage,
        limit: parsedLimit,
        sortBy,
    });

    // Flatten the response structure to match the old format
    const responseData = {
        results: searchResults.data.results,
        pagination: searchResults.pagination
    };

    const response = new ApiResponse(
        httpStatus.OK,
        responseData,
        "Search results fetched successfully"
    );
    res.status(httpStatus.OK).json(response);
});

const searchController = { searchUser, searchThroughGlobal };
export default searchController;