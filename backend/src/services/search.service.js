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
        : "",
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
    console.error("Spotify token error:", error.message);
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
      plot: item.artists.map((a) => a.name).join(", ") + " - " + item.album.name,
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
      year: item.release_date ? parseInt(item.release_date.split("-")[0]) : null,
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

    return [...tracks, ...albums, ...artists];
  } catch (error) {
    console.error("Spotify API error:", error.message);
    return [];
  }
};

// Function to fetch Open Library data for books
const fetchOpenLibraryData = async (searchTerm, page, limit) => {
  try {
    const response = await axios.get(`${config.openLibrary.baseUrl}/search.json`, {
      params: {
        q: searchTerm,
        page,
        limit,
      },
    });

    return response.data.docs.map((item) => ({
      openLibraryId: item.key.split("/")[2],
      title: item.title,
      slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      poster: item.cover_i
        ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
        : "",
      plot: item.author_name ? item.author_name.join(", ") : "",
      year: item.first_publish_year || null,
      matchReason: "Open Library API",
    }));
  } catch (error) {
    console.error("Open Library API error:", error.message);
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
      model: null, // No local model for books
      name: "books",
      fields: [],
      personFields: [],
      select: "",
      external: "openlibrary",
    },
    {
      model: null, // No local model for music
      name: "music",
      fields: [],
      personFields: [],
      select: "",
      external: "spotify",
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
      "Search term must be a string with at least 1 character"
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
    const { model, name, fields, personFields, select, external } = modelConfig;
    const results = [];
    let total = 0;

    // Local DB queries
    if (model) {
      // Query 1: Search on text fields
      if (fields.length) {
        const textQuery = {
          $or: fields.map((field) => ({ [field]: regex })),
          isActive: true,
        };
        const textTotal = await model.countDocuments(textQuery);
        const textResults = await model
          .find(textQuery)
          .select(`${select} references.tmdbId`)
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
        const personTotal = await model.countDocuments(personQuery);
        const personResults = await model
          .find(personQuery)
          .select(`${select} references.tmdbId`)
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
    }

    // External API queries
    if (external === "spotify" && name === "music") {
      const spotifyResults = await fetchSpotifyData(searchTerm, page, limit);
      total += spotifyResults.length;
      results.push(...spotifyResults);
    } else if (external === "openlibrary" && name === "books") {
      const openLibraryResults = await fetchOpenLibraryData(searchTerm, page, limit);
      total += openLibraryResults.length;
      results.push(...openLibraryResults);
    } else if (name === "movies" || name === "series") {
      const tmdbResults = await fetchTMDBData(searchTerm, name, page, limit);
      const existingTmdbIds = await model
        .find({
          "references.tmdbId": {
            $in: tmdbResults.map((r) => r.tmdbId),
          },
        })
        .select("references.tmdbId")
        .lean()
        .then((docs) => docs.map((doc) => doc.references.tmdbId));
      const filteredTmdbResults = tmdbResults.filter(
        (result) => !existingTmdbIds.includes(result.tmdbId)
      );
      total += filteredTmdbResults.length;
      results.push(...filteredTmdbResults);
    }

    // Deduplicate results by _id, tmdbId, spotifyId, or openLibraryId
    const uniqueResults = Array.from(
      new Map(
        results.map((item) => [
          item._id
            ? item._id.toString()
            : item.tmdbId || item.spotifyId || item.openLibraryId,
          item,
        ])
      ).values()
    );

    // Sort by relevance
    if (sortBy === "relevance" && uniqueResults.length) {
      uniqueResults.sort((a, b) => {
        let aScore = fields.reduce((score, field) => {
          const value = a[field] || "";
          return (
            score +
            (value.toLowerCase().includes(sanitizedTerm.toLowerCase()) ? 1 : 0)
          );
        }, 0);
        let bScore = fields.reduce((score, field) => {
          const value = b[field] || "";
          return (
            score +
            (value.toLowerCase().includes(sanitizedTerm.toLowerCase()) ? 1 : 0)
          );
        }, 0);
        if (a.matchReason.includes("Person fields")) aScore += 2;
        if (b.matchReason.includes("Person fields")) bScore += 2;
        if (a.matchReason === "TMDB API") aScore -= 1;
        if (b.matchReason === "Spotify API") aScore -= 1;
        if (b.matchReason === "Open Library API") aScore -= 1;
        return bScore - aScore;
      });
    }

    // Apply pagination
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