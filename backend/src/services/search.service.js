import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import models from "../models/index.js";

// Configuration for searchable models and their fields
const searchableModels = [
    {
        model: models.Movie,
        name: "movies",
        fields: ["title", "genres", "plot", "keywords"],
        personFields: ["director", "writers", "cast.person"],
        select: "title slug poster director writers cast",
    },
    {
        model: models.Series,
        name: "series",
        fields: ["title", "genres", "plot", "keywords"],
        personFields: ["creators", "cast.person"],
        select: "title slug poster creators cast",
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
        personFields: [], // Direct search on name
        select: "name slug profileImage",
    },
    {
        model: models.LivePerformance,
        name: "performances",
        fields: ["event", "location"],
        personFields: [], // Music reference, not direct person
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

const globalSearch = async ({
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "relevance",
    contentTypes = [],
}) => {
    // Validate search term
    if (!searchTerm || typeof searchTerm !== "string" || searchTerm.trim().length < 2) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Search term must be a string with at least 2 characters");
    }

    // Sanitize search term and create regex
    const sanitizedTerm = searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(sanitizedTerm, "i");

    // Filter models based on contentTypes if provided
    const modelsToSearch = contentTypes.length
        ? searchableModels.filter((m) => contentTypes.includes(m.name))
        : searchableModels;

    // Step 1: Find matching Person IDs for artist search
    const matchingPersons = await models.Person
        .find({ name: regex, isActive: true })
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
                        ? { [field]: { $in: personIds } } // For nested fields like cast.person
                        : { [field]: { $in: personIds } }
                ),
                isActive: true,
            };
            const personTotal = await model.countDocuments(personQuery);
            const personResults = await model
                .find(personQuery)
                .select(select)
                .populate(personFields.map((field) => field.split(".")[0])) // Populate top-level fields
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

        // Deduplicate results by _id
        const uniqueResults = Array.from(
            new Map(results.map((item) => [item._id.toString(), item])).values()
        );

        // Sort by relevance if specified
        if (sortBy === "relevance" && uniqueResults.length) {
            uniqueResults.sort((a, b) => {
                let aScore = fields.reduce((score, field) => {
                    const value = a[field] || "";
                    return score + (value.toLowerCase().includes(sanitizedTerm.toLowerCase()) ? 1 : 0);
                }, 0);
                let bScore = fields.reduce((score, field) => {
                    const value = b[field] || "";
                    return score + (value.toLowerCase().includes(sanitizedTerm.toLowerCase()) ? 1 : 0);
                }, 0);
                // Boost score for person matches
                if (a.matchReason.includes("Person fields")) aScore += 2;
                if (b.matchReason.includes("Person fields")) bScore += 2;
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
    const formattedResults = searchResults.reduce((acc, { name, results, total }) => {
        acc[name] = { data: results, total };
        return acc;
    }, {});

    // Calculate pagination metadata
    const totalResults = searchResults.reduce((sum, { total }) => sum + total, 0);
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

const searchUser = async ({ searchTerm, page = 1, limit = 10 }) => {
    
    if (!searchTerm || typeof searchTerm !== "string" || searchTerm.trim().length < 2) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Search term must be a string with at least 2 characters");
    }

    const regex = new RegExp(searchTerm.trim(), "i");

    const query = {
        $or: [
            { userName: regex },
            { email: regex },
            { "fullName.firstName": regex },
            { "fullName.lastName": regex },
        ],
        status: "Active",
        isActive: true,
    };

    const total = await models.User.countDocuments(query);
    const users = await models.User
        .find(query)
        .populate("profile")
        .select("-password -sessions")
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

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