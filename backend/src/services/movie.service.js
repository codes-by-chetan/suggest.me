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
            console.error(
                `TMDB API error for person ${tmdbPerson.id}:`,
                error
            );
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
            professions: [tmdbPerson.known_for_department || "Actor"],
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
            console.error(
                `TMDB API error for company ${tmdbCompany.id}:`,
                error
            );
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

// Helper function to fetch movie by IMDb ID from TMDB
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

            const movieResult = findResponse.data.movie_results[0];
            if (!movieResult || !movieResult.id) {
                console.error(`No movie found for IMDb ID ${imdbId} in TMDB`);
                return null;
            }

            response = await axios.get(
                `${TMDB_BASE_URL}/movie/${movieResult.id}`,
                {
                    params: {
                        api_key: TMDB_API_KEY,
                        append_to_response:
                            "credits,release_dates,images,keywords,external_ids",
                    },
                    headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
                }
            );
        } catch (error) {
            console.error(
                `TMDB API error for IMDb ID ${imdbId}:`,
                error.message
            );
            console.error(
                `TMDB API error for IMDb ID ${imdbId}:`,
                error
            );
            throw new Error(error.message);
        }

        const movie = response.data;
        if (!movie || !movie.title) {
            console.error(`No valid movie data for TMDB ID ${movieResult.id}`);
            return null;
        }

        // Map directors
        const directors =
            movie.credits?.crew
                ?.filter((c) => c.job === "Director")
                .slice(0, 5) || [];
        const directorIds = await Promise.all(
            directors.map((d) => getOrCreatePerson(d, null))
        );
        const validDirectors = directorIds.filter((id) => id !== null);

        // Map writers
        const writers =
            movie.credits?.crew
                ?.filter((c) => c.job === "Writer" || c.job === "Screenplay")
                .slice(0, 5) || [];
        const writerIds = await Promise.all(
            writers.map((w) => getOrCreatePerson(w, null))
        );
        const validWriters = writerIds.filter((id) => id !== null);

        // Map cast
        const cast = movie.credits?.cast
            ? await Promise.all(
                  movie.credits.cast.slice(0, 50).map(async (actor) => {
                      const personId = await getOrCreatePerson(actor, null);
                      return personId
                          ? {
                                person: personId,
                                character: actor.character || "",
                            }
                          : null;
                  })
              )
            : [];
        const validCast = cast.filter((c) => c !== null);

        // Map production companies
        const productionCompanies = movie.production_companies
            ? await Promise.all(
                  movie.production_companies.map((c) =>
                      getOrCreateProductionCompany(c, null)
                  )
              )
            : [];
        const validCompanies = productionCompanies.filter((c) => c !== null);

        // Map studios and distributors (placeholder)
        const studios = validCompanies;
        const distributors = [];

        // Map TMDB data to Movie schema
        const tmdbMovieDetails = {
            title: movie.title,
            tmdbId: movie.id.toString(),
            slug: movie.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            plot: movie.overview || "",
            year: movie.release_date
                ? parseInt(movie.release_date.split("-")[0])
                : new Date().getFullYear(),
            released: movie.release_date ? new Date(movie.release_date) : null,
            genres: movie.genres
                ? movie.genres.map((g) => g.name).slice(0, 5)
                : [],
            director: validDirectors,
            writers: validWriters,
            cast: validCast.length > 0 ? validCast : [],
            poster: movie.poster_path
                ? {
                      url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                      publicId: movie.poster_path,
                  }
                : null,
            backdrop: movie.backdrop_path
                ? {
                      url: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`,
                      publicId: movie.backdrop_path,
                  }
                : null,
            language: movie.spoken_languages
                ? movie.spoken_languages
                      .map((l) => l.english_name || l.name)
                      .slice(0, 5)
                : [],
            country: movie.production_countries
                ? movie.production_countries.map((c) => c.name)
                : [],
            rated:
                movie.release_dates?.results?.find((r) => r.iso_3166_1 === "US")
                    ?.release_dates[0]?.certification || "Unrated",
            production: {
                companies: validCompanies,
                studios: studios,
                distributors: distributors,
            },
            references: {
                tmdbId: movie.id.toString(),
                imdbId: movie.imdb_id || movie.external_ids?.imdb_id || imdbId,
            },
            keywords: movie.keywords?.keywords
                ? movie.keywords.keywords.map((k) => k.name).slice(0, 20)
                : [],
            boxOffice: {
                budget: movie.budget ? `$${movie.budget}` : null,
                grossUSA: null,
                grossWorldwide: movie.revenue ? `$${movie.revenue}` : null,
            },
            ratings: {
                imdb: {
                    score:
                        typeof movie.vote_average === "number"
                            ? movie.vote_average
                            : 0,
                    votes:
                        typeof movie.vote_count === "number"
                            ? movie.vote_count
                            : 0,
                },
            },
            isActive: true,
            isVerified: false,
            createdBy: null,
            updatedBy: null,
        };
        if (typeof movie.runtime === "number") {
            tmdbMovieDetails["runtime"] = movie.runtime;
        }
        return tmdbMovieDetails;
    } catch (error) {
        console.error(`TMDB API error for IMDb ID ${imdbId}:`, error.message);
        console.error(`TMDB API error for IMDb ID ${imdbId}:`, error);
        return null;
    }
};

// Helper function to fetch movie details from OMDb
const fetchFromOmdb = async (imdbId) => {
    try {
        const response = await axios.get(OMDB_BASE_URL, {
            params: {
                apikey: OMDB_API_KEY,
                i: imdbId,
                type: "movie",
            },
        });

        if (response.data.Response === "False") {
            console.error(
                `OMDb API error for IMDb ID ${imdbId}: ${response.data.Error}`
            );
            return null;
        }

        const movie = response.data;

        // Map OMDb data to Movie schema
        let omdbMovieDetails = {
            title: movie.Title || "Untitled",
            tmdbId: null, // OMDb doesn't provide TMDB ID
            slug: movie.Title
                ? movie.Title.toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "")
                : `movie-${imdbId}`,
            plot: movie.Plot || "",
            year: movie.Year
                ? parseInt(movie.Year.split("–")[0])
                : new Date().getFullYear(),
            released:
                movie.Released && movie.Released !== "N/A"
                    ? new Date(movie.Released)
                    : null,
            genres: movie.Genre ? movie.Genre.split(", ").slice(0, 5) : [],
            director:
                movie.Director && movie.Director !== "N/A"
                    ? await Promise.all(
                          movie.Director.split(", ")
                              .slice(0, 5)
                              .map(async (name) => {
                                  const person = await models.Person.create({
                                      name,
                                      slug: name
                                          .toLowerCase()
                                          .replace(/[^a-z0-9]+/g, "-")
                                          .replace(/(^-|-$)/g, ""),
                                      professions: ["Director"],
                                      isActive: true,
                                      createdBy: null,
                                      updatedBy: null,
                                  });
                                  return person._id;
                              })
                      )
                    : [],
            writers:
                movie.Writer && movie.Writer !== "N/A"
                    ? await Promise.all(
                          movie.Writer.split(", ")
                              .slice(0, 5)
                              .map(async (name) => {
                                  const person = await models.Person.create({
                                      name,
                                      slug: name
                                          .toLowerCase()
                                          .replace(/[^a-z0-9]+/g, "-")
                                          .replace(/(^-|-$)/g, ""),
                                      professions: ["Writer"],
                                      isActive: true,
                                      createdBy: null,
                                      updatedBy: null,
                                  });
                                  return person._id;
                              })
                      )
                    : [],
            cast:
                movie.Actors && movie.Actors !== "N/A"
                    ? await Promise.all(
                          movie.Actors.split(", ")
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
                movie.Poster && movie.Poster !== "N/A"
                    ? { url: movie.Poster, publicId: movie.Poster }
                    : null,
            backdrop: null,
            language: movie.Language
                ? movie.Language.split(", ").slice(0, 5)
                : [],
            country: movie.Country ? movie.Country.split(", ") : [],
            rated:
                movie.Rated && movie.Rated !== "N/A" ? movie.Rated : "Unrated",
            production: {
                companies:
                    movie.Production && movie.Production !== "N/A"
                        ? await Promise.all(
                              movie.Production.split(", ").map(async (name) => {
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
                studios: [],
                distributors: [],
            },
            references: {
                tmdbId: null,
                imdbId: movie.imdbID || imdbId,
            },
            keywords: movie.Plot ? movie.Plot.split(" ").slice(0, 20) : [],
            boxOffice: {
                budget:
                    movie.BoxOffice && movie.BoxOffice !== "N/A"
                        ? movie.BoxOffice
                        : null,
                grossUSA: null,
                grossWorldwide: null,
            },
            ratings: {
                imdb: {
                    score:
                        movie.imdbRating && movie.imdbRating !== "N/A"
                            ? parseFloat(movie.imdbRating)
                            : 0,
                    votes:
                        movie.imdbVotes && movie.imdbVotes !== "N/A"
                            ? parseInt(movie.imdbVotes.replace(/,/g, ""))
                            : 0,
                },
            },
            isActive: true,
            isVerified: false,
            createdBy: null,
            updatedBy: null,
        };
        if (movie?.Runtime && movie?.Runtime !== "N/A") {
            omdbMovieDetails["runtime"] = parseInt(movie.Runtime);
        }
        return omdbMovieDetails;
    } catch (error) {
        console.error(`OMDb API error for IMDb ID ${imdbId}:`, error.message);
        console.error(`OMDb API error for IMDb ID ${imdbId}:`, error);
        return null;
    }
};

// Helper function to fetch movie details from TMDB
const fetchFromTmdb = async (tmdbId) => {
    try {
        let response;
        try {
            response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    append_to_response:
                        "credits,release_dates,images,keywords,external_ids",
                },
                headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
            });
        } catch (error) {
            console.error(`TMDB API error for movie ${tmdbId}:`, error.message);
            console.error(
                `TMDB API error for IMDb ID ${tmdbId}:`,
                error
            );
            throw new Error(error.message);
        }

        const movie = response.data;
        if (!movie || !movie.title) {
            console.error(`No valid movie data for TMDB ID ${tmdbId}`);
            return null;
        }

        // Map directors
        const directors =
            movie.credits?.crew
                ?.filter((c) => c.job === "Director")
                .slice(0, 5) || [];
        const directorIds = await Promise.all(
            directors.map((d) => getOrCreatePerson(d, null))
        );
        const validDirectors = directorIds.filter((id) => id !== null);

        // Map writers
        const writers =
            movie.credits?.crew
                ?.filter((c) => c.job === "Writer" || c.job === "Screenplay")
                .slice(0, 5) || [];
        const writerIds = await Promise.all(
            writers.map((w) => getOrCreatePerson(w, null))
        );
        const validWriters = writerIds.filter((id) => id !== null);

        // Map cast
        const cast = movie.credits?.cast
            ? await Promise.all(
                  movie.credits.cast.slice(0, 50).map(async (actor) => {
                      const personId = await getOrCreatePerson(actor, null);
                      return personId
                          ? {
                                person: personId,
                                character: actor.character || "",
                            }
                          : null;
                  })
              )
            : [];
        const validCast = cast.filter((c) => c !== null);

        // Map production companies
        const productionCompanies = movie.production_companies
            ? await Promise.all(
                  movie.production_companies.map((c) =>
                      getOrCreateProductionCompany(c, null)
                  )
              )
            : [];
        const validCompanies = productionCompanies.filter((c) => c !== null);

        // Map studios and distributors (placeholder)
        const studios = validCompanies;
        const distributors = [];

        // Map TMDB data to Movie schema
        let tmdbMovieDetails = {
            title: movie.title,
            tmdbId: movie.id.toString(),
            slug: movie.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
            plot: movie.overview || "",
            year: movie.release_date
                ? parseInt(movie.release_date.split("-")[0])
                : new Date().getFullYear(),
            released: movie.release_date ? new Date(movie.release_date) : null,
            runtime: typeof movie.runtime === "number" ? movie.runtime : null,
            genres: movie.genres
                ? movie.genres.map((g) => g.name).slice(0, 5)
                : [],
            director: validDirectors,
            writers: validWriters,
            cast: validCast.length > 0 ? validCast : [],
            poster: movie.poster_path
                ? {
                      url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                      publicId: movie.poster_path,
                  }
                : null,
            backdrop: movie.backdrop_path
                ? {
                      url: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`,
                      publicId: movie.backdrop_path,
                  }
                : null,
            language: movie.spoken_languages
                ? movie.spoken_languages
                      .map((l) => l.english_name || l.name)
                      .slice(0, 5)
                : [],
            country: movie.production_countries
                ? movie.production_countries.map((c) => c.name)
                : [],
            rated:
                movie.release_dates?.results?.find((r) => r.iso_3166_1 === "US")
                    ?.release_dates[0]?.certification || "Unrated",
            production: {
                companies: validCompanies,
                studios: studios,
                distributors: distributors,
            },
            references: {
                tmdbId: movie.id.toString(),
                imdbId: movie.imdb_id || movie.external_ids?.imdb_id || "",
            },
            keywords: movie.keywords?.keywords
                ? movie.keywords.keywords.map((k) => k.name).slice(0, 20)
                : [],
            boxOffice: {
                budget: movie.budget ? `$${movie.budget}` : null,
                grossUSA: null,
                grossWorldwide: movie.revenue ? `$${movie.revenue}` : null,
            },
            ratings: {
                imdb: {
                    score:
                        typeof movie.vote_average === "number"
                            ? movie.vote_average
                            : 0,
                    votes:
                        typeof movie.vote_count === "number"
                            ? movie.vote_count
                            : 0,
                },
            },
            isActive: true,
            isVerified: false,
            createdBy: null,
            updatedBy: null,
        };
        if (typeof movie.runtime === "number") {
            tmdbMovieDetails["runtime"] = movie.runtime;
        }
        return tmdbMovieDetails;
    } catch (error) {
        console.error(`TMDB API error for movie ${tmdbId}:`, error.message);
        console.error(`TMDB API error for IMDb ID ${tmdbId}:`, error);
        return null;
    }
};

// Service to get movie details by movieId or tmdbId
const getMovieDetails = async ({ id, userId }) => {
    if (!id) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Bhai, movie ID ya TMDB ID toh daal!"
        );
    }

    // Ensure movieId is a string
    // id = movieId.toString();
    // Check if movieId is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(id);
    console.log("isValidObjectId :", isValidObjectId);
    console.log(
        `getMovieDetails: Querying with movieId: ${id}, isValidObjectId: ${mongoose.isValidObjectId(id)}`
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
            console.log("query construction with objectId failed  :", error);
            console.log("setting fallback query object  ");
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

    console.log(`getMovieDetails: Executing query: ${JSON.stringify(query)}`);
    let movie = await models.Movie.findOne(query)
        .populate("director")
        .populate("writers")
        .populate("cast.person")
        .populate("production.companies")
        .populate("production.studios")
        .populate("production.distributors")
        .populate("createdBy")
        .populate("updatedBy")
        .lean();

    if (movie) {
        console.log(`getMovieDetails: Found movie in database: ${movie._id}`);
        return movie;
    }

    // Fetch from TMDB by TMDB ID
    console.log(`getMovieDetails: Fetching from TMDB with ID: ${id}`);
    let tmdbMovieDetails = await fetchFromTmdb(id);
    if (tmdbMovieDetails) {
        tmdbMovieDetails.createdBy = userId || null;
        tmdbMovieDetails.updatedBy = userId || null;
        try {
            const newMovie = await models.Movie.create(tmdbMovieDetails);
            console.log(
                `getMovieDetails: Saved new movie to database: ${newMovie._id}`
            );
            const populatedMovie = await models.Movie.findById(newMovie._id)
                .populate("director")
                .populate("writers")
                .populate("cast.person")
                .populate("production.companies")
                .populate("production.studios")
                .populate("production.distributors")
                .populate("createdBy")
                .populate("updatedBy")
                .lean();
            return populatedMovie;
        } catch (error) {
            console.error("Error saving movie to database:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `Movie database mein save karne mein gadbad: ${error.message}`
            );
        }
    }

    // Retry with IMDb ID using TMDB
    console.log(`getMovieDetails: Fetching from TMDB by IMDb ID: ${id}`);
    tmdbMovieDetails = await fetchFromTmdbByImdb(id);
    if (tmdbMovieDetails) {
        tmdbMovieDetails.createdBy = userId || null;
        tmdbMovieDetails.updatedBy = userId || null;
        try {
            const newMovie = await models.Movie.create(tmdbMovieDetails);
            console.log(
                `getMovieDetails: Saved new movie to database: ${newMovie._id}`
            );
            const populatedMovie = await models.Movie.findById(newMovie._id)
                .populate("director")
                .populate("writers")
                .populate("cast.person")
                .populate("production.companies")
                .populate("production.studios")
                .populate("production.distributors")
                .populate("createdBy")
                .populate("updatedBy")
                .lean();
            return populatedMovie;
        } catch (error) {
            console.error("Error saving movie to database:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `Movie database mein save karne mein gadbad: ${error.message}`
            );
        }
    }

    // Fallback to OMDb by IMDb ID
    console.log(`getMovieDetails: Fetching from OMDb with ID: ${id}`);
    const omdbMovieDetails = await fetchFromOmdb(id);
    if (omdbMovieDetails) {
        omdbMovieDetails.createdBy = userId || null;
        omdbMovieDetails.updatedBy = userId || null;
        try {
            const newMovie = await models.Movie.create(omdbMovieDetails);
            console.log(
                `getMovieDetails: Saved new movie to database: ${newMovie._id}`
            );
            const populatedMovie = await models.Movie.findById(newMovie._id)
                .populate("director")
                .populate("writers")
                .populate("cast.person")
                .populate("production.companies")
                .populate("production.studios")
                .populate("production.distributors")
                .populate("createdBy")
                .populate("updatedBy")
                .lean();
            return populatedMovie;
        } catch (error) {
            console.error("Error saving movie to database:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `Movie database mein save karne mein gadbad: ${error.message}`
            );
        }
    }

    console.log(`getMovieDetails: Movie not found for ID: ${id}`);
    throw new ApiError(httpStatus.NOT_FOUND, "Abe, yeh movie nahi mili!");
};

const movieService = {
    getMovieDetails,
};

export default movieService;
