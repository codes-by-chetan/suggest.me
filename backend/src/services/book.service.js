import mongoose from "mongoose";
import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import axios from "axios";
import config from "../config/env.config.js";
import { slugify as translitSlug } from "transliteration";
import OpenAI from "openai";
import { load } from "cheerio";
import { io } from "../index.js";
import { randomUUID } from "crypto";

const openai = new OpenAI({ apiKey: config.openAi.apiKey });
const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1";
const OPEN_LIBRARY_BASE_URL = "https://openlibrary.org";
const WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php";
const SERPAPI_BASE_URL = "https://serpapi.com/search.json";

// Utility: Slug generator
const generateSlug = (name, fallback = "unknown") => {
    try {
        const raw = name && typeof name === "string" && name.trim() ? name.trim() : fallback;
        const slug = translitSlug(raw, { lowercase: true, separator: "-" });
        return slug.length ? slug : fallback;
    } catch (error) {
        console.error(`Error generating slug for ${name}:`, error.message);
        return fallback;
    }
};

// Utility: Detect ID type
const isOpenLibraryId = (id) => typeof id === "string" && id.startsWith("OL");

// Fetch from Open Library
const fetchFromOpenLibrary = async (id) => {
    try {
        console.debug(`Fetching Open Library data for ID: ${id}`);
        const response = await axios.get(`${OPEN_LIBRARY_BASE_URL}/works/${id}.json`, { timeout: 5000 });
        const work = response.data;
        if (!work.title) {
            console.warn(`No title found for Open Library ID: ${id}`);
            return null;
        }

        // Fetch author details
        let authorIds = [];
        if (work.authors?.length) {
            const authorPromises = work.authors.map(async (author) => {
                const authorKey = author.author?.key?.split("/").pop();
                if (authorKey) {
                    try {
                        const authorResponse = await axios.get(`${OPEN_LIBRARY_BASE_URL}/authors/${authorKey}.json`);
                        const authorData = authorResponse.data;
                        const authorName = authorData.name || authorData.personal_name || "Unknown Author";
                        return await models.Person.findOneAndUpdate(
                            { name: authorName },
                            {
                                name: authorName,
                                slug: generateSlug(authorName, "unknown-author"),
                                biography: authorData.bio?.value || authorData.bio || "",
                                professions: ["Author"],
                                isActive: true,
                                createdBy: null,
                                updatedBy: null,
                            },
                            { upsert: true, new: true }
                        );
                    } catch (error) {
                        console.error(`Failed to fetch Open Library author ${authorKey}: ${error.message}`);
                        return null;
                    }
                }
                return null;
            });
            authorIds = (await Promise.all(authorPromises)).filter(Boolean).map(a => a._id);
        }

        // Fetch publisher
        let publisherId = null;
        if (work.publishers?.[0]) {
            const publisherName = work.publishers[0];
            const publisher = await models.Publisher.findOneAndUpdate(
                { name: publisherName },
                {
                    name: publisherName,
                    slug: generateSlug(publisherName, "unknown-publisher"),
                    isActive: true,
                    createdBy: null,
                    updatedBy: null,
                },
                { upsert: true, new: true }
            );
            publisherId = publisher._id;
        }

        // Map to Book model schema
        const publishedYear = work.first_publish_date 
            ? parseInt(work.first_publish_date.split("-")[0]) 
            : (work.created?.value ? parseInt(work.created.value.split("-")[0]) : new Date().getFullYear());

        const bookDetails = {
            title: work.title,
            openLibraryId: id,
            slug: generateSlug(work.title),
            author: authorIds.length ? authorIds : null,
            publisher: publisherId,
            description: typeof work.description === 'object' ? work.description.value : work.description || "",
            publishedYear: isNaN(publishedYear) ? new Date().getFullYear() : publishedYear,
            genres: work.subjects?.slice(0, 5) || [],
            language: work.languages?.[0]?.key?.split("/").pop() || 'en',
            coverImage: work.covers?.[0]
                ? { url: `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg`, publicId: work.covers[0].toString() }
                : { url: "https://via.placeholder.com/500", publicId: "default-cover" },
            bookType: "paperback", // Adjusted to lowercase to match common Mongoose enum
            isActive: true,
            isVerified: false,
            createdBy: null,
            updatedBy: null,
        };
        console.debug(`Fetched Open Library book details for ${id}: ${bookDetails.title}`);
        return bookDetails;
    } catch (error) {
        console.error(`Error in fetchFromOpenLibrary for ${id}: ${error.message}`);
        return null;
    }
};

// Fetch from Google Books
const fetchFromGoogleBooks = async (id) => {
    try {
        console.debug(`Fetching Google Books data for ID: ${id}`);
        const response = await axios.get(`${GOOGLE_BOOKS_BASE_URL}/volumes/${id}`, {
            params: { key: config.google.apiKey },
            timeout: 5000,
        });
        const volume = response.data;
        if (!volume.volumeInfo?.title) {
            console.warn(`No title found for Google Books ID: ${id}`);
            return null;
        }

        let authorIds = [];
        if (volume.volumeInfo.authors?.length) {
            const authorPromises = volume.volumeInfo.authors.map(async (authorName) => {
                return await models.Person.findOneAndUpdate(
                    { name: authorName },
                    {
                        name: authorName,
                        slug: generateSlug(authorName, "unknown-author"),
                        professions: ["Author"],
                        isActive: true,
                        createdBy: null,
                        updatedBy: null,
                    },
                    { upsert: true, new: true }
                );
            });
            authorIds = (await Promise.all(authorPromises)).map(a => a._id);
        }

        let publisherId = null;
        if (volume.volumeInfo.publisher) {
            const publisher = await models.Publisher.findOneAndUpdate(
                { name: volume.volumeInfo.publisher },
                {
                    name: volume.volumeInfo.publisher,
                    slug: generateSlug(volume.volumeInfo.publisher, "unknown-publisher"),
                    isActive: true,
                    createdBy: null,
                    updatedBy: null,
                },
                { upsert: true, new: true }
            );
            publisherId = publisher._id;
        }

        const bookDetails = {
            title: volume.volumeInfo.title,
            googleBooksId: id,
            slug: generateSlug(volume.volumeInfo.title),
            author: authorIds.length ? authorIds : null,
            publisher: publisherId,
            description: volume.volumeInfo.description || "",
            publishedYear: volume.volumeInfo.publishedDate ? parseInt(volume.volumeInfo.publishedDate.split("-")[0]) : new Date().getFullYear(),
            genres: volume.volumeInfo.categories?.slice(0, 5) || [],
            language: volume.volumeInfo.language || 'en',
            coverImage: volume.volumeInfo.imageLinks?.thumbnail
                ? { url: volume.volumeInfo.imageLinks.thumbnail, publicId: id }
                : { url: "https://via.placeholder.com/500", publicId: "default-cover" },
            bookType: "paperback",
            isActive: true,
            isVerified: false,
            createdBy: null,
            updatedBy: null,
        };
        console.debug(`Fetched Google Books details for ${id}: ${bookDetails.title}`);
        return bookDetails;
    } catch (error) {
        console.error(`Error in fetchFromGoogleBooks for ${id}: ${error.message}`);
        return null;
    }
};

// Fetch from Wikidata (stub)
const fetchFromWikidata = async (id) => {
    console.debug(`Wikidata fetch not implemented for ${id}; returning null`);
    return null;
};

// Create book in database
const createBook = async (bookDetails, userId) => {
    try {
        const newBook = await models.Book.create(bookDetails);
        const populatedBook = await models.Book.findById(newBook._id)
            .populate("author")
            .populate("publisher")
            .lean();
        console.debug(`Created new book: ${newBook._id}`);
        return populatedBook;
    } catch (error) {
        console.error(`Failed to create book: ${error.message}`);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to save book to database: ${error.message}`);
    }
};

// Get book details
const getBookDetails = async ({ id, userId }) => {
    try {
        console.debug(`Fetching book details for ID: ${id}`);
        if (!id || typeof id !== "string") {
            throw new ApiError(httpStatus.BAD_REQUEST, "Book ID is required");
        }
        const isOid = mongoose.isValidObjectId(id);
        const q = isOid
            ? { $or: [{ _id: id }, { googleBooksId: id }, { openLibraryId: id }] }
            : { $or: [{ googleBooksId: id }, { openLibraryId: id }] };
        let book = await models.Book.findOne(q)
            .populate("author")
            .populate("publisher")
            .lean();

        if (book) {
            console.debug(`Book found in DB: ${book._id}`);
            setImmediate(() => {
                enrichBookData(book, userId).catch((err) => {
                    console.error(`Background enrichment failed for book ${book._id}:`, err.message);
                });
            });
            return book;
        }

        console.debug(`Book not found in DB, attempting external fetches for: ${id}`);
        let bookDetails = null;
        if (isOpenLibraryId(id)) {
            bookDetails = await fetchFromOpenLibrary(id);
            if (!bookDetails) {
                console.debug(`Open Library fetch failed, trying Google Books for ${id}`);
                bookDetails = await fetchFromGoogleBooks(id);
            }
        } else {
            bookDetails = await fetchFromGoogleBooks(id);
            if (!bookDetails) {
                console.debug(`Google Books fetch failed, trying Open Library for ${id}`);
                bookDetails = await fetchFromOpenLibrary(id);
            }
        }
        if (!bookDetails) {
            bookDetails = await fetchFromWikidata(id);
        }
        if (!bookDetails) {
            console.warn(`Book not found for ${id}`);
            throw new ApiError(httpStatus.NOT_FOUND, "Book not found");
        }
        Object.assign(bookDetails, { createdBy: userId, updatedBy: userId });

        console.debug(`Creating new book for ${id}`);
        return await createBook(bookDetails, userId);
    } catch (error) {
        console.error(`Error in getBookDetails for ${id}:`, error.message);
        throw error instanceof ApiError
            ? error
            : new ApiError(
                  httpStatus.INTERNAL_SERVER_ERROR,
                  `Failed to fetch book details: ${error.message}`
              );
    }
};

// Existing functions (unchanged)
const findMissingFields = (record, modelType) => {
    try {
        const requiredFields = {
            Book: [
                "description",
                "pages",
                "publishedYear",
                "genres",
                "language",
                "coverImage",
            ],
            Person: [
                "birthDate",
                "birthPlace",
                "biography",
                "profileImage",
                "professions",
            ],
            Publisher: [
                "founded",
                "headquarters",
                "website",
                "description",
                "logo",
            ],
            Distributor: [
                "founded",
                "headquarters",
                "website",
                "description",
                "logo",
            ],
            ProductionCompany: [
                "founded",
                "headquarters",
                "website",
                "description",
                "logo",
            ],
        };
        const fields = requiredFields[modelType] || [];
        return fields.filter(
            (f) =>
                !record[f] ||
                (Array.isArray(record[f]) && record[f].length === 0) ||
                (f === "coverImage" &&
                    record[f]?.url?.includes("placeholder")) ||
                (f === "profileImage" && !record[f]?.url) ||
                (f === "logo" && !record[f]?.url)
        );
    } catch (error) {
        console.error(
            `Error finding missing fields for ${modelType}:`,
            error.message
        );
        return [];
    }
};

const searchWeb = async (query, num = 3) => {
    try {
        console.debug(`Searching web for query: ${query}`);
        if (!config.google.serpApiKey) {
            console.warn(`SerpApi key missing for query ${query}`);
            return [];
        }
        const response = await axios.get(SERPAPI_BASE_URL, {
            params: {
                q: query,
                api_key: config.google.serpApiKey,
                num,
            },
            timeout: 5000,
        });
        return response.data.organic_results || [];
    } catch (error) {
        console.error(`Error searching web for ${query}:`, error.message);
        return [];
    }
};

const enrichData = async (record, modelType, query) => {
    try {
        console.debug(`Enriching ${modelType} with ID ${record._id}`);
        const missingFields = findMissingFields(record, modelType);
        if (!missingFields.length) {
            console.debug(`No missing fields for ${modelType} ${record._id}`);
            return;
        }

        const searchQuery = query || `${record.name || record.title} ${modelType.toLowerCase()}`;
        const webResults = await searchWeb(searchQuery);

        const updateData = {};
        for (const field of missingFields) {
            let value = null;
            for (const result of webResults) {
                if (!value && result.snippet) {
                    try {
                        const prompt = `Extract the ${field} for ${searchQuery} from the following text: "${result.snippet}". Provide only the extracted value, or null if not found.`;
                        const completion = await openai.chat.completions.create({
                            model: "gpt-4o-mini",
                            messages: [{ role: "user", content: prompt }],
                            max_tokens: 50,
                        });
                        value = completion.choices[0].message.content.trim() !== "null" ? completion.choices[0].message.content.trim() : null;
                    } catch (error) {
                        console.error(`Error extracting ${field} for ${searchQuery}:`, error.message);
                    }
                }
                if (value) break;
            }
            if (value) {
                updateData[field] = value;
            }
        }

        if (Object.keys(updateData).length) {
            await models[modelType].updateOne({ _id: record._id }, updateData);
            console.debug(`Updated ${modelType} ${record._id} with:`, updateData);

            io.emit(`${modelType.toLowerCase()}:updated`, {
                id: record._id,
                data: updateData,
            });
        }
    } catch (error) {
        console.error(`Error enriching ${modelType} ${record._id}:`, error.message);
    }
};

const enrichBookData = async (book, userId) => {
    try {
        console.debug(`Starting enrichBookData for book ${book._id}`);
        const missingFields = findMissingFields(book, "Book");
        if (!missingFields.length) {
            console.debug(`No missing fields for book ${book._id}`);
            return;
        }

        await enrichData(book, "Book", `${book.title} book`);
        if (missingFields.includes("pages") && !book.pages) {
            try {
                const searchResults = await searchWeb(`${book.title} book page count`);
                let pages = null;
                for (const result of searchResults) {
                    if (result.snippet && /\b(\d+)\s*pages?\b/i.test(result.snippet)) {
                        pages = parseInt(result.snippet.match(/\b(\d+)\s*pages?\b/i)[1]);
                        break;
                    }
                }
                if (pages) {
                    await models.Book.updateOne({ _id: book._id }, { pages });
                    console.debug(`Updated book ${book._id} with pages: ${pages}`);
                    io.emit("book:updated", { id: book._id, data: { pages } });
                }
            } catch (error) {
                console.error(`Error enriching pages for book ${book._id}:`, error.message);
            }
        }
    } catch (error) {
        console.error(`Error in enrichBookData for book ${book._id}:`, error.message);
    }
};

const enrichAllBooks = async () => {
    try {
        console.debug("Starting enrichAllBooks");
        const cursor = models.Book.find({}).lean().cursor();
        for await (const book of cursor) {
            try {
                await enrichBookData(book, null);
            } catch (error) {
                console.warn(`Failed to enrich book ${book._id}:`, error.message);
            }
        }
        console.debug("Completed enrichAllBooks");
    } catch (error) {
        console.error(`Error in enrichAllBooks:`, error.message);
    }
};

const fetchAuthorsFromGoogleBooks = async (title) => {
    try {
        console.debug(`Fetching authors from Google Books for title: ${title}`);
        const response = await axios.get(`${GOOGLE_BOOKS_BASE_URL}/volumes`, {
            params: {
                q: `intitle:${title}`,
                key: config.google.apiKey,
                maxResults: 1,
            },
            timeout: 5000,
        });
        const volume = response.data.items?.[0]?.volumeInfo;
        if (!volume?.authors) {
            console.warn(`No authors found for title ${title}`);
            return [];
        }

        const authorPromises = volume.authors.map(async (authorName) => {
            return await models.Person.findOneAndUpdate(
                { name: authorName },
                {
                    name: authorName,
                    slug: generateSlug(authorName, "unknown-author"),
                    professions: ["Author"],
                    isActive: true,
                    createdBy: null,
                    updatedBy: null,
                },
                { upsert: true, new: true }
            );
        });
        const authors = await Promise.all(authorPromises);
        return authors.map(a => a._id);
    } catch (error) {
        console.error(`Error fetching authors for ${title}:`, error.message);
        return [];
    }
};

const fetchPublishersFromGoogleBooks = async (title) => {
    try {
        console.debug(`Fetching publishers from Google Books for title: ${title}`);
        const response = await axios.get(`${GOOGLE_BOOKS_BASE_URL}/volumes`, {
            params: {
                q: `intitle:${title}`,
                key: config.google.apiKey,
                maxResults: 1,
            },
            timeout: 5000,
        });
        const volume = response.data.items?.[0]?.volumeInfo;
        if (!volume?.publisher) {
            console.warn(`No publisher found for title ${title}`);
            return null;
        }

        const publisher = await models.Publisher.findOneAndUpdate(
            { name: volume.publisher },
            {
                name: volume.publisher,
                slug: generateSlug(volume.publisher, "unknown-publisher"),
                isActive: true,
                createdBy: null,
                updatedBy: null,
            },
            { upsert: true, new: true }
        );
        return publisher._id;
    } catch (error) {
        console.error(`Error fetching publisher for ${title}:`, error.message);
        return null;
    }
};

const enrichAllAuthors = async () => {
    try {
        console.debug("Starting enrichAllAuthors");
        const cursor = models.Person.find({ professions: "Author" }).lean().cursor();
        for await (const author of cursor) {
            try {
                await enrichData(author, "Person", `${author.name} author`);
            } catch (error) {
                console.warn(`Failed to enrich author ${author._id}:`, error.message);
            }
        }
        console.debug("Completed enrichAllAuthors");
    } catch (error) {
        console.error(`Error in enrichAllAuthors:`, error.message);
    }
};

const enrichAllPublishers = async () => {
    try {
        console.debug("Starting enrichAllPublishers");
        const cursor = models.Publisher.find({}).lean().cursor();
        for await (const p of cursor) {
            try {
                await enrichData(p, "Publisher", `${p.name} publisher`);
            } catch (error) {
                console.warn(`Failed to enrich publisher ${p._id}:`, error.message);
            }
        }
        console.debug("Completed enrichAllPublishers");
    } catch (error) {
        console.error(`Error in enrichAllPublishers:`, error.message);
    }
};

const enrichAllEntities = async (modelType) => {
    try {
        console.debug(`Starting enrichAllEntities for ${modelType}`);
        const cursor = models[modelType].find({}).lean().cursor();
        for await (const record of cursor) {
            try {
                await enrichData(record, modelType, `${record.name} ${modelType.toLowerCase()}`);
            } catch (error) {
                console.warn(`Failed to enrich ${modelType} ${record._id}:`, error.message);
            }
        }
        console.debug(`Completed enrichAllEntities for ${modelType}`);
    } catch (error) {
        console.error(`Error in enrichAllEntities for ${modelType}:`, error.message);
    }
};

// Global unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason?.stack || reason);
});

export default {
    createBook,
    getBookDetails,
    enrichBookData,
    enrichAllBooks,
    fetchAuthorsFromGoogleBooks,
    fetchPublishersFromGoogleBooks,
    enrichAllAuthors,
    enrichAllPublishers,
    enrichAllEntities,
};