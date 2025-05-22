import mongoose from "mongoose";
import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import movieService from "./movie.service.js";
import seriesService from "./series.service.js";
import bookService from "./book.service.js";
import musicService from "./music.service.js";
import { populate } from "dotenv";

const getContent = {
    Movie: movieService.getMovieDetails,
    Series: seriesService.getSeriesDetails,
    Book: bookService.getBookDetails,
    Music: musicService.getMusicDetails,
};

const mapContentItem = (userContent) => ({
    id: userContent._id.toString(),
    userContentId: userContent._id.toString(),
    contentId: userContent.content?._id.toString(),
    title: userContent.content?.title || "Unknown Title",
    type: userContent.contentType.toLowerCase(),
    imageUrl:
        userContent.contentType.toLowerCase() === "music"
            ? userContent.content?.album?.coverImage?.url
            : userContent.content?.poster?.url ||
              userContent.content?.coverImage?.url ||
              userContent.content?.album?.coverImage?.url,
    year:
        userContent.content?.year?.toString() ||
        userContent.content?.publishedYear?.toString() ||
        userContent.content?.releaseYear?.toString(),
    creator:
        userContent.content?.director?.map((d) => d.name).join(", ") ||
        userContent.content?.creator?.map((c) => c.name).join(", ") ||
        userContent.content?.author?.map((a) => a.name).join(", ") ||
        userContent.content?.production?.companies
                ?.map((a) => a.name)
                .join(", ") ||
        (userContent.contentType.toLowerCase() === "music"
            ? [
                  userContent.content?.artist?.name,
                  ...(userContent.content?.featuredArtists?.map(
                      (a) => a.name
                  ) || []),
              ]
                  .filter(Boolean)
                  .join(", ")
            : "") ||
        "",
    description: userContent.content?.plot || userContent.content?.description,
    status: userContent.status,
    addedAt: userContent.addedAt.toISOString(),
    suggestionId: userContent.suggestion?._id.toString() || null,
    suggestedBy:
        userContent.createdBy && userContent.createdBy.profile
            ? {
                  id: userContent.createdBy._id.toString(),
                  name: userContent.createdBy.fullNameString || "Unknown",
                  avatar: userContent.createdBy.profile.avatar?.url,
              }
            : { id: "unknown", name: "Unknown" },
});

const addContent = async (
    user,
    content,
    status = "WantToConsume",
    suggestionId
) => {
    if (!content?.id || !content?.type) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, content ID ya type toh daal!"
        );
    }

    if (!getContent[content?.type]) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Yeh ${content.type} type ka content nahi support karta!`
        );
    }

    let contentDetails;
    try {
        contentDetails = await getContent[content.type]({
            id: content.id,
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

    if (suggestionId && !mongoose.Types.ObjectId.isValid(suggestionId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, suggestion ID galat hai!"
        );
    }

    if (suggestionId) {
        const suggestion = await models.UserSuggestions.findOne({
            _id: suggestionId,
            recipients: user._id,
        });
        if (!suggestion) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Yeh suggestion nahi mili ya tu iska recipient nahi hai!"
            );
        }
    }

    const existingContent = await models.UserContent.findOne({
        user: user._id,
        content: contentDetails._id,
    });
    if (existingContent) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Abe, yeh content toh pehle se teri list mein hai!"
        );
    }

    const userContent = await models.UserContent.create({
        user: user._id,
        content: contentDetails._id,
        contentType: content.type,
        status,
        suggestion: suggestionId || null,
        createdBy: user._id,
    });

    if (suggestionId) {
        await models.UserSuggestions.linkToUserContent(
            suggestionId,
            userContent._id,
            user._id
        );
    }

    const populateOptions = [
        {
            path: "content",
            ...(userContent.contentType === "Music"
                ? {
                      populate: [
                          { path: "album" },
                          { path: "artist" },
                          { path: "featuredArtists" },
                      ],
                  }
                : userContent.contentType === "Book"
                  ? {
                        populate: [{ path: "author" }],
                    }
                  : userContent.contentType === "Series"
                    ? {
                          populate: [
                              { path: "production", populate: "companies" },
                          ],
                      }
                    : {
                          populate: [{ path: "director" }, { path: "writers" }],
                      }),
        },
        {
            path: "user createdBy updatedBy",
            select: "_id fullName fullNameString profile",
        },
        {
            path: "user.profile createdBy.profile updatedBy.profile",
            select: "avatar isVerified displayName bio",
        },
        "suggestion",
    ];

    await userContent.populate(populateOptions);

    return mapContentItem(userContent);
};

const updateContentStatus = async (userId, contentId, status) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Bhai, user ID galat hai!");
    }
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, content ID galat hai!"
        );
    }

    const validStatuses = [
        "WantToConsume",
        "Consuming",
        "Consumed",
        "NotInterested",
    ];
    if (!validStatuses.includes(status)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, status toh sahi daal! Options hain: WantToConsume, Consuming, Consumed, NotInterested"
        );
    }

    const userContent = await models.UserContent.findOneAndUpdate(
        { user: userId, _id: contentId },
        { status, lastUpdatedAt: Date.now(), updatedBy: userId },
        { new: true }
    );

    if (!userContent) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "Yeh content teri list mein nahi mila!"
        );
    }

    const populateOptions = [
        {
            path: "content",
            ...(userContent.contentType === "Music"
                ? {
                      populate: [
                          { path: "album" },
                          { path: "artist" },
                          { path: "featuredArtists" },
                      ],
                  }
                : userContent.contentType === "Book"
                  ? {
                        populate: [{ path: "author" }],
                    }
                  : userContent.contentType === "Series"
                    ? {
                          populate: [
                              { path: "production", populate: "companies" },
                          ],
                      }
                    : {
                          populate: [{ path: "director" }, { path: "writers" }],
                      }),
        },
        {
            path: "user createdBy updatedBy",
            select: "_id fullName fullNameString profile",
        },
        {
            path: "user.profile createdBy.profile updatedBy.profile",
            select: "avatar isVerified displayName bio",
        },
        "suggestion",
    ];

    await userContent.populate(populateOptions);

    return mapContentItem(userContent);
};

const getUserContent = async (userId, { page = 1, limit = 12, type } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Bhai, user ID galat hai!");
    }

    // Validate page and limit
    if (page < 1 || limit < 1) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, page ya limit galat hai!"
        );
    }

    // Map frontend type (lowercase) to backend contentType (capitalized)
    const typeMap = {
        movie: "Movie",
        series: "Series",
        book: "Book",
        music: "Music",
    };
    const contentType = type ? typeMap[type.toLowerCase()] : undefined;
    if (type && !contentType) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Bhai, yeh type ${type} galat hai! Valid options: movie, series, book, music`
        );
    }

    const filter = { user: userId };
    if (contentType) {
        filter.contentType = contentType;
    }

    const options = {
        page,
        limit,
        populate: [
            "content",
            {
                path: "user createdBy updatedBy",
                select: "_id fullName fullNameString profile",
            },
            {
                path: "user.profile createdBy.profile updatedBy.profile",
                select: "avatar isVerified displayName bio",
            },
            "suggestion",
        ],
        sortBy: "addedAt:desc", // Sort by addedAt descending
    };

    const {
        results,
        totalResults,
        totalPages,
        page: currentPage,
        limit: currentLimit,
    } = await models.UserContent.paginate(filter, options);

    // Conditionally populate music-specific fields
    for (const userContent of results) {
        if (userContent.contentType === "Music") {
            await userContent.populate({
                path: "content",
                populate: [
                    { path: "album" },
                    { path: "artist" },
                    { path: "featuredArtists" },
                ],
            });
        } else if (userContent.contentType === "Book") {
            await userContent.populate({
                path: "content",
                populate: [{ path: "author" }],
            });
        } else if (userContent.contentType === "Series") {
            await userContent.populate({
                path: "content",
                populate: [{ path: "production", populate: "companies" }],
            });
        } else {
            await userContent.populate({
                path: "content",
                populate: [{ path: "director" }, { path: "writers" }],
            });
        }
    }

    const data = results.map(mapContentItem);

    return {
        success: true,
        data,
        total: totalResults,
        page: currentPage,
        limit: currentLimit,
    };
};

const getContentById = async (contentId) => {
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, content ID galat hai!"
        );
    }

    const userContent = await models.UserContent.findById(contentId)
        .populate("content")
        .populate({
            path: "user createdBy updatedBy",
            select: "_id fullName fullNameString profile",
        })
        .populate({
            path: "user.profile createdBy.profile updatedBy.profile",
            select: "avatar isVerified displayName bio",
        })
        .populate("suggestion");

    if (!userContent) {
        throw new ApiError(httpStatus.NOT_FOUND, "Yeh content nahi mila!");
    }

    if (userContent.contentType === "Music") {
        await userContent.populate({
            path: "content",
            populate: [
                { path: "album" },
                { path: "artist" },
                { path: "featuredArtists" },
            ],
        });
    }

    return mapContentItem(userContent);
};

const deleteContent = async (contentId) => {
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, content ID galat hai!"
        );
    }

    const userContent = await models.UserContent.findById(contentId);
    if (!userContent) {
        throw new ApiError(httpStatus.NOT_FOUND, "Yeh content nahi mila!");
    }

    await models.UserContent.softDelete(contentId);

    const populateOptions = [
        {
            path: "content",
            ...(userContent.contentType === "Music" && {
                populate: [
                    { path: "album" },
                    { path: "artist" },
                    { path: "featuredArtists" },
                ],
            }),
        },
        {
            path: "user createdBy updatedBy",
            select: "_id fullName fullNameString profile",
        },
        {
            path: "user.profile createdBy.profile updatedBy.profile",
            select: "avatar isVerified displayName bio",
        },
        "suggestion",
    ];

    await userContent.populate(populateOptions);

    return mapContentItem(userContent);
};

const checkContent = async (userId, contentId, suggestionId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Bhai, user ID galat hai!");
    }

    if (!contentId && !suggestionId) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, content ID ya suggestion ID, kuch toh daal!"
        );
    }

    if (contentId && !mongoose.Types.ObjectId.isValid(contentId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, content ID galat hai!"
        );
    }

    if (suggestionId && !mongoose.Types.ObjectId.isValid(suggestionId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, suggestion ID galat hai!"
        );
    }

    let userContent;
    if (contentId) {
        userContent = await models.UserContent.findOne({
            user: userId,
            content: contentId,
        });
    } else if (suggestionId) {
        const suggestion = await models.UserSuggestions.findOne({
            _id: suggestionId,
            recipients: userId,
        });
        if (!suggestion) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Yeh suggestion nahi mili ya tu iska recipient nahi hai!"
            );
        }
        userContent = await models.UserContent.findOne({
            user: userId,
            suggestion: suggestionId,
        });
    }

    if (!userContent) {
        return null;
    }

    const populateOptions = [
        {
            path: "content",
            ...(userContent.contentType === "Music" && {
                populate: [
                    { path: "album" },
                    { path: "artist" },
                    { path: "featuredArtists" },
                ],
            }),
        },
        {
            path: "user createdBy updatedBy",
            select: "_id fullName fullNameString profile",
        },
        {
            path: "user.profile createdBy.profile updatedBy.profile",
            select: "avatar isVerified displayName bio",
        },
        "suggestion",
    ];

    await userContent.populate(populateOptions);

    return mapContentItem(userContent);
};

const userContentService = {
    addContent,
    updateContentStatus,
    getUserContent,
    getContentById,
    deleteContent,
    checkContent,
};

export default userContentService;
