import mongoose from "mongoose";
import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import axios from "axios";
import config from "../config/env.config.js";

// TMDB API configuration
const TMDB_API_KEY = config.tmdb.apiKey;
const TMDB_AUTH_TOKEN = config.tmdb.accessToken;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Helper function to create or find a Person with detailed TMDB data
const getOrCreatePerson = async (tmdbPerson, userId) => {
  if (!tmdbPerson || !tmdbPerson.id) return null;

  // Check if person exists in database
  let person = await models.Person.findOne({ tmdbId: tmdbPerson.id.toString() });
  if (person) return person._id;

  // Fetch detailed person data from TMDB
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/person/${tmdbPerson.id}`, {
      params: {
        api_key: TMDB_API_KEY,
      },
      headers: {
        Authorization: `Bearer ${TMDB_AUTH_TOKEN}`,
      },
    });

    const personData = response.data;
    person = await models.Person.create({
      name: personData.name,
      tmdbId: personData.id.toString(),
      slug: personData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      professions: [personData.known_for_department || "Creator", "Actor"],
      biography: personData.biography || "",
      birthday: personData.birthday ? new Date(personData.birthday) : null,
      profileImage: personData.profile_path
        ? {
            url: `https://image.tmdb.org/t/p/w500${personData.profile_path}`,
            publicId: personData.profile_path,
          }
        : null,
      isActive: true,
      createdBy: userId || null,
      updatedBy: userId || null,
    });
    return person._id;
  } catch (error) {
    console.error(`TMDB API error for person ${tmdbPerson.id}:`, error.message);
    // Fallback to basic data if TMDB fails
    person = await models.Person.create({
      name: tmdbPerson.name,
      tmdbId: tmdbPerson.id.toString(),
      slug: tmdbPerson.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      professions: [tmdbPerson.known_for_department || "Creator"],
      isActive: true,
      createdBy: userId || null,
      updatedBy: userId || null,
    });
    return person._id;
  }
};

// Helper function to create or find a ProductionCompany with detailed TMDB data
const getOrCreateProductionCompany = async (tmdbCompany, userId) => {
  if (!tmdbCompany || !tmdbCompany.id) return null;

  // Check if company exists in database
  let company = await models.ProductionCompany.findOne({ tmdbId: tmdbCompany.id.toString() });
  if (company) return company._id;

  // Fetch detailed company data from TMDB
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/company/${tmdbCompany.id}`, {
      params: {
        api_key: TMDB_API_KEY,
      },
      headers: {
        Authorization: `Bearer ${TMDB_AUTH_TOKEN}`,
      },
    });

    const companyData = response.data;
    company = await models.ProductionCompany.create({
      name: companyData.name,
      tmdbId: companyData.id.toString(),
      slug: companyData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      logo: companyData.logo_path
        ? {
            url: `https://image.tmdb.org/t/p/w500${companyData.logo_path}`,
            publicId: companyData.logo_path,
          }
        : null,
      headquarters: companyData.headquarters || "",
      country: companyData.origin_country || "",
      isActive: true,
      createdBy: userId || null,
      updatedBy: userId || null,
    });
    return company._id;
  } catch (error) {
    console.error(`TMDB API error for company ${tmdbCompany.id}:`, error.message);
    // Fallback to basic data if TMDB fails
    company = await models.ProductionCompany.create({
      name: tmdbCompany.name,
      tmdbId: tmdbCompany.id.toString(),
      slug: tmdbCompany.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      isActive: true,
      createdBy: userId || null,
      updatedBy: userId || null,
    });
    return company._id;
  }
};

// Helper function to fetch series details from TMDB
const fetchFromTmdb = async (tmdbId) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: "credits,content_ratings,images,keywords,external_ids",
      },
      headers: {
        Authorization: `Bearer ${TMDB_AUTH_TOKEN}`,
      },
    });

    const series = response.data;
    if (!series) {
      return null;
    }

    // Map creators
    const creatorIds = series.created_by
      ? await Promise.all(
          series.created_by.map((c) => getOrCreatePerson(c, null))
        )
      : [];
    const validCreators = creatorIds.filter((id) => id !== null);

    // Map cast
    const cast = series.credits?.cast
      ? await Promise.all(
          series.credits.cast.slice(0, 50).map(async (actor) => {
            const personId = await getOrCreatePerson(actor, null);
            return personId ? { person: personId, character: actor.character || "" } : null;
          })
        )
      : [];
    const validCast = cast.filter((c) => c !== null);

    // Map production companies
    const productionCompanies = series.production_companies
      ? await Promise.all(
          series.production_companies.map((c) => getOrCreateProductionCompany(c, null))
        )
      : [];
    const validCompanies = productionCompanies.filter((c) => c !== null);

    // Map studios (assume same as production companies for now)
    const studios = validCompanies; // Adjust if TMDB provides specific studio data

    // Map distributors (not directly available in TMDB, placeholder)
    const distributors = [];

    // Map seasons details
    const seasonsDetails = series.seasons
      ? series.seasons.map((s) => ({
          seasonNumber: s.season_number,
          title: s.name,
          episodeCount: s.episode_count,
          overview: s.overview || "",
          air_date: s.air_date ? new Date(s.air_date) : null,
          poster_path: s.poster_path
            ? `https://image.tmdb.org/t/p/w500${s.poster_path}`
            : "",
          vote_average: s.vote_average || 0,
        }))
      : [];

    // Map TMDB data to Series schema
    return {
      title: series.name,
      tmdbId: series.id.toString(),
      slug: series.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      plot: series.overview || "",
      year: series.first_air_date ? parseInt(series.first_air_date.split("-")[0]) : null,
      released: series.first_air_date ? new Date(series.first_air_date) : null,
      runtime: series.episode_run_time || [],
      genres: series.genres ? series.genres.map((g) => g.name).slice(0, 5) : [],
      creators: validCreators,
      cast: validCast.length > 0 ? validCast : undefined,
      poster: series.poster_path
        ? {
            url: `https://image.tmdb.org/t/p/w500${series.poster_path}`,
            publicId: series.poster_path,
          }
        : undefined,
      backdrop: series.backdrop_path
        ? {
            url: `https://image.tmdb.org/t/p/w500${series.backdrop_path}`,
            publicId: series.backdrop_path,
          }
        : undefined,
      language: series.spoken_languages
        ? series.spoken_languages.map((l) => l.english_name).slice(0, 5)
        : [],
      country: series.production_countries
        ? series.production_countries.map((c) => c.name)
        : [],
      rated: series.content_ratings?.results
        ?.find((r) => r.iso_3166_1 === "US")
        ?.rating || "Unrated",
      production: {
        companies: validCompanies,
        networks: series.networks
          ? series.networks.map((n) => ({
              name: n.name,
              id: n.id,
              logo_path: n.logo_path
                ? `https://image.tmdb.org/t/p/w500${n.logo_path}`
                : "",
              origin_country: n.origin_country || "",
            }))
          : [],
        studios: studios,
        distributors: distributors,
      },
      references: {
        tmdbId: series.id.toString(),
        imdbId: series.external_ids?.imdb_id || "",
      },
      keywords: series.keywords?.results
        ? series.keywords.results.map((k) => k.name).slice(0, 20)
        : [],
      seasons: series.number_of_seasons || 1,
      episodes: series.number_of_episodes || 1,
      seasonsDetails: seasonsDetails,
      status: series.status || "Ongoing",
      seriesType: series.type || "Other",
      ratings: {
        imdb: {
          score: series.vote_average || 0,
          votes: series.vote_count || 0,
        },
      },
      isActive: true,
      isVerified: false,
      createdBy: null,
      updatedBy: null,
    };
  } catch (error) {
    console.error(`TMDB API error for series ${tmdbId}:`, error.message);
    return null;
  }
};

// Service to get series details by seriesId or tmdbId
const getSeriesDetails = async (seriesId, userId) => {
  if (!seriesId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Series ID or TMDB ID is required");
  }

  // Check if seriesId is a valid MongoDB ObjectId
  const isValidObjectId = mongoose.isValidObjectId(seriesId);

  // Query the database
  let query = {};
  if (isValidObjectId) {
    query = { $or: [{ _id: seriesId }, { "references.tmdbId": seriesId }] };
  } else {
    query = { "references.tmdbId": seriesId };
  }

  let series = await models.Series.findOne(query)
    .populate("creators")
    .populate("cast.person")
    .populate("production.companies")
    .populate("production.studios")
    .populate("production.distributors")
    .populate("createdBy")
    .populate("updatedBy")
    .lean();

  if (series) {
    return series;
  }

  // Fetch from TMDB if not found in database
  const tmdbSeriesDetails = await fetchFromTmdb(seriesId);
  if (!tmdbSeriesDetails) {
    throw new ApiError(httpStatus.NOT_FOUND, "Series not found");
  }

  // Set createdBy and updatedBy
  tmdbSeriesDetails.createdBy = userId || null;
  tmdbSeriesDetails.updatedBy = userId || null;

  // Save to database
  try {
    const newSeries = await models.Series.create(tmdbSeriesDetails);
    // Populate the saved series
    const populatedSeries = await models.Series.findById(newSeries._id)
      .populate("creators")
      .populate("cast.person")
      .populate("production.companies")
      .populate("production.studios")
      .populate("production.distributors")
      .populate("createdBy")
      .populate("updatedBy")
      .lean();
    return populatedSeries;
  } catch (error) {
    console.error("Error saving series to database:", error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to save series to database");
  }
};

const seriesService = {
  getSeriesDetails,
};

export default seriesService;