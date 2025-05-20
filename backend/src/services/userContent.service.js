import mongoose from "mongoose";
import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import movieService from "./movie.service.js";
import seriesService from "./series.service.js";
import bookService from "./book.service.js";
import musicService from "./music.service.js";

const getContent = {
    Movie: movieService.getMovieDetails,
    Series: seriesService.getSeriesDetails,
    Book: bookService.getBookDetails,
    Music: musicService.getMusicDetails,
};

const addContent = async (user, content, status = "WantToConsume", suggestionId) => {
    if (!content?.id || !content?.type) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, content ID ya type toh daal!"
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

    await userContent.populate("content");
    await userContent.populate({
        path: "user createdBy updatedBy",
        select: "_id fullName fullNameString profile",
    });
    await userContent.populate({
        path: "user.profile createdBy.profile updatedBy.profile",
        select: "avatar isVerified displayName bio",
    });
    await userContent.populate("suggestion");

    return {
        id: userContent._id.toString(),
        contentId: userContent.content?._id.toString(),
        title: userContent.content?.title || "Unknown Title",
        type: userContent.contentType.toLowerCase(),
        imageUrl:
            userContent.content?.poster?.url ||
            userContent.content?.coverImage?.url ||
            userContent.content?.album?.coverImage?.url,
        year:
            userContent.content?.year?.toString() ||
            userContent.content?.publishedYear?.toString() ||
            userContent.content?.releaseYear?.toString(),
        creator:
            userContent.content?.director
                ?.map((d) => d.name)
                .join(", ") ||
            userContent.content?.creator
                ?.map((c) => c.name)
                .join(", ") ||
            userContent.content?.author?.map((a) => a.name).join(", ") ||
            userContent.content?.artists
                ?.map((a) => a.name)
                .join(", ") ||
            "",
        description:
            userContent.content?.plot || userContent.content?.description,
        status: userContent.status,
        addedAt: userContent.addedAt.toISOString(),
        suggestionId: userContent.suggestion?._id.toString() || null,
    };
};

const updateContentStatus = async (userId, contentId, status) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, user ID galat hai!"
        );
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
        { user: userId, content: contentId },
        { status, lastUpdatedAt: Date.now(), updatedBy: userId },
        { new: true }
    );

    if (!userContent) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "Yeh content teri list mein nahi mila!"
        );
    }

    await userContent.populate("content");
    await userContent.populate({
        path: "user createdBy updatedBy",
        select: "_id fullName fullNameString profile",
    });
    await userContent.populate({
        path: "user.profile createdBy.profile updatedBy.profile",
        select: "avatar isVerified displayName bio",
    });
    await userContent.populate("suggestion");

    return {
        id: userContent._id.toString(),
        contentId: userContent.content?._id.toString(),
        title: userContent.content?.title || "Unknown Title",
        type: userContent.contentType.toLowerCase(),
        imageUrl:
            userContent.content?.poster?.url ||
            userContent.content?.coverImage?.url ||
            userContent.content?.album?.coverImage?.url,
        year:
            userContent.content?.year?.toString() ||
            userContent.content?.publishedYear?.toString() ||
            userContent.content?.releaseYear?.toString(),
        creator:
            userContent.content?.director
                ?.map((d) => d.name)
                .join(", ") ||
            userContent.content?.creator
                ?.map((c) => c.name)
                .join(", ") ||
            userContent.content?.author?.map((a) => a.name).join(", ") ||
            userContent.content?.artists
                ?.map((a) => a.name)
                .join(", ") ||
            "",
        description:
            userContent.content?.plot || userContent.content?.description,
        status: userContent.status,
        addedAt: userContent.addedAt.toISOString(),
        suggestionId: userContent.suggestion?._id.toString() || null,
    };
};

const getUserContent = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, user ID galat hai!"
        );
    }

    const contentList = await models.UserContent.find({ user: userId })
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

    if (!contentList.length) {
        return [];
    }

    return contentList.map((userContent) => ({
        id: userContent._id.toString(),
        contentId: userContent.content?._id.toString(),
        title: userContent.content?.title || "Unknown Title",
        type: userContent.contentType.toLowerCase(),
        imageUrl:
            userContent.content?.poster?.url ||
            userContent.content?.coverImage?.url ||
            userContent.content?.album?.coverImage?.url,
        year:
            userContent.content?.year?.toString() ||
            userContent.content?.publishedYear?.toString() ||
            userContent.content?.releaseYear?.toString(),
        creator:
            userContent.content?.director
                ?.map((d) => d.name)
                .join(", ") ||
            userContent.content?.creator
                ?.map((c) => c.name)
                .join(", ") ||
            userContent.content?.author?.map((a) => a.name).join(", ") ||
            userContent.content?.artists
                ?.map((a) => a.name)
                .join(", ") ||
            "",
        description:
            userContent.content?.plot || userContent.content?.description,
        status: userContent.status,
        addedAt: userContent.addedAt.toISOString(),
        suggestionId: userContent.suggestion?._id.toString() || null,
    }));
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
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "Yeh content nahi mila!"
        );
    }

    return {
        id: userContent._id.toString(),
        contentId: userContent.content?._id.toString(),
        title: userContent.content?.title || "Unknown Title",
        type: userContent.contentType.toLowerCase(),
        imageUrl:
            userContent.content?.poster?.url ||
            userContent.content?.coverImage?.url ||
            userContent.content?.album?.coverImage?.url,
        year:
            userContent.content?.year?.toString() ||
            userContent.content?.publishedYear?.toString() ||
            userContent.content?.releaseYear?.toString(),
        creator:
            userContent.content?.director
                ?.map((d) => d.name)
                .join(", ") ||
            userContent.content?.creator
                ?.map((c) => c.name)
                .join(", ") ||
            userContent.content?.author?.map((a) => a.name).join(", ") ||
            userContent.content?.artists
                ?.map((a) => a.name)
                .join(", ") ||
            "",
        description:
            userContent.content?.plot || userContent.content?.description,
        status: userContent.status,
        addedAt: userContent.addedAt.toISOString(),
        suggestionId: userContent.suggestion?._id.toString() || null,
    };
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
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "Yeh content nahi mila!"
        );
    }

    await models.UserContent.softDelete(contentId);

    await userContent.populate("content");
    await userContent.populate({
        path: "user createdBy updatedBy",
        select: "_id fullName fullNameString profile",
    });
    await userContent.populate({
        path: "user.profile createdBy.profile updatedBy.profile",
        select: "avatar isVerified displayName bio",
    });
    await userContent.populate("suggestion");

    return {
        id: userContent._id.toString(),
        contentId: userContent.content?._id.toString(),
        title: userContent.content?.title || "Unknown Title",
        type: userContent.contentType.toLowerCase(),
        imageUrl:
            userContent.content?.poster?.url ||
            userContent.content?.coverImage?.url ||
            userContent.content?.album?.coverImage?.url,
        year:
            userContent.content?.year?.toString() ||
            userContent.content?.publishedYear?.toString() ||
            userContent.content?.releaseYear?.toString(),
        creator:
            userContent.content?.director
                ?.map((d) => d.name)
                .join(", ") ||
            userContent.content?.creator
                ?.map((c) => c.name)
                .join(", ") ||
            userContent.content?.author?.map((a) => a.name).join(", ") ||
            userContent.content?.artists
                ?.map((a) => a.name)
                .join(", ") ||
            "",
        description:
            userContent.content?.plot || userContent.content?.description,
        status: userContent.status,
        addedAt: userContent.addedAt.toISOString(),
        suggestionId: userContent.suggestion?._id.toString() || null,
    };
};

const userContentService = {
    addContent,
    updateContentStatus,
    getUserContent,
    getContentById,
    deleteContent,
};

export default userContentService;