import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import models from "../models/index.js";
import axios from "axios";
import config from "../config/env.config.js";

// TMDB API configuration
const TMDB_API_KEY = config.tmdb.apiKey;
const TMDB_AUTH_TOKEN = config.tmdb.accessToken;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Function to fetch TMDB data for movies or series
const fetchTMDBData = async (searchTerm, contentType, page, limit) => {
    const endpoint = contentType === "movies" ? "/search/movie" : "/search/tv";
    try {
        const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
            params: {
                api_key: TMDB_API_KEY,
                query: searchTerm,
                page,
                include_adult: false,
            },
            headers: {
                Authorization: `Bearer ${TMDB_AUTH_TOKEN}`,
            },
        });

        return response.data.results.map((item) => ({
            tmdbId: item.id.toString(),
            title: item.title || item.name,
            slug: item.title
                ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                : item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            poster: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                :  "" ,
            plot: item.overview || "",
            year: item.release_date
                ? parseInt(item.release_date.split("-")[0])
                : item.first_air_date
                  ? parseInt(item.first_air_date.split("-")[0])
                  : null,
            matchReason: "TMDB API",
        }));
    } catch (error) {
        console.error(`TMDB API error for ${contentType}:`, error.message);
        return [];
    }
};

// Factory function to generate searchable models
const getSearchableModels = () => {
    if (!models.Movie || !models.Series) {
        throw new Error(
            "Models not initialized. Ensure models/index.js is correctly set up."
        );
    }
    return [
        {
            model: models.Movie,
            name: "movies",
            fields: ["title", "genres", "plot", "keywords"],
            personFields: ["director", "writers", "cast.person"],
            select: "title slug poster director writers cast references.tmdbId",
        },
        {
            model: models.Series,
            name: "series",
            fields: ["title", "genres", "plot", "keywords"],
            personFields: ["creators", "cast.person"],
            select: "title slug poster creators cast references.tmdbId",
        },
        {
            model: models.Book,
            name: "books",
            fields: ["title", "genres", "description"],
            personFields: ["author"],
            select: "title slug coverImage author",
        },
        {
            model: models.Music,
            name: "music",
            fields: ["title", "genres", "mood"],
            personFields: ["artist"],
            select: "title slug artist",
        },
        {
            model: models.MusicAlbum,
            name: "albums",
            fields: ["title", "genres"],
            personFields: [],
            select: "title slug coverImage",
        },
        {
            model: models.MusicVideo,
            name: "musicVideos",
            fields: [],
            personFields: ["director"],
            select: "music slug director",
        },
        {
            model: models.Video,
            name: "videos",
            fields: ["title", "genres", "description", "keywords"],
            personFields: ["creator"],
            select: "title slug poster creator",
        },
        {
            model: models.Person,
            name: "people",
            fields: ["name", "biography", "professions"],
            personFields: [],
            select: "name slug profileImage",
        },
        {
            model: models.LivePerformance,
            name: "performances",
            fields: ["event", "location"],
            personFields: [],
            select: "event slug music",
        },
        {
            model: models.ProductionCompany,
            name: "productionCompanies",
            fields: ["name", "description"],
            personFields: [],
            select: "name slug logo",
        },
        {
            model: models.Studio,
            name: "studios",
            fields: ["name", "description"],
            personFields: [],
            select: "name slug logo",
        },
        {
            model: models.Publisher,
            name: "publishers",
            fields: ["name", "description"],
            personFields: [],
            select: "name slug logo",
        },
        {
            model: models.RecordLabel,
            name: "recordLabels",
            fields: ["name", "description"],
            personFields: [],
            select: "name slug logo",
        },
    ];
};

const globalSearch = async (
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "relevance",
    contentTypes = []
) => {
    // Validate search term
    console.log("searchTerm: ", searchTerm);
    if (
        !searchTerm ||
        typeof searchTerm !== "string" ||
        searchTerm.trim().length < 1
    ) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Search term must be a string with at least 2 characters"
        );
    }

    // Sanitize search term and create regex
    const sanitizedTerm = searchTerm
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(sanitizedTerm, "i");

    // Get searchable models
    const searchableModels = getSearchableModels();

    // Filter models based on contentTypes if provided
    const modelsToSearch = contentTypes.length
        ? searchableModels.filter((m) => contentTypes.includes(m.name))
        : searchableModels;

    // Step 1: Find matching Person IDs for artist search
    const matchingPersons = await models.Person.find({
        name: regex,
        isActive: true,
    })
        .select("_id")
        .lean();
    const personIds = matchingPersons.map((p) => p._id);

    // Prepare search queries
    const searchQueries = modelsToSearch.map(async (modelConfig) => {
        const { model, name, fields, personFields, select } = modelConfig;
        const results = [];
        let total = 0;

        // Query 1: Search on text fields (title, genres, etc.)
        if (fields.length) {
            const textQuery = {
                $or: fields.map((field) => ({ [field]: regex })),
                isActive: true,
            };
            const textTotal = await model.countDocuments(textQuery);
            const textResults = await model
                .find(textQuery)
                .select(select)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .then((docs) =>
                    docs.map((doc) => ({
                        ...doc,
                        matchReason: "Text fields",
                    }))
                );
            results.push(...textResults);
            total += textTotal;
        }

        // Query 2: Search on person-related fields (cast, director, etc.)
        if (personFields.length && personIds.length) {
            const personQuery = {
                $or: personFields.map((field) =>
                    field.includes(".")
                        ? { [field]: { $in: personIds } }
                        : { [field]: { $in: personIds } }
                ),
                isActive: true,
            };
            const personTotal = await model.countDocuments(personQuery);
            const personResults = await model
                .find(personQuery)
                .select(select)
                .populate(personFields.map((field) => field.split(".")[0]))
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .then((docs) =>
                    docs.map((doc) => ({
                        ...doc,
                        matchReason: `Person fields (${personFields.join(", ")})`,
                    }))
                );
            results.push(...personResults);
            total += personTotal;
        }

        // Step 3: Fetch from TMDB if no results for movies or series
        let tmdbResults = [];
        if (
            (name === "movies" || name === "series") &&
            results.length === 0 &&
            fields.includes("title")
        ) {
            tmdbResults = await fetchTMDBData(searchTerm, name, page, limit);

            // Filter out TMDB results that already exist in the database
            const existingTmdbIds = await model
                .find({
                    "references.tmdbId": {
                        $in: tmdbResults.map((r) => r.tmdbId),
                    },
                })
                .select("references.tmdbId")
                .lean()
                .then((docs) => docs.map((doc) => doc.references.tmdbId));

            tmdbResults = tmdbResults.filter(
                (result) => !existingTmdbIds.includes(result.tmdbId)
            );

            results.push(...tmdbResults);
            total += tmdbResults.length;
        }

        // Deduplicate results by _id or tmdbId
        const uniqueResults = Array.from(
            new Map(
                results.map((item) => [
                    item._id ? item._id.toString() : item.tmdbId,
                    item,
                ])
            ).values()
        );

        // Sort by relevance if specified
        if (sortBy === "relevance" && uniqueResults.length) {
            uniqueResults.sort((a, b) => {
                let aScore = fields.reduce((score, field) => {
                    const value = a[field] || "";
                    return (
                        score +
                        (value
                            .toLowerCase()
                            .includes(sanitizedTerm.toLowerCase())
                            ? 1
                            : 0)
                    );
                }, 0);
                let bScore = fields.reduce((score, field) => {
                    const value = b[field] || "";
                    return (
                        score +
                        (value
                            .toLowerCase()
                            .includes(sanitizedTerm.toLowerCase())
                            ? 1
                            : 0)
                    );
                }, 0);
                // Boost score for person matches
                if (a.matchReason.includes("Person fields")) aScore += 2;
                if (b.matchReason.includes("Person fields")) bScore += 2;
                // Lower score for TMDB results to prioritize local data
                if (a.matchReason === "TMDB API") aScore -= 1;
                if (b.matchReason === "TMDB API") bScore -= 1;
                return bScore - aScore;
            });
        }

        // Apply pagination to unique results
        const paginatedResults = uniqueResults.slice(0, limit);

        return { name, results: paginatedResults, total };
    });

    // Execute all queries concurrently
    const searchResults = await Promise.all(searchQueries);

    // Format results
    const formattedResults = searchResults.reduce(
        (acc, { name, results, total }) => {
            acc[name] = { data: results, total };
            return acc;
        },
        {}
    );

    // Calculate pagination metadata
    const totalResults = searchResults.reduce(
        (sum, { total }) => sum + total,
        0
    );
    const totalPages = Math.ceil(totalResults / limit);

    return {
        results: formattedResults,
        pagination: {
            page,
            limit,
            totalResults,
            totalPages,
        },
    };
};

const searchUser = async (searchTerm, page = 1, limit = 10) => {
    console.log("searchTerm:", searchTerm);
    if (
        !searchTerm ||
        typeof searchTerm !== "string" ||
        searchTerm.trim().length < 1
    ) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Search term must be a non-empty string"
        );
    }

    // Sanitize search term
    const sanitizedTerm = searchTerm
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    console.log("Sanitized term:", sanitizedTerm);

    // Build query conditions with $regex and $options
    const queryConditions = [
        { userName: { $regex: sanitizedTerm, $options: "i" } },
        { email: { $regex: sanitizedTerm, $options: "i" } },
        { "fullName.firstName": { $regex: sanitizedTerm, $options: "i" } },
        { "fullName.lastName": { $regex: sanitizedTerm, $options: "i" } },
    ];

    // Build query
    const query = {
        $or: queryConditions,
        status: "ACTIVE",
        deleted: false,
    };

    console.log("Query:", JSON.stringify(query, null, 2));

    const total = await models.User.countDocuments(query);
    console.log("Total matching users:", total);

    const users = await models.User.find(query)
        .populate("profile")
        .select("fullName userName email profile _id fullNameString")
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    console.log("Found users:", users);

    return {
        data: users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const searchService = {
    globalSearch,
    searchUser,
};

export default searchService;
