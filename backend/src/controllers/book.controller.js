import services from "../services/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import httpStatus from "http-status";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const getBookDetails = asyncHandler(async (req, res) => {
    const bookId = req.params.bookId;
    let data = { id: bookId };
    if (req?.user) {
        data["userId"] = req.user._id;
    }
    const result = await services.bookService.getBookDetails(data);
    const response = new ApiResponse(200, result, "Book details fetched!!!");
    res.status(200).json(response);
});

const bookController = { getBookDetails };
export default bookController;
