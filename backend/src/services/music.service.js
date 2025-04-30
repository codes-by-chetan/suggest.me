import mongoose from "mongoose";
import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import axios from "axios";
import config from "../config/env.config.js";

// Spotify API configuration
const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";

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

// Helper function to create or find a Person (artist)
const getOrCreatePerson = async (artistData, userId) => {
  if (!artistData || !artistData.id) return null;

  let person = await models.Person.findOne({ spotifyId: artistData.id });

  const artistDetails = {
    name: artistData.name || "Unknown Artist",
    spotifyId: artistData.id,
    slug: (artistData.name || "unknown-artist")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    professions: ["Musician"],
    profileImage: artistData.images?.[0]?.url
      ? { url: artistData.images[0].url, publicId: artistData.id }
      : null,
    isActive: true,
    createdBy: userId || null,
    updatedBy: userId || null,
  };

  try {
    if (!person) {
      person = await models.Person.create(artistDetails);
    } else {
      await person.updateOne(artistDetails);
    }
    return person._id;
  } catch (error) {
    console.error(`Error creating/updating artist ${artistData.id}:`, error.message);
    if (!person) {
      person = await models.Person.create(artistDetails);
    }
    return person._id;
  }
};

// Helper function to create or find a RecordLabel
const getOrCreateRecordLabel = async (labelName, userId) => {
  if (!labelName) return null;

  let recordLabel = await models.RecordLabel.findOne({ name: labelName });
  if (recordLabel) return recordLabel._id;

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
};

// Helper function to create or find a MusicAlbum
const getOrCreateMusicAlbum = async (albumData, userId) => {
  if (!albumData || !albumData.id) return null;

  let album = await models.MusicAlbum.findOne({ spotifyId: albumData.id });

  const recordLabelId = await getOrCreateRecordLabel(albumData.label || "Unknown Label", userId);

  const albumDetails = {
    title: albumData.name || "Untitled Album",
    spotifyId: albumData.id,
    slug: albumData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    releaseYear: albumData.release_date ? parseInt(albumData.release_date.split("-")[0]) : new Date().getFullYear(),
    coverImage: albumData.images?.[0]?.url
      ? { url: albumData.images[0].url, publicId: albumData.id }
      : { url: "https://via.placeholder.com/150", publicId: "placeholder" },
    recordLabel: recordLabelId,
    genres: albumData.genres?.slice(0, 5) || [],
    isActive: true,
    createdBy: userId || null,
    updatedBy: userId || null,
  };

  try {
    if (!album) {
      album = await models.MusicAlbum.create(albumDetails);
    } else {
      await album.updateOne(albumDetails);
    }
    return album._id;
  } catch (error) {
    console.error(`Error creating/updating album ${albumData.id}:`, error.message);
    if (!album) {
      album = await models.MusicAlbum.create(albumDetails);
    }
    return album._id;
  }
};

// Helper function to fetch music details from Spotify
const fetchFromSpotify = async (spotifyId) => {
  try {
    const accessToken = await getSpotifyAccessToken();
    const response = await axios.get(`${SPOTIFY_BASE_URL}/tracks/${spotifyId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const track = response.data;
    console.log(track);
    
    if (!track || !track.name) {
      console.error(`No valid track data for Spotify ID ${spotifyId}`);
      return null;
    }

    // Fetch artist details
    const artistId = await getOrCreatePerson(track.artists[0], null);

    // Fetch album details
    const albumId = await getOrCreateMusicAlbum(track.album, null);

    // Map Spotify data to Music schema
    const musicDetails = {
      title: track.name,
      spotifyId: track.id,
      slug: track.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      artist: artistId,
      featuredArtists: track.artists.slice(1, 5).length
        ? await Promise.all(
            track.artists.slice(1, 5).map((a) => getOrCreatePerson(a, null))
          ).then((ids) => ids.filter((id) => id !== null))
        : [],
      album: albumId,
      releaseYear: track.album.release_date ? parseInt(track.album.release_date.split("-")[0]) : new Date().getFullYear(),
      duration: track.duration_ms
        ? `${Math.floor(track.duration_ms / 60000)} min ${Math.floor((track.duration_ms % 60000) / 1000)} sec`
        : null,
      genres: track.album.genres?.slice(0, 5) || [],
      language: null, // Spotify doesn't provide language
      availableOn: {
        spotify: {
          plays: track.popularity ? `${track.popularity * 100000}` : null,
          link: track.external_urls.spotify || null,
        },
      },
      isActive: true,
      isVerified: false,
      createdBy: null,
      updatedBy: null,
    };

    return musicDetails;
  } catch (error) {
    console.error(`Spotify API error for track ${spotifyId}:`, error.message);
    return null;
  }
};

// Service to get music details by musicId or spotifyId
const getMusicDetails = async (musicId, userId) => {
  if (!musicId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Music ID or Spotify ID is required");
  }

  // Check if musicId is a valid MongoDB ObjectId
  const isValidObjectId = mongoose.isValidObjectId(musicId);

  // Query the database
  let query = {};
  if (isValidObjectId) {
    query = { $or: [{ _id: musicId }, { spotifyId: musicId }] };
  } else {
    query = { spotifyId: musicId };
  }

  let music = await models.Music.findOne(query)
    .populate("artist")
    .populate("featuredArtists")
    .populate("album")
    .populate("writers")
    .populate("producers")
    .populate("engineers")
    .populate("ratings.userReviews.reviewer")
    .populate("createdBy")
    .populate("updatedBy")
    .lean();

  if (music) {
    return music;
  }

  // Fetch from Spotify if not found in database
  const spotifyMusicDetails = await fetchFromSpotify(musicId);
  if (!spotifyMusicDetails) {
    throw new ApiError(httpStatus.NOT_FOUND, "Music not found");
  }

  // Set createdBy and updatedBy
  spotifyMusicDetails.createdBy = userId || null;
  spotifyMusicDetails.updatedBy = userId || null;

  // Save to database
  try {
    const newMusic = await models.Music.create(spotifyMusicDetails);
    // Populate the saved music
    const populatedMusic = await models.Music.findById(newMusic._id)
      .populate("artist")
      .populate("featuredArtists")
      .populate("album")
      .populate("writers")
      .populate("producers")
      .populate("engineers")
      .populate("ratings.userReviews.reviewer")
      .populate("createdBy")
      .populate("updatedBy")
      .lean();
    return populatedMusic;
  } catch (error) {
    console.error("Error saving music to database:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to save music to database: ${error.message}`);
  }
};

const musicService = {
  getMusicDetails,
};

export default musicService;