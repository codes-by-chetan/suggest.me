import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import models from "../models/index.js";
import axios from "axios";
import config from "../config/env.config.js";
import logger from "../config/logger.config.js";

// In-memory cache for search results (can be replaced with Redis in production)
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

// TMDB API configuration
const TMDB_API_KEY = config.tmdb.apiKey;
const TMDB_AUTH_TOKEN = config.tmdb.accessToken;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// OMDb API configuration
const OMDB_API_KEY = config.omdb.apiKey;
const OMDB_BASE_URL = "http://www.omdbapi.com/";

// Google Books API configuration
const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1";

// Function to fetch OMDb data for movies or series
const fetchOMDbData = async (searchTerm, contentType, page, limit) => {
    try {
        const response = await axios.get(OMDB_BASE_URL, {
            params: {
                apikey: OMDB_API_KEY,
                s: searchTerm,
                type: contentType === "movie" ? "movie" : "series",
                page,
            },
        });

        if (response.data.Response === "False") {
            logger.logMessage("warn", `OMDb API error: ${response.data.Error}`);
            return { data: [], total: 0 };
        }

        const data = (response.data.Search || []).map((item) => ({
            imdbId: item.imdbID,
            title: item.Title,
            slug: item.Title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            poster: item.Poster && item.Poster !== "N/A" ? item.Poster : "",
            plot: "", // OMDb search endpoint doesn't provide plot
            year: item.Year ? parseInt(item.Year.split("–")[0]) : null,
            matchReason: "OMDb API",
        }));

        return {
            data,
            total: parseInt(response.data.totalResults || 0),
        };
    } catch (error) {
        logger.logMessage("error", `OMDb API error for ${contentType}: ${error.message}`);
        return { data: [], total: 0 };
    }
};

// Function to fetch TMDB data for movies or series with OMDb fallback
const fetchTMDBData = async (searchTerm, contentType, page, limit) => {
    const endpoint = contentType === "movie" ? "/search/movie" : "/search/tv";
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

        const data = response.data.results.map((item) => ({
            tmdbId: item.id,
            imdbId: item.imdb_id || item.external_ids?.imdb_id || "",
            title: item.title || item.name,
            slug: item.title
                ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                : item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            poster: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : "",
            plot: item.overview || "",
            year: item.release_date
                ? parseInt(item.release_date.split("-")[0])
                : item.first_air_date
                  ? parseInt(item.first_air_date.split("-")[0])
                  : null,
            matchReason: "TMDB API",
        }));

        return {
            data,
            total: response.data.total_results || 0,
        };
    } catch (error) {
        logger.logMessage("error", `TMDB API error for ${contentType}: ${error.message}`);
        logger.logMessage("warn", `Falling back to OMDb API for ${contentType} search: ${searchTerm}`);
        return await fetchOMDbData(searchTerm, contentType, page, limit);
    }
};

// Function to get Spotify access token
const getSpotifyAccessToken = async () => {
    try {
        const response = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({
                grant_type: "client_credentials",
            }),
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(
                        `${config.spotify.clientId}:${config.spotify.clientSecret}`
                    ).toString("base64")}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        logger.logMessage("error", `Spotify token error: ${error.message}`);
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Failed to authenticate with Spotify API"
        );
    }
};

// Function to fetch Spotify data for music
const fetchSpotifyData = async (searchTerm, page, limit) => {
    try {
        const accessToken = await getSpotifyAccessToken();
        const response = await axios.get("https://api.spotify.com/v1/search", {
            params: {
                q: searchTerm,
                type: "track,album,artist",
                limit,
                offset: (page - 1) * limit,
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        // Map tracks
        const tracks = response.data.tracks.items.map((item) => ({
            spotifyId: item.id,
            title: item.name,
            slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            poster: item.album.images[0]?.url || "",
            plot:
                item.artists.map((a) => a.name).join(", ") +
                " - " +
                item.album.name,
            year: item.album.release_date
                ? parseInt(item.album.release_date.split("-")[0])
                : null,
            matchReason: "Spotify API",
        }));

        // Map albums
        const albums = response.data.albums.items.map((item) => ({
            spotifyId: item.id,
            title: item.name,
            slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            poster: item.images[0]?.url || "",
            plot: item.artists.map((a) => a.name).join(", "),
            year: item.release_date
                ? parseInt(item.release_date.split("-")[0])
                : null,
            matchReason: "Spotify API",
        }));

        // Map artists
        const artists = response.data.artists.items.map((item) => ({
            spotifyId: item.id,
            title: item.name,
            slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            poster: item.images[0]?.url || "",
            plot: item.genres.join(", ") || "Artist",
            year: null,
            matchReason: "Spotify API",
        }));

        const data = [...tracks, ...albums, ...artists];
        const total = response.data.tracks.total + response.data.albums.total + response.data.artists.total;

        return { data, total };
    } catch (error) {
        logger.logMessage("error", `Spotify API error: ${error.message}`);
        return { data: [], total: 0 };
    }
};

// Function to fetch Google Books data for books
const fetchGoogleBooksData = async (searchTerm, page, limit) => {
    try {
        const response = await axios.get(`${GOOGLE_BOOKS_BASE_URL}/volumes`, {
            params: {
                q: searchTerm,
                key: config.google.apiKey,
                maxResults: limit,
                startIndex: (page - 1) * limit,
            },
        });

        const data = (response.data.items || []).map((item) => ({
            googleBooksId: item.id,
            title: item.volumeInfo.title || "Untitled",
            slug: item.volumeInfo.title
                ? item.volumeInfo.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                : `book-${item.id}`,
            poster: item.volumeInfo.imageLinks?.thumbnail || "",
            plot: item.volumeInfo.authors
                ? item.volumeInfo.authors.join(", ")
                : "",
            year: item.volumeInfo.publishedDate
                ? parseInt(item.volumeInfo.publishedDate.split("-")[0])
                : null,
            matchReason: "Google Books API",
        }));

        return {
            data,
            total: response.data.totalItems || 0,
        };
    } catch (error) {
        logger.logMessage("error", `Google Books API error: ${error.message}`);
        return { data: [], total: 0 };
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
            name: "movie",
            fields: ["title", "genres", "plot", "keywords"],
            personFields: ["director", "writers", "cast.person"],
            select: "title slug poster director writers cast references.tmdbId references.imdbId year",
            uniqueField: ["references.tmdbId", "references.imdbId"],
        },
        {
            model: models.Series,
            name: "series",
            fields: ["title", "genres", "plot", "keywords"],
            personFields: ["creators", "cast.person"],
            select: "title slug poster creators cast references.tmdbId references.imdbId year",
            uniqueField: ["references.tmdbId", "references.imdbId"],
        },
        {
            model: models.Book,
            name: "book",
            fields: ["title", "genres", "description"],
            personFields: ["author"],
            select: "title slug coverImage author googleBooksId publishedYear",
            uniqueField: ["googleBooksId"],
            external: "googlebooks",
        },
        {
            model: models.Music,
            name: "music",
            fields: ["title", "genres"],
            personFields: ["artist", "featuredArtists"],
            select: "title slug artist featuredArtists album spotifyId releaseYear",
            uniqueField: ["spotifyId"],
            external: "spotify",
        },
        {
            model: models.Music,
            name: "songs",
            fields: ["title", "genres"],
            personFields: ["artist", "featuredArtists"],
            select: "title slug artist featuredArtists album spotifyId releaseYear",
            uniqueField: ["spotifyId"],
            external: "spotify",
        },
        {
            model: models.MusicAlbum,
            name: "album",
            fields: ["title", "genres"],
            personFields: [],
            select: "title slug coverImage",
            uniqueField: [],
        },
        {
            model: models.Video,
            name: "video",
            fields: ["title", "genres", "description", "keywords"],
            personFields: ["creator"],
            select: "title slug poster creator",
            uniqueField: [],
        },
        {
            model: models.Person,
            name: "people",
            fields: ["name", "biography", "professions"],
            personFields: [],
            select: "name slug profileImage",
            uniqueField: [],
        },
    ];
};

// Relevance scoring function
const calculateRelevanceScore = (item, searchTerm, fields) => {
    let score = 0;
    const searchLower = searchTerm.toLowerCase();

    // Prioritize title matches
    const title = String(item.title || "").toLowerCase();
    if (title === searchLower) {
        score += 100; // Exact match
    } else if (title.startsWith(searchLower)) {
        score += 50; // Starts with search term
    } else if (title.includes(searchLower)) {
        score += 25; // Contains search term
    }

    // Check other fields
    fields.forEach((field) => {
        let value = item[field] || "";
        if (Array.isArray(value)) {
            value = value.join(",");
        }
        value = String(value).toLowerCase();
        if (value.includes(searchLower)) {
            score += 5; // Lower score for matches in other fields
        }
    });

    // Boost for person field matches
    if (item.matchReason.includes("Person fields")) {
        score += 10;
    }

    return score;
};

const globalSearch = async ({
    searchType,
    searchTerm,
    contentTypes = [],
    page = 1,
    limit = 10,
    sortBy = "relevance",
}) => {
    // Validate search term
    if (
        !searchTerm ||
        typeof searchTerm !== "string" ||
        searchTerm.trim().length < 1
    ) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Search term must be a string with at least 1 character"
        );
    }

    // Sanitize search term and create regex
    const sanitizedTerm = searchTerm
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(sanitizedTerm, "i");

    // Generate cache key
    const cacheKey = `globalSearch:${searchType}:${searchTerm}:${contentTypes.join(",")}:${page}:${limit}:${sortBy}`;
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult) {
        logger.logMessage("info", `Cache hit for search: ${cacheKey}`);
        return cachedResult;
    }

    // Invalidate cache for broader search terms
    if (searchTerm.length > 2) {
        const broaderTerm = searchTerm.slice(0, 2); // e.g., "dashav" -> "da"
        const broaderCacheKeyPrefix = `globalSearch:${searchType}:${broaderTerm}:`;
        for (const key of searchCache.keys()) {
            if (key.startsWith(broaderCacheKeyPrefix)) {
                searchCache.delete(key);
                logger.logMessage("info", `Invalidated cache for broader term: ${key}`);
            }
        }
    }

    // Get searchable models
    const searchableModels = getSearchableModels();

    // Filter models based on contentTypes if provided
    let modelsToSearch = contentTypes.length
        ? searchableModels.filter((m) => contentTypes.includes(m.name))
        : searchableModels;
    if (contentTypes.includes("all")) {
        modelsToSearch = searchableModels;
    }

    // Step 1: Find matching Person IDs for artist search
    const matchingPersons = await models.Person.find({ name: regex, isActive: true })
        .select("_id")
        .limit(100)
        .lean();
    const personIds = matchingPersons.map((p) => p._id);

    // Prepare search queries
    const searchQueries = modelsToSearch.map(async (modelConfig) => {
        const { model, name, fields, personFields, select, external, uniqueField } = modelConfig;
        let allResults = [];
        let total = 0;

        // Local DB queries
        if (model) {
            // Query 1: Search on text fields
            if (fields.length) {
                const textQuery = {
                    $or: fields.map((field) => ({ [field]: regex })),
                    isActive: true,
                };
                // Get total count
                const textTotal = await model.countDocuments(textQuery);
                // Fetch results for the current page
                const textResults = await model.find(textQuery)
                    .select(select)
                    .populate(personFields.map((field) => field.split(".")[0]))
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean();
                let transformedResults = textResults.map((doc) => ({
                    ...doc,
                    matchReason: "Text fields",
                }));

                // Transform music and songs results from DB
                if (name === "music" || name === "songs") {
                    transformedResults = await Promise.all(
                        transformedResults.map(async (result) => {
                            let album = null;
                            if (result.album) {
                                album = await models.MusicAlbum.findById(result.album).select("coverImage").lean();
                            }
                            const artistNames = result.artist?.name ? [result.artist.name] : [];
                            const featuredArtistNames = Array.isArray(result.featuredArtists)
                                ? result.featuredArtists.map((fa) => fa.name).filter(Boolean)
                                : [];
                            const artists = [...artistNames, ...featuredArtistNames].join(", ");
                            const coverImage = album?.coverImage?.url || "";
                            return {
                                ...result,
                                artists,
                                coverImage,
                                artist: undefined,
                                featuredArtists: undefined,
                                album: undefined,
                            };
                        })
                    );
                }

                allResults.push(...transformedResults);
                total += textTotal;
            }

            // Query 2: Search on person-related fields
            if (personFields.length && personIds.length) {
                const personQuery = {
                    $or: personFields.map((field) =>
                        field.includes(".")
                            ? { [field]: { $in: personIds } }
                            : { [field]: { $in: personIds } }
                    ),
                    isActive: true,
                };
                // Get total count
                const personTotal = await model.countDocuments(personQuery);
                // Fetch results for the current page
                const personResults = await model.find(personQuery)
                    .select(select)
                    .populate(personFields.map((field) => field.split(".")[0]))
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean();
                let transformedPersonResults = personResults.map((doc) => ({
                    ...doc,
                    matchReason: `Person fields (${personFields.join(", ")})`,
                }));

                // Transform music and songs results from DB
                if (name === "music" || name === "songs") {
                    transformedPersonResults = await Promise.all(
                        transformedPersonResults.map(async (result) => {
                            let album = null;
                            if (result.album) {
                                album = await models.MusicAlbum.findById(result.album).select("coverImage").lean();
                            }
                            const artistNames = result.artist?.name ? [result.artist.name] : [];
                            const featuredArtistNames = Array.isArray(result.featuredArtists)
                                ? result.featuredArtists.map((fa) => fa.name).filter(Boolean)
                                : [];
                            const artists = [...artistNames, ...featuredArtistNames].join(", ");
                            const coverImage = album?.coverImage?.url || "";
                            return {
                                ...result,
                                artists,
                                coverImage,
                                artist: undefined,
                                featuredArtists: undefined,
                                album: undefined,
                            };
                        })
                    );
                }

                allResults.push(...transformedPersonResults);
                total += personTotal;
            }
        }

        // Collect unique identifiers from DB results
        const uniqueIds = {};
        uniqueField.forEach((field) => {
            uniqueIds[field] = new Set(
                allResults
                    .filter((item) => item[field.split(".")[1]])
                    .map((item) => item[field.split(".")[0]][field.split(".")[1]])
            );
        });

        // External API queries
        let externalResults = [];
        let externalTotal = 0;
        if (external === "spotify" && (name === "music" || name === "songs")) {
            const spotifyData = await fetchSpotifyData(searchTerm, page, limit);
            externalResults = spotifyData.data;
            externalTotal = spotifyData.total;
        } else if (external === "googlebooks" && name === "book") {
            const googleBooksData = await fetchGoogleBooksData(searchTerm, page, limit);
            externalResults = googleBooksData.data;
            externalTotal = googleBooksData.total;
        } else if (name === "movie" || name === "series") {
            const tmdbData = await fetchTMDBData(searchTerm, name, page, limit);
            externalResults = tmdbData.data;
            externalTotal = tmdbData.total;
        }

        // Filter out external results that already exist in DB
        const filteredExternalResults = externalResults.filter((result) => {
            if (uniqueField.includes("references.tmdbId") && result.tmdbId) {
                return !uniqueIds["references.tmdbId"].has(result.tmdbId);
            }
            if (uniqueField.includes("references.imdbId") && result.imdbId) {
                return !uniqueIds["references.imdbId"].has(result.imdbId);
            }
            if (uniqueField.includes("spotifyId") && result.spotifyId) {
                return !uniqueIds["spotifyId"].has(result.spotifyId);
            }
            if (uniqueField.includes("googleBooksId") && result.googleBooksId) {
                return !uniqueIds["googleBooksId"].has(result.googleBooksId);
            }
            return true;
        });

        allResults.push(...filteredExternalResults);
        total += externalTotal;

        // Deduplicate results by _id, tmdbId, spotifyId, or googleBooksId
        const uniqueResults = Array.from(
            new Map(
                allResults.map((item) => [
                    item._id
                        ? item._id.toString()
                        : item.tmdbId ||
                          item.spotifyId ||
                          item.googleBooksId ||
                          item.imdbId,
                    item,
                ])
            ).values()
        );

        // Sort by relevance
        if (sortBy === "relevance" && uniqueResults.length) {
            uniqueResults.sort((a, b) => {
                const aScore = calculateRelevanceScore(a, sanitizedTerm, fields);
                const bScore = calculateRelevanceScore(b, sanitizedTerm, fields);
                return bScore - aScore;
            });
        }

        // Transform coverImage for album results
        if (name === "album") {
            return {
                name,
                results: uniqueResults.map((result) => ({
                    ...result,
                    coverImage: result.coverImage?.url || "",
                })),
                total,
            };
        }

        return { name, results: uniqueResults, total };
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

    const result = {
        data: { results: formattedResults },
        pagination: {
            page,
            limit,
            totalResults,
            totalPages,
        },
    };

    // Cache the result
    searchCache.set(cacheKey, result);
    setTimeout(() => searchCache.delete(cacheKey), CACHE_TTL);

    return result;
};

const searchPeople = async ({ searchTerm, page = 1, limit = 10 }) => {
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

    // Generate cache key
    const cacheKey = `searchPeople:${searchTerm}:${page}:${limit}`;
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult) {
        logger.logMessage("info", `Cache hit for search: ${cacheKey}`);
        return cachedResult;
    }

    // Invalidate cache for broader search terms
    if (searchTerm.length > 2) {
        const broaderTerm = searchTerm.slice(0, 2);
        const broaderCacheKeyPrefix = `searchPeople:${broaderTerm}:`;
        for (const key of searchCache.keys()) {
            if (key.startsWith(broaderCacheKeyPrefix)) {
                searchCache.delete(key);
                logger.logMessage("info", `Invalidated cache for broader term: ${key}`);
            }
        }
    }

    // Build query conditions with $regex and $options
    const queryConditions = [
        { userName: { $regex: sanitizedTerm, $options: "i" } },
        { email: { $regex: sanitizedTerm, $options: "i" } },
        { "fullName.firstName": { $regex: sanitizedTerm, $options: "i" } },
        { "fullName.lastName": { $regex: sanitizedTerm, $options: "i" } },
    ];

    queryConditions.push({
        $expr: {
            $regexMatch: {
                input: { $concat: ["$fullName.firstName", " ", "$fullName.lastName"] },
                regex: sanitizedTerm,
                options: "i",
            },
        },
    });

    // Build query
    const query = {
        $or: queryConditions,
        status: "ACTIVE",
        deleted: false,
    };

    const total = await models.User.countDocuments(query);
    const results = await models.User.find(query)
        .populate("profile")
        .select("fullName userName email profile _id")
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    // Add the virtual field `fullNameString` manually since virtuals are not included in `.lean()`
    results.forEach((user) => {
        if (user.fullName && typeof user.fullName === "object") {
            user.fullNameString =
                `${user.fullName.firstName || ""} ${user.fullName.lastName || ""}`.trim();
        }
    });

    const formattedResult = {
        results,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };

    // Cache the result
    searchCache.set(cacheKey, formattedResult);
    setTimeout(() => searchCache.delete(cacheKey), CACHE_TTL);

    return formattedResult;
};

const searchService = {
    globalSearch,
    searchPeople,
};

export default searchService;