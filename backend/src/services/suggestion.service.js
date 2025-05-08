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
    await suggestion.populate("content");
    await suggestion.populate({
        path: "sender recipients",
        select: "_id fullName fullNameString profile",
    });
    await suggestion.populate({
        path: "sender.profile recipients.profile",
        select: "avatar isVerified displayName bio",
    });

    if (!suggestion) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "Abe, yeh suggestion nahi mili!"
        );
    }

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
        const movieId = content.id.toString();
        console.log(
            `Calling getMovieDetails with movieId: ${movieId}, userId: ${user._id}`
        );
        contentDetails = await getContent[content.type]({
            id: movieId,
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

    const validRecipients = recipients?.length
        ? await models.User.find({
              _id: { $in: recipients.map((r) => r._id || r) },
          }).select("_id")
        : [];
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
                : content.type === "music"
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

    await suggestion.populate("content");
    await suggestion.populate({
        path: "sender recipients",
        select: "_id fullName fullNameString profile",
    });
    await suggestion.populate({
        path: "sender.profile recipients.profile",
        select: "avatar isVerified displayName bio",
    });
    await notificationService.sendSuggestionNotification(suggestion);
    return suggestion;
};

const getSuggestionsByUser = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, user ID galat hai!"
        );
    }

    const suggestions = await models.UserSuggestions.find({
        sender: userId,
        deleted: false,
    })
        .populate("content")
        .populate({
            path: "sender recipients",
            select: "_id fullName fullNameString profile",
        })
        .populate({
            path: "sender.profile recipients.profile",
            select: "avatar isVerified displayName bio",
        });

    if (!suggestions.length) {
        return [];
    }

    return suggestions.map((suggestion) => ({
        id: suggestion._id.toString(),
        contentId: suggestion.content?._id.toString(),
        title: suggestion.content?.title || "Unknown Title",
        type: suggestion.contentType.toLowerCase(),
        imageUrl: suggestion.content?.poster?.url || suggestion.content?.coverImage?.url,
        year: suggestion.content?.year?.toString() || suggestion.content?.publishedYear?.toString(),
        creator:
            suggestion.content?.director?.map((d) => d.name).join(", ") ||
            suggestion.content?.creator?.map((c) => c.name).join(", ") ||
            suggestion.content?.author?.map((a) => a.name).join(", ") ||
            suggestion.content?.artists?.map((a) => a.name).join(", ") ||
            "",
        description: suggestion.content?.plot || suggestion.content?.description,
        suggestedTo: suggestion.recipients.map((recipient) => ({
            id: recipient._id.toString(),
            name: recipient.fullNameString,
            avatar: recipient.profile?.avatar?.url,
        })),
        suggestedAt: suggestion.createdAt.toISOString(),
        status: null, // Status not implemented in schema, defaulting to null
    }));
};

const getSuggestionsForUser = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, user ID galat hai!"
        );
    }

    const suggestions = await models.UserSuggestions.find({
        recipients: userId,
        deleted: false,
    })
        .populate("content")
        .populate({
            path: "sender recipients",
            select: "_id fullName fullNameString profile",
        })
        .populate({
            path: "sender.profile recipients.profile",
            select: "avatar isVerified displayName bio",
        });

    if (!suggestions.length) {
        return [];
    }

    return suggestions.map((suggestion) => ({
        id: suggestion._id.toString(),
        contentId: suggestion.content?._id.toString(),
        title: suggestion.content?.title || "Unknown Title",
        type: suggestion.contentType.toLowerCase(),
        imageUrl: suggestion.content?.poster?.url || suggestion.content?.coverImage?.url,
        year: suggestion.content?.year?.toString() || suggestion.content?.publishedYear?.toString(),
        creator:
            suggestion.content?.director?.map((d) => d.name).join(", ") ||
            suggestion.content?.creator?.map((c) => c.name).join(", ") ||
            suggestion.content?.author?.map((a) => a.name).join(", ") ||
            suggestion.content?.artists?.map((a) => a.name).join(", ") ||
            "",
        description: suggestion.content?.plot || suggestion.content?.description,
        suggestedBy: {
            id: suggestion.sender._id.toString(),
            name: suggestion.sender.fullNameString,
            avatar: suggestion.sender.profile?.avatar?.url,
        },
        suggestedAt: suggestion.createdAt.toISOString(),
        status: null, // Status not implemented in schema, defaulting to null
    }));
};

const suggestionService = {
    getSuggestionDetails,
    createSuggestion,
    getSuggestionsByUser,
    getSuggestionsForUser,
};

export default suggestionService;