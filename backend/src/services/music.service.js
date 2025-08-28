import mongoose from "mongoose";
import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import axios from "axios";
import config from "../config/env.config.js";

// Spotify API configuration
const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";

// Research microservice configuration
const RESEARCH_API_URL =
    "https://content-research.vercel.app/api/research/music";

// Function to validate Spotify ID
const isValidSpotifyId = (id) => {
    return typeof id === "string" && /^[0-9a-zA-Z]{22}$/.test(id);
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
        console.error("Failed to obtain Spotify access token:", error.message);
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Failed to authenticate with Spotify API"
        );
    }
};

// Helper function to create or find a Person (artist)
const getOrCreatePerson = async (artistData, userId) => {
    if (!artistData || !artistData.id) return null;

    let person = await models.Person.findOne({ spotifyId: artistData.id });

    try {
        let response;
        try {
            const accessToken = await getSpotifyAccessToken();
            response = await axios.get(
                `${SPOTIFY_BASE_URL}/artists/${artistData.id}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
        } catch (error) {
            console.error(
                `Spotify API error for artist ${artistData.id}:`,
                error.message
            );
            console.error(
                `Spotify API error details for artist ${artistData.id}:`,
                error
            );
            throw new Error(error.message);
        }

        const artistDetails = response.data;
        const personData = {
            name: artistDetails.name || artistData.name || "Unknown Artist",
            spotifyId: artistDetails.id,
            slug: (artistDetails.name || artistData.name || "unknown-artist")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            professions: ["Musician"],
            biography: artistDetails.biography || "",
            profileImage: artistDetails.images?.[0]?.url
                ? {
                      url: artistDetails.images[0].url,
                      publicId: artistDetails.id,
                  }
                : null,
            isActive: true,
            createdBy: userId || null,
            updatedBy: userId || null,
        };

        if (!person) {
            person = await models.Person.create(personData);
            return person._id;
        }

        await person.updateOne(personData);
        return person._id;
    } catch (error) {
        console.error(
            `Error processing artist ${artistData.id}:`,
            error.message
        );
        console.error(`Error details for artist ${artistData.id}:`, error);

        const fallbackData = {
            name: artistData.name || "Unknown Artist",
            spotifyId: artistData.id,
            slug: (artistData.name || "unknown-artist")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            professions: ["Musician"],
            isActive: true,
            createdBy: userId || null,
            updatedBy: userId || null,
        };

        if (!person) {
            person = await models.Person.create(fallbackData);
        } else {
            await person.updateOne(fallbackData);
        }
        return person._id;
    }
};

// Helper function to create or find a RecordLabel
const getOrCreateRecordLabel = async (labelName, userId) => {
    if (!labelName) return null;

    let recordLabel = await models.RecordLabel.findOne({ name: labelName });
    if (recordLabel) return recordLabel._id;

    try {
        recordLabel = await models.RecordLabel.create({
            name: labelName,
            slug: labelName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            isActive: true,
            createdBy: userId || null,
            updatedBy: userId || null,
        });
        return recordLabel._id;
    } catch (error) {
        console.error(
            `Error creating record label ${labelName}:`,
            error.message
        );
        throw new Error(`Failed to create record label: ${error.message}`);
    }
};

// Helper function to create or find a ProductionCompany
const getOrCreateProductionCompany = async (companyName, userId) => {
    if (!companyName) return null;

    let company = await models.ProductionCompany.findOne({ name: companyName });
    if (company) return company._id;

    try {
        company = await models.ProductionCompany.create({
            name: companyName,
            slug: companyName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            isActive: true,
            createdCFD: userId || null,
            updatedBy: userId || null,
        });
        return company._id;
    } catch (error) {
        console.error(
            `Error creating production company ${companyName}:`,
            error.message
        );
        throw new Error(
            `Failed to create production company: ${error.message}`
        );
    }
};

// Helper function to create or find a MusicVideo
const getOrCreateMusicVideo = async (videoUrl, musicId, userId) => {
    if (!videoUrl || !musicId) return null;

    let musicVideo = await models.MusicVideo.findOne({ url: videoUrl });
    if (musicVideo) return musicVideo._id;

    try {
        musicVideo = await models.MusicVideo.create({
            music: musicId,
            url: videoUrl,
            isActive: true,
            createdBy: userId || null,
            updatedBy: userId || null,
        });
        return musicVideo._id;
    } catch (error) {
        console.error(
            `Error creating music video for URL ${videoUrl}:`,
            error.message
        );
        return null;
    }
};

// Helper function to create or find a MusicAlbum
const getOrCreateMusicAlbum = async (albumData, userId) => {
    if (!albumData || !albumData.id) return null;

    let album = await models.MusicAlbum.findOne({ spotifyId: albumData.id });

    try {
        let response;
        try {
            const accessToken = await getSpotifyAccessToken();
            response = await axios.get(
                `${SPOTIFY_BASE_URL}/albums/${albumData.id}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
        } catch (error) {
            console.error(
                `Spotify API error for album ${albumData.id}:`,
                error.message
            );
            console.error(
                `Spotify API error details for album ${albumData.id}:`,
                error
            );
            throw new Error(error.message);
        }

        const albumDetails = response.data;
        const recordLabelId = await getOrCreateRecordLabel(
            albumDetails.label || "Unknown Label",
            userId
        );

        const albumDataToSave = {
            title: albumDetails.name || "Untitled Album",
            spotifyId: albumDetails.id,
            slug: (albumDetails.name || "untitled-album")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            releaseYear: albumDetails.release_date
                ? parseInt(albumDetails.release_date.split("-")[0])
                : new Date().getFullYear(),
            coverImage: albumDetails.images?.[0]?.url
                ? { url: albumDetails.images[0].url, publicId: albumDetails.id }
                : {
                      url: "https://via.placeholder.com/150",
                      publicId: "placeholder",
                  },
            recordLabel: recordLabelId,
            genres: albumDetails.genres?.slice(0, 5) || [],
            isActive: true,
            createdBy: userId || null,
            updatedBy: userId || null,
        };

        if (!album) {
            album = await models.MusicAlbum.create(albumDataToSave);
        } else {
            await album.updateOne(albumDataToSave);
        }
        return album._id;
    } catch (error) {
        console.error(`Error processing album ${albumData.id}:`, error.message);
        console.error(`Error details for album ${albumData.id}:`, error);

        const fallbackData = {
            title: albumData.name || "Untitled Album",
            spotifyId: albumData.id,
            slug: (albumData.name || "untitled-album")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            releaseYear: albumData.release_date
                ? parseInt(albumData.release_date.split("-")[0])
                : new Date().getFullYear(),
            coverImage: albumData.images?.[0]?.url
                ? { url: albumData.images[0].url, publicId: albumData.id }
                : {
                      url: "https://via.placeholder.com/150",
                      publicId: "placeholder",
                  },
            recordLabel: await getOrCreateRecordLabel(
                albumData.label || "Unknown Label",
                userId
            ),
            genres: albumData.genres?.slice(0, 5) || [],
            isActive: true,
            createdBy: userId || null,
            updatedBy: userId || null,
        };

        if (!album) {
            album = await models.MusicAlbum.create(fallbackData);
        } else {
            await album.updateOne(fallbackData);
        }
        return album._id;
    }
};

// Helper function to fetch music details from Spotify
const fetchFromSpotify = async (spotifyId) => {
    try {
        let response;
        try {
            const accessToken = await getSpotifyAccessToken();
            response = await axios.get(
                `${SPOTIFY_BASE_URL}/tracks/${spotifyId}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: {
                        market: "US", // Ensure track data is available
                    },
                }
            );
        } catch (error) {
            console.error(
                `Spotify API error for track ${spotifyId}:`,
                error.message
            );
            console.error(
                `Spotify API error details for track ${spotifyId}:`,
                error
            );
            throw new Error(error.message);
        }

        const track = response.data;
        if (!track || !track.name) {
            console.error(`No valid track data for Spotify ID ${spotifyId}`);
            return null;
        }

        // Fetch artist details
        const artistId = await getOrCreatePerson(track.artists[0], null);

        // Fetch featured artists
        const featuredArtists = track.artists.slice(1, 5).length
            ? await Promise.all(
                  track.artists
                      .slice(1, 5)
                      .map((a) => getOrCreatePerson(a, null))
              ).then((ids) => ids.filter((id) => id !== null))
            : [];

        // Fetch album details
        const albumId = await getOrCreateMusicAlbum(track.album, null);

        // Fetch record label (from album data)
        const recordLabelId = await getOrCreateRecordLabel(
            track.album.label || "Unknown Label",
            null
        );

        // Fetch production company (placeholder, as Spotify doesn't provide this directly)
        const productionCompanyId = await getOrCreateProductionCompany(
            track.album.label || "Unknown Production",
            null
        );

        // Map Spotify data to Music schema
        const musicDetails = {
            title: track.name,
            spotifyId: track.id,
            slug: track.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            artist: artistId,
            featuredArtists: featuredArtists,
            album: albumId,
            recordLabel: recordLabelId,
            musicVideo: null, // Updated to null since getOrCreateMusicVideo was causing issues
            productionCompanies: productionCompanyId
                ? [productionCompanyId]
                : [],
            releaseYear: track.album.release_date
                ? parseInt(track.album.release_date.split("-")[0])
                : new Date().getFullYear(),
            duration: track.duration_ms
                ? `${Math.floor(track.duration_ms / 60000)} min ${Math.floor((track.duration_ms % 60000) / 1000)} sec`
                : null,
            genres: track.album.genres?.slice(0, 5) || [],
            language: null, // Spotify doesn't provide language
            availableOn: {
                spotify: {
                    plays: track.popularity
                        ? `${track.popularity * 100000}`
                        : null,
                    link: track.external_urls?.spotify || null,
                },
            },
            isActive: true,
            isVerified: false,
            createdBy: null,
            updatedBy: null,
        };

        return musicDetails;
    } catch (error) {
        console.error(
            `Error fetching track ${spotifyId} from Spotify:`,
            error.message
        );
        console.error(`Error details for track ${spotifyId}:`, error);
        return null;
    }
};

// Helper function to compare arrays for equality
const arraysEqual = (arr1, arr2) => {
    if (!arr1 || !arr2) return arr1 === arr2;
    if (arr1.length !== arr2.length) return false;
    return arr1.every(
        (item, index) =>
            item === arr2[index] ||
            (item?._id && arr2[index]?._id && item._id.equals(arr2[index]._id))
    );
};

// Helper function to enrich music data from research microservice
const enrichFromResearch = async (musicId) => {
    try {
        const music = await models.Music.findById(musicId)
            .populate("artist")
            .populate("album")
            .lean();

        if (!music) return;

        const payload = {
            title: music.title,
            artist: music.artist?.name,
            year: music.releaseYear,
            album: music.album?.title,
            genre: music.genres?.[0],
        };

        const response = await axios.post(RESEARCH_API_URL, payload);
        const data = response.data.data;

        if (!data) return;

        const updateData = {};

        const artistId = await getOrCreatePerson(data.artist, null);
        if (artistId && (!music.artist || !music.artist._id.equals(artistId))) {
            updateData.artist = artistId;
        }

        const featuredArtists = data.featuredArtists?.length
            ? await Promise.all(
                  data.featuredArtists
                      .filter(
                          (a) =>
                              a.name &&
                              typeof a.name === "string" &&
                              !a.name.includes("(P)") &&
                              !a.name.includes("℗")
                      )
                      .map((a) => getOrCreatePerson(a, null))
              ).then((ids) => ids.filter((id) => id !== null))
            : [];
        if (
            featuredArtists.length &&
            !arraysEqual(music.featuredArtists, featuredArtists)
        ) {
            updateData.featuredArtists = featuredArtists;
        }

        const albumId = await getOrCreateMusicAlbum(data.album, null);
        if (albumId && (!music.album || !music.album._id.equals(albumId))) {
            updateData.album = albumId;
        }

        const recordLabelId = await getOrCreateRecordLabel(
            data.album?.recordLabel || "Unknown Label",
            null
        );
        if (
            recordLabelId &&
            (!music.recordLabel || !music.recordLabel.equals(recordLabelId))
        ) {
            updateData.recordLabel = recordLabelId;
        }

        const youtubeStreaming = data.availableOn?.streaming?.find(
            (s) => s.platform === "YouTube"
        );
        const musicVideoId = youtubeStreaming?.link
            ? await getOrCreateMusicVideo(
                  youtubeStreaming.link,
                  music._id,
                  null
              )
            : null;
        if (
            musicVideoId &&
            (!music.musicVideo || !music.musicVideo.equals(musicVideoId))
        ) {
            updateData.musicVideo = musicVideoId;
        }

        const productionCompanyId = await getOrCreateProductionCompany(
            data.album?.recordLabel || "Unknown Production",
            null
        );
        if (
            productionCompanyId &&
            (!music.productionCompanies ||
                !music.productionCompanies.some((id) =>
                    id.equals(productionCompanyId)
                ))
        ) {
            updateData.productionCompanies = [productionCompanyId];
        }

        // Skip writers enrichment temporarily as requested

        const producersIds = data.producers?.length
            ? await Promise.all(
                  data.producers
                      .filter(
                          (p) =>
                              typeof p === "string" &&
                              p.trim() &&
                              !p.includes("(P)") &&
                              !p.includes("℗")
                      )
                      .map((p) => getOrCreatePerson({ name: p, id: p }, null))
              ).then((ids) => ids.filter((id) => id !== null))
            : [];
        if (
            producersIds.length &&
            !arraysEqual(music.producers, producersIds)
        ) {
            updateData.producers = producersIds;
        }

        if (data.title && data.title !== music.title)
            updateData.title = data.title;
        if (data.slug && data.slug !== music.slug) updateData.slug = data.slug;
        if (data.releaseYear && data.releaseYear !== music.releaseYear)
            updateData.releaseYear = data.releaseYear;
        if (data.duration && data.duration !== music.duration)
            updateData.duration = data.duration;
        if (data.genres && !arraysEqual(data.genres, music.genres))
            updateData.genres = data.genres;
        if (data.mood && !arraysEqual(data.mood, music.mood))
            updateData.mood = data.mood;
        if (data.language && data.language !== music.language)
            updateData.language = data.language;
        if (data.formats && !arraysEqual(data.formats, music.formats))
            updateData.formats = data.formats;

        const newAvailableOn = {};
        if (
            data.availableOn?.streaming?.find((s) => s.platform === "Spotify")
                ?.link &&
            data.availableOn.streaming.find((s) => s.platform === "Spotify")
                .link !== music.availableOn?.spotify?.link
        ) {
            newAvailableOn.spotify = {
                plays: music.availableOn?.spotify?.plays,
                link: data.availableOn.streaming.find(
                    (s) => s.platform === "Spotify"
                ).link,
            };
        }
        if (
            data.availableOn?.streaming?.find(
                (s) => s.platform === "Apple Music"
            )?.link &&
            data.availableOn.streaming.find((s) => s.platform === "Apple Music")
                .link !== music.availableOn?.appleMusic?.link
        ) {
            newAvailableOn.appleMusic = {
                plays: music.availableOn?.appleMusic?.plays,
                link: data.availableOn.streaming.find(
                    (s) => s.platform === "Apple Music"
                ).link,
            };
        }
        if (
            data.availableOn?.streaming?.find((s) => s.platform === "YouTube")
                ?.link &&
            data.availableOn.streaming.find((s) => s.platform === "YouTube")
                .link !== music.availableOn?.youtube?.link
        ) {
            newAvailableOn.youtube = {
                views: music.availableOn?.youtube?.views,
                link: data.availableOn.streaming.find(
                    (s) => s.platform === "YouTube"
                ).link,
            };
        }
        if (Object.keys(newAvailableOn).length)
            updateData.availableOn = {
                ...music.availableOn,
                ...newAvailableOn,
            };

        if (
            data.ratings?.spotify?.score &&
            data.ratings.spotify.score !== music.ratings?.spotify?.score
        ) {
            updateData.ratings = {
                spotify: {
                    score: data.ratings.spotify.score,
                    votes:
                        data.ratings.spotify.votes ||
                        music.ratings?.spotify?.votes,
                },
            };
        }

        if (
            (data.lyrics?.preview &&
                data.lyrics.preview !== music.lyrics?.preview) ||
            (data.lyrics?.fullLyricsLink &&
                data.lyrics.fullLyricsLink !== music.lyrics?.fullLyricsLink)
        ) {
            updateData.lyrics = {
                preview: data.lyrics?.preview || music.lyrics?.preview,
                fullLyricsLink:
                    data.lyrics?.fullLyricsLink || music.lyrics?.fullLyricsLink,
            };
        }

        if (Object.keys(updateData).length > 0) {
            updateData.updatedBy = null;
            await models.Music.findByIdAndUpdate(musicId, updateData, {
                timestamps: true,
            });
        }
    } catch (error) {
        console.error(
            `Error enriching music ${musicId} from research microservice:`,
            error.message
        );
        console.error("error : ", error);
    }
};

// Service to get music details by musicId or spotifyId
const getMusicDetails = async ({ id, userId }) => {
    if (!id) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Music ID or Spotify ID is required"
        );
    }

    // Ensure id is a string
    const musicId = id.toString();
    console.log(`getMusicDetails: Querying with musicId: ${musicId}`);

    // Check if musicId is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(musicId);
    console.log(`getMusicDetails: isValidObjectId: ${isValidObjectId}`);

    // Query the database
    let query = {};
    if (isValidObjectId) {
        try {
            query = {
                $or: [{ _id: musicId }, { spotifyId: musicId }],
            };
        } catch (error) {
            console.error(
                "Query construction with ObjectId failed:",
                error.message
            );
            query = { spotifyId: musicId };
        }
    } else {
        query = { spotifyId: musicId };
    }

    console.log(`getMusicDetails: Executing query: ${JSON.stringify(query)}`);
    let music = await models.Music.findOne(query)
        .populate("artist")
        .populate("featuredArtists")
        .populate("album")
        .populate("recordLabel")
        .populate("musicVideo")
        .populate("productionCompanies")
        .populate("writers")
        .populate("producers")
        .populate("engineers")
        .populate("ratings.userReviews.reviewer")
        .populate("createdBy")
        .populate("updatedBy")
        .lean();

    if (music) {
        console.log(`getMusicDetails: Found music in database: ${music._id}`);
    } else {
        // Fetch from Spotify if not found in database
        console.log(
            `getMusicDetails: Fetching from Spotify with ID: ${musicId}`
        );
        const spotifyMusicDetails = await fetchFromSpotify(musicId);
        if (!spotifyMusicDetails) {
            console.log(`getMusicDetails: Music not found for ID: ${musicId}`);
            throw new ApiError(httpStatus.NOT_FOUND, "Music not found");
        }

        // Set createdBy and updatedBy
        spotifyMusicDetails.createdBy = userId || null;
        spotifyMusicDetails.updatedBy = userId || null;

        // Save to database
        try {
            const newMusic = await models.Music.create(spotifyMusicDetails);
            console.log(
                `getMusicDetails: Saved new music to database: ${newMusic._id}`
            );
            music = await models.Music.findById(newMusic._id)
                .populate("artist")
                .populate("featuredArtists")
                .populate("album")
                .populate("recordLabel")
                .populate("musicVideo")
                .populate("productionCompanies")
                .populate("writers")
                .populate("producers")
                .populate("engineers")
                .populate("ratings.userReviews.reviewer")
                .populate("createdBy")
                .populate("updatedBy")
                .lean();
        } catch (error) {
            console.error("Error saving music to database:", error.message);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `Failed to save music to database: ${error.message}`
            );
        }
    }

    // Check if data needs enrichment (older than 24 hours)
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const needsEnrichment =
        new Date(music.updatedAt).getTime() < twentyFourHoursAgo ||
        music.createdBy === music.updatedBy;

    console.log("music.updatedAt : ", music.updatedAt);
    console.log("music.createdAt : ", music.createdAt);
    console.log("needsEnrichment : ", needsEnrichment);

    if (needsEnrichment) {
        // Run enrichment asynchronously in the background
        (async () => {
            await enrichFromResearch(music._id);
        })();
    }

    return music;
};

const musicService = {
    getMusicDetails,
};

export default musicService;
