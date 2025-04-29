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

// Helper function to fetch series details from TMDB
const fetchFromTmdb = async (tmdbId) => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
            params: {
                api_key: TMDB_API_KEY,
                append_to_response: "credits,content_ratings,images,keywords",
            },
            headers: {
                Authorization: `Bearer ${TMDB_AUTH_TOKEN}`,
            },
        });

        const series = response.data;
        if (!series) {
            return null;
        }

        // Map TMDB data to your Series schema
        return {
            title: series.name,
            tmdbId: series.id.toString(),
            slug: series.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            plot: series.overview || "",
            year: series.first_air_date ? parseInt(series.first_air_date.split("-")[0]) : null,
            firstAired: series.first_air_date ? new Date(series.first_air_date) : null,
            lastAired: series.last_air_date ? new Date(series.last_air_date) : null,
            runtime: series.episode_run_time?.[0] || null,
            genres: series.genres ? series.genres.map((g) => g.name).slice(0, 5) : [],
            creators: series.created_by
                ? series.created_by.map((c) => null).slice(0, 10) // Needs Person ID mapping
                : [],
            cast: series.credits?.cast
                ? series.credits.cast.slice(0, 50).map((actor) => ({
                      person: null, // Needs Person ID mapping
                      character: actor.character || "",
                  }))
                : [],
            poster: series.poster_path
                ? {
                      url: `https://image.tmdb.org/t/p/w500${series.poster_path}`,
                      publicId: series.poster_path,
                  }
                : { url: "", publicId: "" },
            language: series.spoken_languages
                ? series.spoken_languages.map((l) => l.english_name).slice(0, 5)
                : [],
            country: series.production_countries
                ? series.production_countries[0]?.name
                : "",
            rated: series.content_ratings?.results
                ?.find((r) => r.iso_3166_1 === "US")
                ?.rating || "Unrated",
            production: {
                companies: [], // Needs ProductionCompany ID mapping
                studios: [], // Needs Studio ID mapping
                distributors: [], // Needs Distributor ID mapping
            },
            references: {
                tmdbId: series.id.toString(),
                imdbId: series.external_ids?.imdb_id || "",
            },
            keywords: series.keywords?.results
                ? series.keywords.results.map((k) => k.name).slice(0, 20)
                : [],
            seasons: series.number_of_seasons || 1,
            episodes: series.number_of_episodes || 1,
            status: series.status === "Ended" ? "Completed" : series.status === "Canceled" ? "Canceled" : "Ongoing",
            seriesType: series.type === "Scripted" ? "TV Series" : series.type === "Miniseries" ? "Mini Series" : "Other",
            platform: series.networks?.[0]?.name || "",
            isActive: true,
            isVerified: false,
            createdBy: null, // Requires a default User ID
            updatedBy: null, // Requires a default User ID
        };
    } catch (error) {
        console.error(`TMDB API error for series ${tmdbId}:`, error.message);
        return null;
    }
};

// Service to get series details by seriesId or tmdbId
const getSeriesDetails = async (seriesId, userId) => {
    if (!seriesId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Series ID or TMDB ID is required");
    }

    // Check if seriesId is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(seriesId);

    // Query the database
    let query = {};
    if (isValidObjectId) {
        query = { $or: [{ _id: seriesId }, { "references.tmdbId": seriesId }] };
    } else {
        query = { "references.tmdbId": seriesId };
    }

    let series = await models.Series.findOne(query)
        .populate("creators")
        .populate("cast.person")
        .populate("production.companies")
        .populate("production.studios")
        .populate("production.distributors")
        .populate("createdBy")
        .populate("updatedBy")
        .lean();

    if (series) {
        return series;
    }

    // Fetch from TMDB if not found in database
    const tmdbSeriesDetails = await fetchFromTmdb(seriesId);
    if (!tmdbSeriesDetails) {
        throw new ApiError(httpStatus.NOT_FOUND, "Series not found");
    }

    // Ensure createdBy and updatedBy are set (use a default user or the requesting user)
    tmdbSeriesDetails.createdBy = userId || "000000000000000000000000"; // Replace with a default User ID
    tmdbSeriesDetails.updatedBy = userId || "000000000000000000000000"; // Replace with a default User ID

    // Save to database
    try {
        const newSeries = await models.Series.create(tmdbSeriesDetails);
        // Populate the saved series
        const populatedSeries = await models.Series.findById(newSeries._id)
            .populate("creators")
            .populate("cast.person")
            .populate("production.companies")
            .populate("production.studios")
            .populate("production.distributors")
            .populate("createdBy")
            .populate("updatedBy")
            .lean();
        return populatedSeries;
    } catch (error) {
        console.error("Error saving series to database:", error.message);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to save series to database");
    }
};

const seriesService = {
    getSeriesDetails,
};

export default seriesService;