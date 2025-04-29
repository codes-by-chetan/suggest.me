import mongoose from "mongoose";
import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import axios from "axios";
import config from "../config/env.config.js";

// TMDB API configuration
const TMDB_API_KEY = config.tmdb.apiKey;
const TMDB_AUTH_TOKEN = config.tmdb.accessToken;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Helper function to fetch movie details from TMDB
const fetchFromTmdb = async (tmdbId) => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
            params: {
                api_key: TMDB_API_KEY,
                append_to_response: "credits,release_dates,images",
            },
            headers: {
                Authorization: `Bearer ${TMDB_AUTH_TOKEN}`,
            },
        });

        const movie = response.data;
        if (!movie) {
            return null;
        }

        // Map TMDB data to your Movie schema
        return {
            title: movie.title,
            tmdbId: movie.id.toString(),
            slug: movie.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            plot: movie.overview || "",
            year: movie.release_date ? parseInt(movie.release_date.split("-")[0]) : null,
            released: movie.release_date ? new Date(movie.release_date) : null,
            runtime: movie.runtime || null,
            genres: movie.genres ? movie.genres.map((g) => g.name).slice(0, 5) : [],
            director: [], // TMDB credits.director needs to be mapped to Person IDs
            writers: [], // TMDB credits.writers needs to be mapped to Person IDs
            cast: movie.credits?.cast
                ? movie.credits.cast.slice(0, 50).map((actor) => ({
                      person: null, // Needs Person ID mapping
                      character: actor.character || "",
                  }))
                : [],
            poster: movie.poster_path
                ? {
                      url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                      publicId: movie.poster_path,
                  }
                : { url: "", publicId: "" },
            language: movie.spoken_languages
                ? movie.spoken_languages.map((l) => l.english_name).slice(0, 5)
                : [],
            country: movie.production_countries
                ? movie.production_countries[0]?.name
                : "",
            rated: movie.release_dates?.results
                ?.find((r) => r.iso_3166_1 === "US")
                ?.release_dates[0]?.certification || "Unrated",
            production: {
                companies: [], // Needs ProductionCompany ID mapping
                studios: [], // Needs Studio ID mapping
                distributors: [], // Needs Distributor ID mapping
            },
            references: {
                tmdbId: movie.id.toString(),
                imdbId: movie.imdb_id || "",
            },
            keywords: movie.keywords?.keywords
                ? movie.keywords.keywords.map((k) => k.name).slice(0, 20)
                : [],
            isActive: true,
            isVerified: false,
            createdBy: null, // Requires a default User ID
            updatedBy: null, // Requires a default User ID
        };
    } catch (error) {
        console.error(`TMDB API error for movie ${tmdbId}:`, error.message);
        return null;
    }
};

// Service to get movie details by movieId or tmdbId
const getMovieDetails = async (movieId, userId) => {
    if (!movieId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Movie ID or TMDB ID is required");
    }

    // Check if movieId is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(movieId);

    // Query the database
    let query = {};
    if (isValidObjectId) {
        query = { $or: [{ _id: movieId }, { "references.tmdbId": movieId }] };
    } else {
        query = { "references.tmdbId": movieId };
    }

    let movie = await models.Movie.findOne(query)
        .populate("director")
        .populate("writers")
        .populate("cast.person")
        .populate("production.companies")
        .populate("production.studios")
        .populate("production.distributors")
        .populate("createdBy")
        .populate("updatedBy")
        .lean();

    if (movie) {
        return movie;
    }

    // Fetch from TMDB if not found in database
    const tmdbMovieDetails = await fetchFromTmdb(movieId);
    if (!tmdbMovieDetails) {
        throw new ApiError(httpStatus.NOT_FOUND, "Movie not found");
    }

    // Ensure createdBy and updatedBy are set (use a default user or the requesting user)
    tmdbMovieDetails.createdBy = userId || "000000000000000000000000"; // Replace with a default User ID
    tmdbMovieDetails.updatedBy = userId || "000000000000000000000000"; // Replace with a default User ID

    // Save to database
    try {
        const newMovie = await models.Movie.create(tmdbMovieDetails);
        // Populate the saved movie
        const populatedMovie = await models.Movie.findById(newMovie._id)
            .populate("director")
            .populate("writers")
            .populate("cast.person")
            .populate("production.companies")
            .populate("production.studios")
            .populate("production.distributors")
            .populate("createdBy")
            .populate("updatedBy")
            .lean();
        return populatedMovie;
    } catch (error) {
        console.error("Error saving movie to database:", error.message);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to save movie to database");
    }
};

const movieService = {
    getMovieDetails,
};

export default movieService;