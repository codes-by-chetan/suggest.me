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

// OMDb API configuration
const OMDB_API_KEY = config.omdb.apiKey;
const OMDB_BASE_URL = "http://www.omdbapi.com/";

// Helper function to create or find a Person with detailed TMDB data
const getOrCreatePerson = async (tmdbPerson, userId) => {
    if (!tmdbPerson || !tmdbPerson.id) return null;

    // Check if person exists in database
    let person = await models.Person.findOne({
        tmdbId: tmdbPerson.id.toString(),
    });

    // Fetch detailed person data from TMDB
    try {
        let response;
        try {
            response = await axios.get(
                `${TMDB_BASE_URL}/person/${tmdbPerson.id}`,
                {
                    params: { api_key: TMDB_API_KEY },
                    headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
                }
            );
        } catch (error) {
            console.error(
                `TMDB API error for person ${tmdbPerson.id}:`,
                error.message
            );
            console.error(`TMDB API error for person ${tmdbPerson.id}:`, error);
            throw new Error(error.message);
        }

        const personData = response.data;
        if (!person) {
            person = await models.Person.create({
                name: personData.name || tmdbPerson.name,
                tmdbId: personData.id.toString(),
                slug: (personData.name || tmdbPerson.name)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, ""),
                professions: [
                    personData.known_for_department ||
                        tmdbPerson.known_for_department ||
                        "Creator",
                    "Actor",
                ],
                biography: personData.biography || "",
                birthday: personData.birthday
                    ? new Date(personData.birthday)
                    : null,
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
        }
        await person.updateOne({
            name: personData.name || tmdbPerson.name,
            slug: (personData.name || tmdbPerson.name)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            professions: [
                personData.known_for_department ||
                    tmdbPerson.known_for_department ||
                    "Creator",
                "Actor",
            ],
            biography: personData.biography || "",
            birthday: personData.birthday
                ? new Date(personData.birthday)
                : null,
            profileImage: personData.profile_path
                ? {
                      url: `https://image.tmdb.org/t/p/w500${personData.profile_path}`,
                      publicId: personData.profile_path,
                  }
                : null,
            isActive: true,
            updatedBy: userId || null,
        });
        return person._id;
    } catch (error) {
        console.error(
            `TMDB API error for person ${tmdbPerson.id}:`,
            error.message
        );
        console.error(`TMDB API error for person ${tmdbPerson.id}:`, error);
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

    let company = await models.ProductionCompany.findOne({
        tmdbId: tmdbCompany.id.toString(),
    });
    if (company) return company._id;

    try {
        let response;
        try {
            response = await axios.get(
                `${TMDB_BASE_URL}/company/${tmdbCompany.id}`,
                {
                    params: { api_key: TMDB_API_KEY },
                    headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
                }
            );
        } catch (error) {
            console.error(
                `TMDB API error for company ${tmdbCompany.id}:`,
                error.message
            );
            console.error(`TMDB API error for company ${tmdbCompany.id}:`, error);
            throw new Error(error.message);
        }

        const companyData = response.data;
        company = await models.ProductionCompany.create({
            name: companyData.name || tmdbCompany.name,
            tmdbId: companyData.id.toString(),
            slug: (companyData.name || tmdbCompany.name)
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
        console.error(
            `TMDB API error for company ${tmdbCompany.id}:`,
            error.message
        );
        console.error(`TMDB API error for company ${tmdbCompany.id}:`, error);
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

// Helper function to fetch series by IMDb ID from TMDB
const fetchFromTmdbByImdb = async (imdbId) => {
    try {
        let response;
        try {
            const findResponse = await axios.get(
                `${TMDB_BASE_URL}/find/${imdbId}`,
                {
                    params: {
                        api_key: TMDB_API_KEY,
                        external_source: "imdb_id",
                    },
                    headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
                }
            );

            const seriesResult = findResponse.data.tv_results[0];
            if (!seriesResult || !seriesResult.id) {
                console.error(`No series found for IMDb ID ${imdbId} in TMDB`);
                return null;
            }

            response = await axios.get(
                `${TMDB_BASE_URL}/tv/${seriesResult.id}`,
                {
                    params: {
                        api_key: TMDB_API_KEY,
                        append_to_response:
                            "credits,content_ratings,images,keywords,external_ids",
                    },
                    headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
                }
            );
        } catch (error) {
            console.error(
                `TMDB API error for IMDb ID ${imdbId}:`,
                error.message
            );
            console.error(`TMDB API error for IMDb ID ${imdbId}:`, error);
            throw new Error(error.message);
        }

        const series = response.data;
        if (!series || !series.name) {
            console.error(`No valid series data for TMDB ID ${seriesResult.id}`);
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
                      return personId
                          ? { person: personId, character: actor.character || "" }
                          : null;
                  })
              )
            : [];
        const validCast = cast.filter((c) => c !== null);

        // Map production companies
        const productionCompanies = series.production_companies
            ? await Promise.all(
                  series.production_companies.map((c) =>
                      getOrCreateProductionCompany(c, null)
                  )
              )
            : [];
        const validCompanies = productionCompanies.filter((c) => c !== null);

        // Map studios (assume same as production companies for now)
        const studios = validCompanies;

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
        const tmdbSeriesDetails = {
            title: series.name,
            tmdbId: series.id.toString(),
            slug: series.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            plot: series.overview || "",
            year: series.first_air_date
                ? parseInt(series.first_air_date.split("-")[0])
                : null,
            released: series.first_air_date
                ? new Date(series.first_air_date)
                : null,
            runtime: series.episode_run_time || [],
            genres: series.genres
                ? series.genres.map((g) => g.name).slice(0, 5)
                : [],
            creators: validCreators,
            cast: validCast.length > 0 ? validCast : [],
            poster: series.poster_path
                ? {
                      url: `https://image.tmdb.org/t/p/w500${series.poster_path}`,
                      publicId: series.poster_path,
                  }
                : null,
            backdrop: series.backdrop_path
                ? {
                      url: `https://image.tmdb.org/t/p/w500${series.backdrop_path}`,
                      publicId: series.backdrop_path,
                  }
                : null,
            language: series.spoken_languages
                ? series.spoken_languages
                      .map((l) => l.english_name || l.name)
                      .slice(0, 5)
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
                imdbId: series.external_ids?.imdb_id || imdbId,
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

        return tmdbSeriesDetails;
    } catch (error) {
        console.error(`TMDB API error for IMDb ID ${imdbId}:`, error.message);
        console.error(`TMDB API error for IMDb ID ${imdbId}:`, error);
        return null;
    }
};

// Helper function to fetch series details from OMDb
const fetchFromOmdb = async (imdbId) => {
    try {
        let response;
        try {
            response = await axios.get(OMDB_BASE_URL, {
                params: {
                    apikey: OMDB_API_KEY,
                    i: imdbId,
                    type: "series",
                },
            });
        } catch (error) {
            console.error(
                `OMDb API error for IMDb ID ${imdbId}:`,
                error.message
            );
            console.error(`OMDb API error for IMDb ID ${imdbId}:`, error);
            throw new Error(error.message);
        }

        if (response.data.Response === "False") {
            console.error(
                `OMDb API error for IMDb ID ${imdbId}: ${response.data.Error}`
            );
            return null;
        }

        const series = response.data;

        // Map OMDb data to Series schema
        const omdbSeriesDetails = {
            title: series.Title || "Untitled",
            tmdbId: null,
            slug: series.Title
                ? series.Title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "")
                : `series-${imdbId}`,
            plot: series.Plot || "",
            year: series.Year
                ? parseInt(series.Year.split("–")[0])
                : new Date().getFullYear(),
            released:
                series.Released && series.Released !== "N/A"
                    ? new Date(series.Released)
                    : null,
            runtime:
                series.Runtime && series.Runtime !== "N/A"
                    ? [parseInt(series.Runtime)]
                    : [],
            genres: series.Genre ? series.Genre.split(", ").slice(0, 5) : [],
            creators:
                series.Director && series.Director !== "N/A"
                    ? await Promise.all(
                          series.Director.split(", ")
                              .slice(0, 5)
                              .map(async (name) => {
                                  const person = await models.Person.create({
                                      name,
                                      slug: name
                                          .toLowerCase()
                                          .replace(/[^a-z0-9]+/g, "-")
                                          .replace(/(^-|-$)/g, ""),
                                      professions: ["Creator"],
                                      isActive: true,
                                      createdBy: null,
                                      updatedBy: null,
                                  });
                                  return person._id;
                              })
                      )
                    : [],
            cast:
                series.Actors && series.Actors !== "N/A"
                    ? await Promise.all(
                          series.Actors.split(", ")
                              .slice(0, 50)
                              .map(async (name) => {
                                  const person = await models.Person.create({
                                      name,
                                      slug: name
                                          .toLowerCase()
                                          .replace(/[^a-z0-9]+/g, "-")
                                          .replace(/(^-|-$)/g, ""),
                                      professions: ["Actor"],
                                      isActive: true,
                                      createdBy: null,
                                      updatedBy: null,
                                  });
                                  return { person: person._id, character: "" };
                              })
                      )
                    : [],
            poster:
                series.Poster && series.Poster !== "N/A"
                    ? { url: series.Poster, publicId: series.Poster }
                    : null,
            backdrop: null,
            language: series.Language
                ? series.Language.split(", ").slice(0, 5)
                : [],
            country: series.Country ? series.Country.split(", ") : [],
            rated:
                series.Rated && series.Rated !== "N/A"
                    ? series.Rated
                    : "Unrated",
            production: {
                companies:
                    series.Production && series.Production !== "N/A"
                        ? await Promise.all(
                              series.Production.split(", ").map(async (name) => {
                                  const company =
                                      await models.ProductionCompany.create({
                                          name,
                                          slug: name
                                              .toLowerCase()
                                              .replace(/[^a-z0-9]+/g, "-")
                                              .replace(/(^-|-$)/g, ""),
                                          isActive: true,
                                          createdBy: null,
                                          updatedBy: null,
                                      });
                                  return company._id;
                              })
                          )
                        : [],
                networks: [],
                studios: [],
                distributors: [],
            },
            references: {
                tmdbId: null,
                imdbId: series.imdbID || imdbId,
            },
            keywords: series.Plot ? series.Plot.split(" ").slice(0, 20) : [],
            seasons: series.totalSeasons ? parseInt(series.totalSeasons) : 1,
            episodes: null,
            seasonsDetails: [],
            status: series.Status || "Ongoing",
            seriesType: "Other",
            ratings: {
                imdb: {
                    score:
                        series.imdbRating && series.imdbRating !== "N/A"
                            ? parseFloat(series.imdbRating)
                            : 0,
                    votes:
                        series.imdbVotes && series.imdbVotes !== "N/A"
                            ? parseInt(series.imdbVotes.replace(/,/g, ""))
                            : 0,
                },
            },
            isActive: true,
            isVerified: false,
            createdBy: null,
            updatedBy: null,
        };

        return omdbSeriesDetails;
    } catch (error) {
        console.error(`OMDb API error for IMDb ID ${imdbId}:`, error.message);
        console.error(`OMDb API error for IMDb ID ${imdbId}:`, error);
        return null;
    }
};

// Helper function to fetch series details from TMDB
const fetchFromTmdb = async (tmdbId) => {
    try {
        let response;
        try {
            response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    append_to_response:
                        "credits,content_ratings,images,keywords,external_ids",
                },
                headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
            });
        } catch (error) {
            console.error(
                `TMDB API error for series ${tmdbId}:`,
                error.message
            );
            console.error(`TMDB API error for series ${tmdbId}:`, error);
            throw new Error(error.message);
        }

        const series = response.data;
        if (!series || !series.name) {
            console.error(`No valid series data for TMDB ID ${tmdbId}`);
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
                      return personId
                          ? { person: personId, character: actor.character || "" }
                          : null;
                  })
              )
            : [];
        const validCast = cast.filter((c) => c !== null);

        // Map production companies
        const productionCompanies = series.production_companies
            ? await Promise.all(
                  series.production_companies.map((c) =>
                      getOrCreateProductionCompany(c, null)
                  )
              )
            : [];
        const validCompanies = productionCompanies.filter((c) => c !== null);

        // Map studios (assume same as production companies for now)
        const studios = validCompanies;

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
        const tmdbSeriesDetails = {
            title: series.name,
            tmdbId: series.id.toString(),
            slug: series.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            plot: series.overview || "",
            year: series.first_air_date
                ? parseInt(series.first_air_date.split("-")[0])
                : new Date().getFullYear(),
            released: series.first_air_date
                ? new Date(series.first_air_date)
                : null,
            runtime: series.episode_run_time || [],
            genres: series.genres
                ? series.genres.map((g) => g.name).slice(0, 5)
                : [],
            creators: validCreators,
            cast: validCast.length > 0 ? validCast : [],
            poster: series.poster_path
                ? {
                      url: `https://image.tmdb.org/t/p/w500${series.poster_path}`,
                      publicId: series.poster_path,
                  }
                : null,
            backdrop: series.backdrop_path
                ? {
                      url: `https://image.tmdb.org/t/p/w500${series.backdrop_path}`,
                      publicId: series.backdrop_path,
                  }
                : null,
            language: series.spoken_languages
                ? series.spoken_languages
                      .map((l) => l.english_name || l.name)
                      .slice(0, 5)
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

        return tmdbSeriesDetails;
    } catch (error) {
        console.error(`TMDB API error for series ${tmdbId}:`, error.message);
        console.error(`TMDB API error for series ${tmdbId}:`, error);
        return null;
    }
};

// Service to get series details by seriesId or tmdbId
const getSeriesDetails = async ({ id, userId }) => {
    if (!id) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, series ID ya TMDB ID toh daal!"
        );
    }

    // Ensure seriesId is a string
    id = id.toString();

    // Check if seriesId is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(id);
    console.log(`getSeriesDetails: isValidObjectId: ${isValidObjectId}`);
    console.log(
        `getSeriesDetails: Querying with seriesId: ${id}, isValidObjectId: ${mongoose.isValidObjectId(id)}`
    );

    // Query the database
    let query = {};
    if (isValidObjectId) {
        try {
            query = {
                $or: [
                    { _id: id },
                    { "references.tmdbId": id },
                    { "references.imdbId": id },
                ],
            };
        } catch (error) {
            console.log("query construction with objectId failed:", error);
            console.log("setting fallback query object");
            query = {
                $or: [
                    { "references.tmdbId": id },
                    { "references.imdbId": id },
                ],
            };
        }
    } else {
        query = {
            $or: [
                { "references.tmdbId": id },
                { "references.imdbId": id },
            ],
        };
    }

    console.log(`getSeriesDetails: Executing query: ${JSON.stringify(query)}`);
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
        console.log(`getSeriesDetails: Found series in database: ${series._id}`);
        return series;
    }

    // Fetch from TMDB by TMDB ID
    console.log(`getSeriesDetails: Fetching from TMDB with ID: ${id}`);
    let tmdbSeriesDetails = await fetchFromTmdb(id);
    if (tmdbSeriesDetails) {
        tmdbSeriesDetails.createdBy = userId || null;
        tmdbSeriesDetails.updatedBy = userId || null;
        try {
            const newSeries = await models.Series.create(tmdbSeriesDetails);
            console.log(
                `getSeriesDetails: Saved new series to database: ${newSeries._id}`
            );
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
            console.error("Error saving series to database:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `Series database mein save karne mein gadbad: ${error.message}`
            );
        }
    }

    // Retry with IMDb ID using TMDB
    console.log(`getSeriesDetails: Fetching from TMDB by IMDb ID: ${id}`);
    tmdbSeriesDetails = await fetchFromTmdbByImdb(id);
    if (tmdbSeriesDetails) {
        tmdbSeriesDetails.createdBy = userId || null;
        tmdbSeriesDetails.updatedBy = userId || null;
        try {
            const newSeries = await models.Series.create(tmdbSeriesDetails);
            console.log(
                `getSeriesDetails: Saved new series to database: ${newSeries._id}`
            );
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
            console.error("Error saving series to database:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `Series database mein save karne mein gadbad: ${error.message}`
            );
        }
    }

    // Fallback to OMDb by IMDb ID
    console.log(`getSeriesDetails: Fetching from OMDb with ID: ${id}`);
    const omdbSeriesDetails = await fetchFromOmdb(id);
    if (omdbSeriesDetails) {
        omdbSeriesDetails.createdBy = userId || null;
        omdbSeriesDetails.updatedBy = userId || null;
        try {
            const newSeries = await models.Series.create(omdbSeriesDetails);
            console.log(
                `getSeriesDetails: Saved new series to database: ${newSeries._id}`
            );
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
            console.error("Error saving series to database:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `Series database mein save karne mein gadbad: ${error.message}`
            );
        }
    }

    console.log(`getSeriesDetails: Series not found for ID: ${id}`);
    throw new ApiError(httpStatus.NOT_FOUND, "Abe, yeh series nahi mili!");
};

const seriesService = {
    getSeriesDetails,
};

export default seriesService;