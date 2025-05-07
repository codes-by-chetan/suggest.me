import mongoose from "mongoose";
import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import axios from "axios";
import config from "../config/env.config.js";
import bookService from "./book.service.js";
import seriesService from "./series.service.js";
import movieService from "./movie.service.js";
import musicService from "./music.service.js";

const getContent = {
    movie: movieService.getMovieDetails,
    book: bookService.getBookDetails,
    series: seriesService.getSeriesDetails,
    music: musicService.getMusicDetails,
    video: null,
    anime: null,
};

const getSuggestionDetails = async () => {};

const createSuggestion = async (user, content, note, recipients) => {
    const contentDetails = getContent[content?.type](content.id);
    return contentDetails;
};

const suggestionService = {
    getSuggestionDetails,
    createSuggestion,
};

export default suggestionService;
