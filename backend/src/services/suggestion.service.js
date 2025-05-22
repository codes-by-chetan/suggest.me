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
import notificationService from "./notification.service.js";

const getContent = {
    movie: movieService.getMovieDetails,
    book: bookService.getBookDetails,
    series: seriesService.getSeriesDetails,
    music: musicService.getMusicDetails,
    songs: musicService.getMusicDetails,
    video: null,
    anime: null,
};

const getSuggestionDetails = async (suggestionId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(suggestionId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, suggestion ID galat hai!"
        );
    }

    const suggestion = await models.UserSuggestions.findOne({
        _id: suggestionId,
        $or: [{ sender: userId }, { recipients: userId }],
    });

    if (!suggestion) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "Abe, yeh suggestion nahi mili!"
        );
    }

    const populateOptions = [
        {
            path: "content",
            ...(suggestion.contentType === "Music"
                ? {
                      populate: [
                          { path: "album" },
                          { path: "artist" },
                          { path: "featuredArtists" },
                      ],
                  }
                : suggestion.contentType === "Book"
                  ? {
                        populate: [{ path: "author" }],
                    }
                  : suggestion.contentType === "Series"
                    ? {
                          populate: [
                              { path: "production", populate: "companies" },
                          ],
                      }
                    : suggestion.contentType === "Movie"
                      ? {
                            populate: [{ path: "director" }, { path: "writers" }],
                        }
                      : {}),
        },
        {
            path: "sender recipients",
            select: "_id fullName fullNameString profile",
        },
        {
            path: "sender.profile recipients.profile",
            select: "avatar isVerified displayName bio",
        },
    ];

    await suggestion.populate(populateOptions);

    return suggestion;
};

const createSuggestion = async (user, content, note, recipients) => {
    if (!content?.type || !content?.id) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, content type ya ID toh daal!"
        );
    }

    if (!getContent[content.type]) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Yeh ${content.type} type ka content nahi support karta!`
        );
    }

    let contentDetails;
    try {
        const contentId = content.id.toString();
        console.log(
            `Calling getContent with contentId: ${contentId}, userId: ${user._id}`
        );
        contentDetails = await getContent[content.type]({
            id: contentId,
            userId: user._id,
        });
        if (!contentDetails) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                `Content nahi mila for ID: ${content.id}`
            );
        }
    } catch (error) {
        console.error(
            `Error fetching content details for type ${content.type} with ID ${content.id}:`,
            error
        );
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Content details fetch karne mein gadbad ho gayi: ${error.message}`
        );
    }

    const recipientsIds = recipients.map((r) => r._id);
    const validRecipients = recipients?.length
        ? await models.User.find({
              _id: { $in: recipientsIds },
          }).select("_id")
        : [];
    console.log("valid recipients : ", validRecipients);
    if (recipients?.length && validRecipients.length !== recipients.length) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Kuch recipients galat hain!"
        );
    }

    const contentType =
        content.type === "movie"
            ? "Movie"
            : content.type === "series"
              ? "Series"
              : content.type === "book"
                ? "Book"
                : content.type === "music" || content.type === "songs"
                  ? "Music"
                  : "Video";

    const suggestion = await models.UserSuggestions.create({
        sender: user._id,
        contentType,
        content: contentDetails._id,
        note: note || "",
        recipients: validRecipients.map((r) => r._id),
        createdBy: user._id,
    });

    const populateOptions = [
        {
            path: "content",
            ...(suggestion.contentType === "Music"
                ? {
                      populate: [
                          { path: "album" },
                          { path: "artist" },
                          { path: "featuredArtists" },
                      ],
                  }
                : suggestion.contentType === "Book"
                  ? {
                        populate: [{ path: "author" }],
                    }
                  : suggestion.contentType === "Series"
                    ? {
                          populate: [
                              { path: "production", populate: "companies" },
                          ],
                      }
                    : suggestion.contentType === "Movie"
                      ? {
                            populate: [{ path: "director" }, { path: "writers" }],
                        }
                      : {}),
        },
        {
            path: "sender recipients",
            select: "_id fullName fullNameString profile",
        },
        {
            path: "sender.profile recipients.profile",
            select: "avatar isVerified displayName bio",
        },
    ];

    await suggestion.populate(populateOptions);

    await notificationService.sendSuggestionNotification(suggestion);
    return suggestion;
};

const mapSuggestionToContentItem = async (suggestion) => {
    if (suggestion.contentType === "Music") {
        await suggestion.populate({
            path: "content",
            populate: [
                { path: "album" },
                { path: "artist" },
                { path: "featuredArtists" },
            ],
        });
    } else if (suggestion.contentType === "Book") {
        await suggestion.populate({
            path: "content",
            populate: [{ path: "author" }],
        });
    } else if (suggestion.contentType === "Series") {
        await suggestion.populate({
            path: "content",
            populate: [{ path: "production", populate: "companies" }],
        });
    } else if (suggestion.contentType === "Movie") {
        await suggestion.populate({
            path: "content",
            populate: [{ path: "director" }, { path: "writers" }],
        });
    }

    await suggestion.populate({
        path: "sender.profile recipients.profile",
        select: "avatar isVerified displayName bio",
    });

    return {
        id: suggestion._id.toString(),
        contentId: suggestion.content?._id.toString(),
        title: suggestion.content?.title || "Unknown Title",
        type: suggestion.contentType.toLowerCase(),
        imageUrl:
            suggestion.contentType.toLowerCase() === "music"
                ? suggestion.content?.album?.coverImage?.url
                : suggestion.content?.poster?.url ||
                  suggestion.content?.coverImage?.url ||
                  suggestion.content?.album?.coverImage?.url,
        year:
            suggestion.content?.year?.toString() ||
            suggestion.content?.publishedYear?.toString() ||
            suggestion.content?.releaseYear?.toString(),
        creator:
            suggestion.content?.director?.map((d) => d.name).join(", ") ||
            suggestion.content?.creator?.map((c) => c.name).join(", ") ||
            suggestion.content?.author?.map((a) => a.name).join(", ") ||
            suggestion.content?.production?.companies?.map((a) => a.name).join(", ") ||
            (suggestion.contentType.toLowerCase() === "music"
                ? [
                      suggestion.content?.artist?.name,
                      ...(suggestion.content?.featuredArtists?.map((a) => a.name) || []),
                  ]
                      .filter(Boolean)
                      .join(", ")
                : "") ||
            "",
        description:
            suggestion.content?.plot ||
            suggestion.content?.description ||
            suggestion.content?.overview,
        suggestedTo: suggestion.recipients.map((recipient) => ({
            id: recipient._id.toString(),
            name: recipient.fullNameString || "Unknown",
            avatar: recipient.profile?.avatar?.url,
        })),
        suggestedAt: suggestion.createdAt.toISOString(),
        status: null, // Status not implemented in schema, defaulting to null
        suggestion: suggestion,
    };
};

const mapSuggestionForUserToContentItem = async (suggestion) => {
    if (suggestion.contentType === "Music") {
        await suggestion.populate({
            path: "content",
            populate: [
                { path: "album" },
                { path: "artist" },
                { path: "featuredArtists" },
            ],
        });
    } else if (suggestion.contentType === "Book") {
        await suggestion.populate({
            path: "content",
            populate: [{ path: "author" }],
        });
    } else if (suggestion.contentType === "Series") {
        await suggestion.populate({
            path: "content",
            populate: [{ path: "production", populate: "companies" }],
        });
    } else if (suggestion.contentType === "Movie") {
        await suggestion.populate({
            path: "content",
            populate: [{ path: "director" }, { path: "writers" }],
        });
    }

    await suggestion.populate({
        path: "sender.profile recipients.profile",
        select: "avatar isVerified displayName bio",
    });

    return {
        id: suggestion._id.toString(),
        contentId: suggestion.content?._id.toString(),
        title: suggestion.content?.title || "Unknown Title",
        type: suggestion.contentType.toLowerCase(),
        imageUrl:
            suggestion.contentType.toLowerCase() === "music"
                ? suggestion.content?.album?.coverImage?.url
                : suggestion.content?.poster?.url ||
                  suggestion.content?.coverImage?.url ||
                  suggestion.content?.album?.coverImage?.url,
        year:
            suggestion.content?.year?.toString() ||
            suggestion.content?.publishedYear?.toString() ||
            suggestion.content?.releaseYear?.toString(),
        creator:
            suggestion.content?.director?.map((d) => d.name).join(", ") ||
            suggestion.content?.creator?.map((c) => c.name).join(", ") ||
            suggestion.content?.author?.map((a) => a.name).join(", ") ||
            suggestion.content?.production?.companies?.map((a) => a.name).join(", ") ||
            (suggestion.contentType.toLowerCase() === "music"
                ? [
                      suggestion.content?.artist?.name,
                      ...(suggestion.content?.featuredArtists?.map((a) => a.name) || []),
                  ]
                      .filter(Boolean)
                      .join(", ")
                : "") ||
            "",
        description:
            suggestion.content?.plot ||
            suggestion.content?.description ||
            suggestion.content?.overview,
        suggestedBy: {
            id: suggestion.sender._id.toString(),
            name: suggestion.sender.fullNameString || "Unknown",
            avatar: suggestion.sender.profile?.avatar?.url,
        },
        suggestedAt: suggestion.createdAt.toISOString(),
        status: null, // Status not implemented in schema, defaulting to null
        suggestion: suggestion,
    };
};

const getSuggestionsByUser = async (
    userId,
    { page = 1, limit = 12, type } = {}
) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Bhai, user ID galat hai!");
    }

    if (page < 1 || limit < 1) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, page ya limit galat hai!"
        );
    }

    const typeMap = {
        movie: "Movie",
        series: "Series",
        book: "Book",
        music: "Music",
        video: "Video",
    };
    const contentType = type ? typeMap[type.toLowerCase()] : undefined;
    if (type && !contentType) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Bhai, yeh type ${type} galat hai! Valid options: movie, series, book, music, video`
        );
    }

    const filter = { sender: userId, deleted: false };
    if (contentType) {
        filter.contentType = contentType;
    }

    const options = {
        page,
        limit,
        populate: [
            "content",
            {
                path: "sender recipients",
                select: "_id fullName fullNameString profile",
            },
        ],
        sortBy: "createdAt:desc",
    };

    const {
        results,
        totalResults,
        totalPages,
        page: currentPage,
        limit: currentLimit,
    } = await models.UserSuggestions.paginate(filter, options);

    const data = await Promise.all(results.map(mapSuggestionToContentItem));

    return {
        success: true,
        data,
        total: totalResults ?? 0,
        page: currentPage ?? page,
        limit: currentLimit ?? limit,
    };
};

const getSuggestionsForUser = async (
    userId,
    { page = 1, limit = 12, type } = {}
) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Bhai, user ID galat hai!");
    }

    if (page < 1 || limit < 1) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, page ya limit galat hai!"
        );
    }

    const typeMap = {
        movie: "Movie",
        series: "Series",
        book: "Book",
        music: "Music",
        video: "Video",
    };
    const contentType = type ? typeMap[type.toLowerCase()] : undefined;
    if (type && !contentType) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Bhai, yeh type ${type} galat hai! Valid options: movie, series, book, music, video`
        );
    }

    const filter = { recipients: userId, deleted: false };
    if (contentType) {
        filter.contentType = contentType;
    }

    const options = {
        page,
        limit,
        populate: [
            "content",
            {
                path: "sender recipients",
                select: "_id fullName fullNameString profile",
            },
        ],
        sortBy: "createdAt:desc",
    };

    const {
        results,
        totalResults,
        totalPages,
        page: currentPage,
        limit: currentLimit,
    } = await models.UserSuggestions.paginate(filter, options);

    const data = await Promise.all(
        results.map(mapSuggestionForUserToContentItem)
    );

    return {
        success: true,
        data,
        total: totalResults ?? 0,
        page: currentPage ?? page,
        limit: currentLimit ?? limit,
    };
};

const suggestionService = {
    getSuggestionDetails,
    createSuggestion,
    getSuggestionsByUser,
    getSuggestionsForUser,
};

export default suggestionService;