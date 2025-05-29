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

    let person = await models.Person.findOne({
        tmdbId: tmdbPerson.id.toString(),
    });

    try {
        const response = await axios.get(
            `${TMDB_BASE_URL}/person/${tmdbPerson.id}`,
            {
                params: { api_key: TMDB_API_KEY },
                headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
            }
        );

        const personData = response.data;
        const personDetails = {
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
        };

        if (!person) {
            person = await models.Person.create(personDetails);
        } else {
            await person.updateOne(personDetails);
        }
        return person._id;
    } catch (error) {
        if (!person) {
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
        }
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
        const response = await axios.get(
            `${TMDB_BASE_URL}/company/${tmdbCompany.id}`,
            {
                params: { api_key: TMDB_API_KEY },
                headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
            }
        );

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
        const findResponse = await axios.get(
            `${TMDB_BASE_URL}/find/${imdbId}`,
            {
                params: { api_key: TMDB_API_KEY, external_source: "imdb_id" },
                headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
            }
        );

        const movieResult = findResponse.data.movie_results[0];
        if (!movieResult || !movieResult.id) return null;

        const response = await axios.get(
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

        const movie = response.data;
        if (!movie || !movie.title) return null;

        const directors =
            movie.credits?.crew
                ?.filter((c) => c.job === "Director")
                .slice(0, 5) || [];
        const directorIds = await Promise.all(
            directors.map((d) => getOrCreatePerson(d, null))
        );
        const validDirectors = directorIds.filter((id) => id !== null);

        const writers =
            movie.credits?.crew
                ?.filter((c) => c.job === "Writer" || c.job === "Screenplay")
                .slice(0, 5) || [];
        const writerIds = await Promise.all(
            writers.map((w) => getOrCreatePerson(w, null))
        );
        const validWriters = writerIds.filter((id) => id !== null);

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

        const productionCompanies = movie.production_companies
            ? await Promise.all(
                  movie.production_companies.map((c) =>
                      getOrCreateProductionCompany(c, null)
                  )
              )
            : [];
        const validCompanies = productionCompanies.filter((c) => c !== null);

        const studios = validCompanies;
        const distributors = [];

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
            tmdbMovieDetails.runtime = movie.runtime;
        }
        return tmdbMovieDetails;
    } catch (error) {
        return null;
    }
};

// Helper function to fetch movie details from OMDb
const fetchFromOmdb = async (imdbId) => {
    try {
        const response = await axios.get(OMDB_BASE_URL, {
            params: { apikey: OMDB_API_KEY, i: imdbId, type: "movie" },
        });

        if (response.data.Response === "False") return null;

        const movie = response.data;

        const omdbMovieDetails = {
            title: movie.Title || "Untitled",
            tmdbId: null,
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
            references: { tmdbId: null, imdbId: movie.imdbID || imdbId },
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
            omdbMovieDetails.runtime = parseInt(movie.Runtime);
        }
        return omdbMovieDetails;
    } catch (error) {
        return null;
    }
};

// Helper function to fetch movie details from TMDB
const fetchFromTmdb = async (tmdbId) => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
            params: {
                api_key: TMDB_API_KEY,
                append_to_response:
                    "credits,release_dates,images,keywords,external_ids",
            },
            headers: { Authorization: `Bearer ${TMDB_AUTH_TOKEN}` },
        });

        const movie = response.data;
        if (!movie || !movie.title) return null;

        const directors =
            movie.credits?.crew
                ?.filter((c) => c.job === "Director")
                .slice(0, 5) || [];
        const directorIds = await Promise.all(
            directors.map((d) => getOrCreatePerson(d, null))
        );
        const validDirectors = directorIds.filter((id) => id !== null);

        const writers =
            movie.credits?.crew
                ?.filter((c) => c.job === "Writer" || c.job === "Screenplay")
                .slice(0, 5) || [];
        const writerIds = await Promise.all(
            writers.map((w) => getOrCreatePerson(w, null))
        );
        const validWriters = writerIds.filter((id) => id !== null);

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

        const productionCompanies = movie.production_companies
            ? await Promise.all(
                  movie.production_companies.map((c) =>
                      getOrCreateProductionCompany(c, null)
                  )
              )
            : [];
        const validCompanies = productionCompanies.filter((c) => c !== null);

        const studios = validCompanies;
        const distributors = [];

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
            tmdbMovieDetails.runtime = movie.runtime;
        }
        return tmdbMovieDetails;
    } catch (error) {
        return null;
    }
};

// Service to get movie details by movieId or tmdbId
const getMovieDetails = async ({ id, userId }) => {
    if (!id) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Movie ID or TMDB ID is required"
        );
    }

    const isValidObjectId = mongoose.isValidObjectId(id);
    let query = isValidObjectId
        ? {
              $or: [
                  { _id: id },
                  { "references.tmdbId": id },
                  { "references.imdbId": id },
              ],
          }
        : { $or: [{ "references.tmdbId": id }, { "references.imdbId": id }] };

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

    if (movie) return movie;

    let movieDetails = await fetchFromTmdb(id);
    if (movieDetails) {
        movieDetails.createdBy = userId || null;
        movieDetails.updatedBy = userId || null;
        try {
            const newMovie = await models.Movie.create(movieDetails);
            return await models.Movie.findById(newMovie._id)
                .populate("director")
                .populate("writers")
                .populate("cast.person")
                .populate("production.companies")
                .populate("production.studios")
                .populate("production.distributors")
                .populate("createdBy")
                .populate("updatedBy")
                .lean();
        } catch (error) {
            console.log(error)
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Failed to save movie to database"
            );
        }
    }

    movieDetails = await fetchFromTmdbByImdb(id);
    if (movieDetails) {
        movieDetails.createdBy = userId || null;
        movieDetails.updatedBy = userId || null;
        try {
            const newMovie = await models.Movie.create(movieDetails);
            return await models.Movie.findById(newMovie._id)
                .populate("director")
                .populate("writers")
                .populate("cast.person")
                .populate("production.companies")
                .populate("production.studios")
                .populate("production.distributors")
                .populate("createdBy")
                .populate("updatedBy")
                .lean();
        } catch (error) {
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Failed to save movie to database"
            );
        }
    }

    movieDetails = await fetchFromOmdb(id);
    if (movieDetails) {
        movieDetails.createdBy = userId || null;
        movieDetails.updatedBy = userId || null;
        try {
            const newMovie = await models.Movie.create(movieDetails);
            return await models.Movie.findById(newMovie._id)
                .populate("director")
                .populate("writers")
                .populate("cast.person")
                .populate("production.companies")
                .populate("production.studios")
                .populate("production.distributors")
                .populate("createdBy")
                .populate("updatedBy")
                .lean();
        } catch (error) {
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Failed to save movie to database"
            );
        }
    }

    throw new ApiError(httpStatus.NOT_FOUND, "Movie not found");
};

const movieService = {
    getMovieDetails,
};

export default movieService;
            