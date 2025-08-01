import mongoose from "mongoose";
import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import movieService from "./movie.service.js";
import seriesService from "./series.service.js";
import bookService from "./book.service.js";
import musicService from "./music.service.js";
import { populate } from "dotenv";
import { sendMail } from "../utils/mailer.js";
import config from "../config/env.config.js";

const getContent = {
    Movie: movieService.getMovieDetails,
    Series: seriesService.getSeriesDetails,
    Book: bookService.getBookDetails,
    Music: musicService.getMusicDetails,
};
function escapeHtml(str) {
    return str?.replace(
        /[&<>"']/g,
        (m) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[m]
    );
}
function getSuggestMeContentUrl(contentType, id) {
    switch ((contentType || "").toLowerCase()) {
        case "series":
            return `https://suggest-me-prototype.netlify.app/series/${id}`;
        case "movie":
        case "movies":
            return `https://suggest-me-prototype.netlify.app/movies/${id}`;
        case "book":
        case "books":
            return `https://suggest-me-prototype.netlify.app/books/${id}`;
        case "music":
            return `https://suggest-me-prototype.netlify.app/music/${id}`;
        default:
            return `https://suggest-me-prototype.netlify.app/`;
    }
}
function getContentSummary(userContent) {
    const { content, contentType } = userContent;
    let mainTitle = "",
        subtitle = "",
        image = "",
        description = "",
        metaLines = [];

    if (!contentType) return {};

    // --- BOOK ---
    if (/book/i.test(contentType)) {
        mainTitle = content.title;
        subtitle = content.subtitle || "";
        image = content.coverImage?.url || "";
        description = content.description?.replace(/<[^>]+>/g, "") || "";
        metaLines = [
            { label: "Type", value: content.bookType || "Book" },
            {
                label: "Author",
                value: (content.author || [])
                    .map((a) => a.name ?? a.fullName ?? "")
                    .filter(Boolean)
                    .join(", "),
            },
            { label: "Published", value: content.publishedYear || "" },
            { label: "Pages", value: content.pages || "" },
            { label: "Genres", value: (content.genres || []).join(", ") },
            { label: "Language", value: content.language },
            { label: "Maturity", value: content.maturityRating || "" },
        ];
    }

    // --- MOVIE ---
    else if (/movie/i.test(contentType)) {
        mainTitle = content.title;
        subtitle = "";
        image = content.poster?.url || "";
        description = content.plot || "";
        metaLines = [
            { label: "Year", value: content.year || "" },
            { label: "Rated", value: content.rated || "" },
            {
                label: "Released",
                value: content.released
                    ? new Date(content.released).toLocaleDateString()
                    : "",
            },
            { label: "Genres", value: (content.genres || []).join(", ") },
            {
                label: "Duration",
                value: content.runtime ? `${content.runtime} min` : "",
            },
            { label: "Country", value: (content.country || []).join(", ") },
            { label: "Language", value: (content.language || []).join(", ") },
        ];
    }

    // --- MUSIC ---
    else if (/music/i.test(contentType)) {
        mainTitle = content.title;
        subtitle = "";
        image = content.album?.coverImage?.url || "";
        description = "";
        metaLines = [
            { label: "Artist", value: content.artist?.name ?? "" },
            { label: "Album", value: content.album?.title ?? "" },
            { label: "Release Year", value: content.releaseYear ?? "" },
            { label: "Duration", value: content.duration ?? "" },
        ];
    }

    return { mainTitle, subtitle, image, description, metaLines };
}

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
    const { contentType, user, addedAt, content } = userContent;
    const { mainTitle, subtitle, image, description, metaLines } =
        getContentSummary(userContent);
    const suggestMeUrl = getSuggestMeContentUrl(contentType, content.id);
    const userName = user.fullNameString;

    // HTML template
    const templateString = `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f1f5f9;padding:32px;">
  <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
    <!-- Main Content -->
    <div style="padding:2.5rem;${image ? "display:flex;gap:20px;align-items:flex-start;" : ""}">
      ${
          image
              ? `
        ${
            contentType.toLowerCase().includes("music")
                ? `<img src="${image}" alt="${mainTitle} Cover" style="width:120px;aspect-ratio:1/1;border-radius:12px;box-shadow:0 3px 12px rgba(0,0,0,0.15);object-fit:cover;">`
                : `<img src="${image}" alt="${mainTitle} Poster" style="width:100px;aspect-ratio:2/3;border-radius:12px;box-shadow:0 3px 12px rgba(0,0,0,0.15);object-fit:cover;">`
        }
      `
              : ""
      }
      <div style="flex:1;">
        <h2 style="margin:0 0 0.4em 0;color:#1e293b;font-size:1.5em;font-weight:600;letter-spacing:-0.3px;">
          ${mainTitle}
          ${subtitle ? `<span style="font-size:0.9em;color:#3b82f6;font-weight:500;">: ${subtitle}</span>` : ""}
        </h2>
        <p style="margin:0.2em 0 1em 0;color:#6b7280;font-size:0.95em;">
          <strong>Type:</strong> <span style="background:#e0f2fe;color:#1e40af;padding:3px 10px;border-radius:6px;font-weight:600;">${contentType}</span>
        </p>
        ${metaLines
            .filter((m) => m.value)
            .map(
                (m) =>
                    `<div style="color:#4b5563;font-size:0.95em;margin-bottom:0.4em;"><strong>${m.label}:</strong> <span style="color:#2563eb;">${m.value}</span></div>`
            )
            .join("")}
        ${
            description
                ? `
          <div style="color:#4b5563;font-size:0.95em;margin:1.2em 0;line-height:1.5;">
            <strong>Description:</strong><br>
            <span>${description}</span>
          </div>
        `
                : ""
        }
        <div style="margin:1.5rem 0 0 0;">
          <a href="${suggestMeUrl}" target="_blank" style="background:linear-gradient(90deg,#10b981,#34d399);color:#ffffff;padding:10px 30px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:1em;box-shadow:0 3px 10px rgba(0,0,0,0.2);transition:background 0.2s ease;">
            View on Suggest Me
          </a>
        </div>
      </div>
    </div>
    <!-- Footer -->
    <div style="padding:0 2.5rem 2rem;">
      <hr style="margin:2rem 0 1.2em 0;border:0;border-top:1px solid #e5e7eb;">
      <div style="font-size:0.9em;color:#6b7280;">
        <strong>Added by:</strong> ${userName}<br>
        <strong>Date Added:</strong> ${new Date(addedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
      </div>
      <div style="margin-top:1.8em;text-align:center;font-size:0.9em;color:#9ca3af;">
        This is an automated notification from your server.<br>No action required.
      </div>
    </div>
  </div>
</div>
`;

    // Render the template
    let html = templateString;

    const mailOptions = {
        from: `"Server Notifier" <${config.email.id}>`,
        to: "chetanmohite2128@gmail.com",
        subject: `✨ ${mainTitle} (${contentType}) Added to Your List`,
        text: `${mainTitle} (${contentType}) has been added to your list.`,
        html: html,
    };

    sendMail(mailOptions);

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
        video: "Video",
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
