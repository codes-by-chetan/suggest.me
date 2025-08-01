import mongoose from "mongoose";
import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import axios from "axios";
import config from "../config/env.config.js";
import { slugify as translitSlug } from "transliteration";
import OpenAI from "openai";
import { load } from "cheerio";
import { io } from "../index.js"; // Import io instance
import { randomUUID } from "crypto";
// Initialize OpenAI client
const openai = new OpenAI({ apiKey: config.openAi.apiKey });

// Google Books API configuration
const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1";
// Open Library API configuration
const OPEN_LIBRARY_BASE_URL = "https://openlibrary.org";
// Wikidata API configuration
const WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php";
// SerpApi configuration
const SERPAPI_BASE_URL = "https://serpapi.com/search.json";

// === Utility: Slug generator ===
const generateSlug = (name, fallback = "unknown") => {
    try {
        const raw =
            name && typeof name === "string" && name.trim()
                ? name.trim()
                : fallback;
        const slug = translitSlug(raw, { lowercase: true, separator: "-" });
        return slug.length ? slug : fallback;
    } catch (error) {
        console.error(`Error generating slug for ${name}:`, error.message);
        return fallback;
    }
};

// === Generic Enrichment Pipeline ===
// 1. Identify missing fields for any model
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

// 2. Search Web using SerpApi
const searchWeb = async (query, num = 3) => {
    try {
        console.debug(`Searching web for query: ${query}`);
        if (!config.google.serpApiKey) {
            console.warn(`SerpApi key missing for query ${query}`);
            return [];
        }
        console.debug(`SerpApi key: ${config.google.serpApiKey}`);
        const response = await axios.get(SERPAPI_BASE_URL, {
            params: {
                q: query,
                num,
                api_key: config.google.serpApiKey,
            },
            timeout: 10000,
        });
        const data = response.data;
        console.debug(`SerpApi raw response: ${JSON.stringify(data, null, 2)}`);
        if (data.error) {
            console.warn(`SerpApi error for query ${query}: ${data.error}`);
            return [];
        }
        const urls = (data.organic_results || [])
            .map((r) => r.link)
            .filter((link) => link);
        console.debug(`SerpApi URLs: ${urls.join(", ") || "none"}`);
        return urls;
    } catch (error) {
        console.warn(
            `Failed to search web for query ${query}: ${error.message}`
        );
        return [];
    }
};

// 3. Scrape page text content
const scrapePage = async (url) => {
    try {
        console.debug(`Scraping page: ${url}`);
        const { data: html } = await axios.get(url, { timeout: 5000 });
        const $ = load(html);
        const text = $("p")
            .map((i, el) => $(el).text())
            .get()
            .join("\n");
        console.debug(`Scraped text length: ${text.length}`);
        return text;
    } catch (error) {
        console.warn(`Failed to scrape page ${url}:`, error.message);
        return "";
    }
};

// 4. Extract missing fields via LLM
const extractFieldsFromText = async (text, fields) => {
    try {
        console.debug(`Extracting fields: ${fields.join(", ")}`);
        const prompt = `Extract the following fields from the text below in JSON:\n${fields.map((f) => `- ${f}`).join("\n")}\n\nText:\n"""${text}\"\"\"`;
        const resp = await openai.chat.completions.create({
            model: config.openAi.model || "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
        });
        const content = resp.choices[0]?.message?.content;
        if (!content) {
            console.warn("OpenAI returned empty response");
            return {};
        }
        const result = JSON.parse(content);
        console.debug(`Extracted fields: ${JSON.stringify(result)}`);
        return result;
    } catch (error) {
        console.warn(
            `OpenAI error for fields ${fields.join(", ")}:`,
            error.message
        );
        return {};
    }
};

// 5. Merge original and extracted
const mergeRecords = (original, extracted) => {
    try {
        const merged = { ...original };
        Object.entries(extracted).forEach(([key, value]) => {
            if (
                !merged[key] ||
                (Array.isArray(merged[key]) && merged[key].length === 0) ||
                (key === "coverImage" &&
                    merged[key]?.url?.includes("placeholder")) ||
                (key === "profileImage" && !merged[key]?.url) ||
                (key === "logo" && !merged[key]?.url)
            ) {
                merged[key] = value;
            }
        });
        return merged;
    } catch (error) {
        console.error(`Error merging records:`, error.message);
        return original;
    }
};

// 6. Fetch high-quality cover image
const fetchHighQualityCoverImage = async (bookTitle, authors) => {
    try {
        const query = `${bookTitle} ${authors.join(" ")} book cover high resolution`;
        console.debug(`Fetching cover image for query: ${query}`);
        const urls = await searchWeb(query, 5);
        for (const url of urls) {
            const { data: html } = await axios.get(url, { timeout: 5000 });
            const $ = load(html);
            const img = $("img")
                .filter((i, el) => {
                    const src = $(el).attr("src");
                    return (
                        src && (src.includes("cover") || src.includes("book"))
                    );
                })
                .first();
            const imgUrl = img.attr("src");
            if (imgUrl && imgUrl.startsWith("http")) {
                const response = await axios.head(imgUrl);
                const contentLength = parseInt(
                    response.headers["content-length"] || "0"
                );
                if (contentLength > 50000) {
                    const cover = {
                        url: imgUrl,
                        publicId: `cover-${generateSlug(bookTitle)}`,
                    };
                    console.debug(`High-quality cover found: ${cover.url}`);
                    return cover;
                }
            }
        }
        console.debug(`No high-quality cover found for ${bookTitle}`);
        return null;
    } catch (error) {
        console.warn(
            `Failed to fetch high-quality cover for ${bookTitle}:`,
            error.message
        );
        return null;
    }
};

// 7. Generic enrichment pipeline
const enrichData = async (record, modelType, queryContext = "") => {
    try {
        if (!record || !record._id) {
            console.warn(`Invalid record for ${modelType} enrichment`);
            return record;
        }
        console.debug(`Enriching ${modelType} record: ${record._id}`);
        const missing = findMissingFields(record, modelType);
        if (!missing.length) {
            console.debug(`No missing fields for ${modelType} ${record._id}`);
            return record;
        }

        const query = `${queryContext} ${missing.join(" ")}`.trim();
        console.debug(`Enrichment query: ${query}`);
        const urls = await searchWeb(query);
        if (!urls || !urls.length) {
            console.debug(`No URLs found for ${modelType} ${record._id}`);
            return record;
        }

        let corpus = "";
        for (const url of urls) {
            const text = await scrapePage(url);
            corpus += text;
            if (corpus.length > 2000) break;
        }

        if (!corpus) {
            console.debug(`No corpus found for ${modelType} ${record._id}`);
            return record;
        }

        const extracted = await extractFieldsFromText(corpus, missing);
        const enriched = mergeRecords(record, extracted);

        const update = {};
        missing.forEach((f) => {
            if (enriched[f] !== undefined) update[f] = enriched[f];
        });
        if (Object.keys(update).length) {
            console.debug(
                `Updating ${modelType} ${record._id} with:`,
                JSON.stringify(update, null, 2)
            );
            await models[modelType].updateOne({ _id: record._id }, update);
            const updated = await models[modelType].findById(record._id).lean();
            console.debug(`Updated ${modelType} ${record._id}`);
            return updated;
        }
        console.debug(`No updates for ${modelType} ${record._id}`);
        return record;
    } catch (error) {
        console.error(
            `Error enriching ${modelType} ${record._id || "unknown"}:`,
            error.message
        );
        return record;
    }
};

// === Author-Specific Logic ===
// Fetch author details from Open Library
const fetchAuthorDetailsFromOpenLibrary = async (authorName) => {
    try {
        console.debug(`Fetching Open Library data for author: ${authorName}`);
        const searchResponse = await axios.get(
            `${OPEN_LIBRARY_BASE_URL}/search/authors.json`,
            {
                params: { q: authorName },
            }
        );
        const authors = searchResponse.data.docs || [];
        if (!authors.length) {
            console.debug(`No Open Library data for ${authorName}`);
            return null;
        }

        const author =
            authors.find(
                (a) => a.name.toLowerCase() === authorName.toLowerCase()
            ) || authors[0];
        const authorKey = author.key; // e.g., "/OL118077A"
        const authorResponse = await axios.get(
            `${OPEN_LIBRARY_BASE_URL}/authors/${authorKey}.json`
        );

        const data = authorResponse.data;
        const birthDate = data.birth_date ? new Date(data.birth_date) : null;
        return {
            name: data.personal_name || data.name || authorName,
            birthDate: birthDate && !isNaN(birthDate) ? birthDate : null,
            birthPlace: data.location || null,
            biography:
                typeof data.bio === "string" ? data.bio.slice(0, 1000) : null,
            profileImage:
                data.photos && data.photos.length
                    ? {
                          url: `https://covers.openlibrary.org/a/id/${data.photos[0]}-M.jpg`,
                          publicId: `author-${data.photos[0]}`,
                      }
                    : null,
            professions: ["Author"],
        };
    } catch (error) {
        console.warn(
            `Open Library API error for author ${authorName}:`,
            error.message
        );
        return null;
    }
};

// Fetch author details from Wikidata
const fetchAuthorDetailsFromWikidata = async (authorName) => {
    try {
        console.debug(`Fetching Wikidata for author: ${authorName}`);
        const searchResponse = await axios.get(WIKIDATA_API_URL, {
            params: {
                action: "wbsearchentities",
                search: authorName,
                type: "item",
                language: "en",
                format: "json",
            },
        });
        const results = searchResponse.data.search || [];
        if (!results.length) {
            console.debug(`No Wikidata for ${authorName}`);
            return null;
        }

        const author =
            results.find(
                (r) => r.label.toLowerCase() === authorName.toLowerCase()
            ) || results[0];
        const entityId = author.id;

        const entityResponse = await axios.get(WIKIDATA_API_URL, {
            params: {
                action: "wbgetentities",
                ids: entityId,
                props: "claims|descriptions",
                languages: "en",
                format: "json",
            },
        });

        const entity = entityResponse.data.entities[entityId];
        const claims = entity.claims || {};
        const description = entity.descriptions?.en?.value;
        const birthDateRaw = claims.P569?.[0]?.mainsnak?.datavalue?.value?.time;
        let birthDate = birthDateRaw ? new Date(birthDateRaw) : null;
        if (birthDate && isNaN(birthDate)) birthDate = null;

        return {
            name: authorName,
            birthDate,
            birthPlace: claims.P19?.[0]?.mainsnak?.datavalue?.value?.id || null,
            biography: description ? description.slice(0, 1000) : null,
            profileImage: claims.P18?.[0]?.mainsnak?.datavalue?.value
                ? {
                      url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(claims.P18[0].mainsnak.datavalue.value)}`,
                      publicId: `wikidata-${entityId}`,
                  }
                : null,
            professions: ["Author"],
        };
    } catch (error) {
        console.warn(
            `Wikidata API error for author ${authorName}:`,
            error.message
        );
        return null;
    }
};

// Create or find a Person with enriched data
const getOrCreatePerson = async (
    authorName,
    googleBooksId = null,
    userId = null
) => {
    try {
        console.debug(`Creating/Updating Person: ${authorName}`);
        if (
            !authorName ||
            typeof authorName !== "string" ||
            !authorName.trim()
        ) {
            console.warn("Invalid author name, skipping:", authorName);
            return null;
        }

        let person = await models.Person.findOne({
            $or: [{ googleBooksId }, { name: authorName }],
        });

        let authorDetails = await fetchAuthorDetailsFromOpenLibrary(authorName);
        if (!authorDetails) {
            authorDetails = await fetchAuthorDetailsFromWikidata(authorName);
        }

        const defaultDetails = {
            name: authorName,
            slug: generateSlug(authorName, `author-${authorName}`),
            googleBooksId: googleBooksId || null,
            birthDate: null,
            birthPlace: null,
            biography: null,
            profileImage: null,
            professions: ["Author"],
            isActive: true,
            createdBy: userId || null,
            updatedBy: userId || null,
        };

        const personDetails = { ...defaultDetails, ...(authorDetails || {}) };

        if (!person) {
            console.debug(`Creating new Person: ${authorName}`);
            person = await models.Person.create(personDetails);
        } else {
            console.debug(`Updating Person: ${person._id}`);
            await models.Person.updateOne({ _id: person._id }, personDetails);
        }

        console.debug(`Enriching Person: ${person._id}`);
        const enrichedPerson = await enrichData(
            person.toObject(),
            "Person",
            `${authorName} author`
        );
        const result = await models.Person.findById(enrichedPerson._id);
        console.debug(`Person processed: ${result._id}`);
        return result;
    } catch (error) {
        console.error(
            `Error in getOrCreatePerson for ${authorName}:`,
            error.message
        );
        return null;
    }
};

// === Publisher-Specific Logic ===
// Fetch publisher details from Open Library
const fetchPublisherDetailsFromOpenLibrary = async (publisherName) => {
    try {
        console.debug(
            `Fetching Open Library data for publisher: ${publisherName}`
        );
        const response = await axios.get(
            `${OPEN_LIBRARY_BASE_URL}/publishers/${encodeURIComponent(publisherName)}.json`
        );
        const data = response.data;
        return {
            name: data.name || publisherName,
            founded: data.founded ? new Date(data.founded) : null,
            headquarters: data.publish_places?.[0] || null,
            description: data.description
                ? data.description.slice(0, 1000)
                : null,
            website: data.website || null,
            logo: null,
        };
    } catch (error) {
        console.warn(
            `Open Library API error for publisher ${publisherName}:`,
            error.message
        );
        return null;
    }
};

// Create or find a Publisher with enriched data
const getOrCreatePublisher = async (publisherName, userId) => {
    try {
        console.debug(`Creating/Updating Publisher: ${publisherName}`);
        if (
            !publisherName ||
            typeof publisherName !== "string" ||
            !publisherName.trim()
        ) {
            console.warn(
                "Invalid publisher name, using default:",
                publisherName
            );
            publisherName = "Unknown Publisher";
        }

        let publisher = await models.Publisher.findOne({ name: publisherName });
        if (!publisher) {
            const publisherDetails =
                await fetchPublisherDetailsFromOpenLibrary(publisherName);
            const defaultDetails = {
                name: publisherName,
                slug: generateSlug(publisherName, `publisher-${publisherName}`),
                founded: null,
                headquarters: null,
                website: null,
                description: null,
                logo: null,
                isActive: true,
                createdBy: userId || null,
                updatedBy: userId || null,
            };
            const finalDetails = {
                ...defaultDetails,
                ...(publisherDetails || {}),
            };
            console.debug(`Creating new Publisher: ${publisherName}`);
            publisher = await models.Publisher.create(finalDetails);
        }

        console.debug(`Enriching Publisher: ${publisher._id}`);
        const enrichedPublisher = await enrichData(
            publisher.toObject(),
            "Publisher",
            `${publisherName} publisher`
        );
        if (!enrichedPublisher || !enrichedPublisher._id) {
            console.warn(`Enrichment failed for publisher ${publisherName}`);
            return publisher;
        }
        const result = await models.Publisher.findById(enrichedPublisher._id);
        console.debug(`Publisher processed: ${result._id}`);
        return result;
    } catch (error) {
        console.error(
            `Error in getOrCreatePublisher for ${publisherName}:`,
            error.message
        );
        return null;
    }
};

// === Book-Specific Logic ===
// Fetch book details from Google Books
const fetchFromGoogleBooks = async (googleBooksId) => {
    try {
        console.debug(`Fetching Google Books data for ID: ${googleBooksId}`);
        const response = await axios.get(
            `${GOOGLE_BOOKS_BASE_URL}/volumes/${googleBooksId}`,
            {
                params: { key: config.google.apiKey },
            }
        );
        const book = response.data;
        console.debug(`Google Books response received for ${googleBooksId}`);

        const volumeInfo = book.volumeInfo || {};
        const identifiers = volumeInfo.industryIdentifiers || [];
        const publisherName = volumeInfo.publisher || "Unknown Publisher";
        const pages = volumeInfo.pageCount || null;
        const language = volumeInfo.language || "en";
        const authors = volumeInfo.authors || [];

        console.debug(`Processing authors: ${authors.join(", ") || "none"}`);
        const authorIds = await Promise.all(
            authors.slice(0, 5).map(async (authorName) => {
                try {
                    const person = await getOrCreatePerson(
                        authorName,
                        null,
                        null
                    );
                    return person?._id || null;
                } catch (error) {
                    console.warn(
                        `Skipping author ${authorName}:`,
                        error.message
                    );
                    return null;
                }
            })
        );
        const validAuthors = authorIds.filter((id) => id !== null);
        if (!validAuthors.length) {
            console.warn(`No valid authors found for ${googleBooksId}`);
        }
        console.debug(`Valid author IDs: ${validAuthors.join(", ") || "none"}`);

        console.debug(`Processing publisher: ${publisherName}`);
        const publisher = await getOrCreatePublisher(publisherName, null);
        if (!publisher || !publisher._id) {
            console.error(`Failed to create/get publisher ${publisherName}`);
            throw new Error(`Publisher creation failed for ${publisherName}`);
        }
        const publisherId = publisher._id;
        console.debug(`Publisher ID: ${publisherId}`);

        const subjectToBookTypeMap = {
            fiction: "Novel",
            "short stories": "Short Story",
            "graphic novels": "Graphic Novel",
            comics: "Comics",
            manga: "Manga",
            manhwa: "Manhwa",
            webtoon: "Webtoon",
            poetry: "Poetry",
            drama: "Play",
            anthology: "Anthology",
            novella: "Novella",
            "light novel": "Light Novel",
        };
        const getBookType = (categories = []) => {
            const lower = categories.map((s) => s.toLowerCase());
            for (const [keyword, type] of Object.entries(
                subjectToBookTypeMap
            )) {
                if (lower.some((cat) => cat.includes(keyword))) return type;
            }
            return "Other";
        };
        const bookType = getBookType(volumeInfo.categories || []);
        console.debug(`Book type: ${bookType}`);

        const genres = volumeInfo.categories
            ? volumeInfo.categories
                  .slice(0, 10)
                  .map((cat) => cat.split("/").pop().trim())
            : [];
        console.debug(`Genres: ${genres.join(", ") || "none"}`);

        console.debug(
            `Fetching cover image for ${volumeInfo.title || googleBooksId}`
        );
        const coverImage =
            (await fetchHighQualityCoverImage(
                volumeInfo.title || `Book-${googleBooksId}`,
                authors
            )) ||
            (volumeInfo.imageLinks?.thumbnail
                ? {
                      url: volumeInfo.imageLinks.thumbnail.replace(
                          "http://",
                          "https://"
                      ),
                      publicId: googleBooksId,
                  }
                : {
                      url: "https://bookstoreromanceday.org/wp-content/uploads/2020/08/book-cover-placeholder.png?w=144",
                      publicId: "placeholder",
                  });
        console.debug(`Cover image: ${coverImage?.url}`);

        const bookDetails = {
            title: volumeInfo.title || `Book-${googleBooksId}`,
            subtitle: volumeInfo.subtitle || "",
            googleBooksId,
            slug: generateSlug(volumeInfo.title, `book-${googleBooksId}`),
            description: volumeInfo.description
                ? volumeInfo.description.slice(0, 2000)
                : "",
            publishedYear: volumeInfo.publishedDate
                ? new Date(volumeInfo.publishedDate).getFullYear()
                : new Date().getFullYear(),
            industryIdentifiers: identifiers.map((id) => ({
                type: id.type,
                identifier: id.identifier,
            })),
            publisher: publisherId,
            language,
            pages,
            coverImage,
            author: validAuthors,
            bookType,
            genres,
            seriesInfo: volumeInfo.seriesInfo
                ? {
                      seriesId: volumeInfo.seriesInfo.seriesId || "",
                      bookDisplayNumber:
                          volumeInfo.seriesInfo.bookDisplayNumber || "",
                      seriesBookType:
                          volumeInfo.seriesInfo.volumeSeries?.[0]
                              ?.seriesBookType || "OTHER",
                  }
                : {},
            maturityRating: volumeInfo.maturityRating || "UNKNOWN",
            readingModes: volumeInfo.readingModes
                ? {
                      text: volumeInfo.readingModes.text || false,
                      image: volumeInfo.readingModes.image || false,
                  }
                : { text: false, image: false },
            canonicalLink: book.canonicalVolumeLink || "",
            isActive: true,
            isVerified: false,
            createdBy: null,
            updatedBy: null,
        };

        console.debug(`Book details prepared for ${googleBooksId}`);
        return bookDetails;
    } catch (error) {
        console.error(
            `Error in fetchFromGoogleBooks for ${googleBooksId}:`,
            error.message
        );
        return null;
    }
};

// Enrich book data
const enrichBookData = async (book, userId = null) => {
    try {
        console.debug(`Enriching book: ${book._id || book.googleBooksId}`);
        const authors =
            (book.author || []).map((a) => a.name || "").join(" ") ||
            "unknown author";
        const enrichedBook = await enrichData(book, "Book", `${book.title} ${authors}`);
        // Emit Socket.IO event globally
        if (io) {
            io.emit("bookEnriched", {
                _id: enrichedBook._id,
                googleBooksId: enrichedBook.googleBooksId,
                openLibraryId: enrichedBook.openLibraryId || null, // Include if available in your schema
                ...enrichedBook
            });
            console.debug(`Emitted global bookEnriched event for book ${enrichedBook._id}`);
        }
        return enrichedBook;
    } catch (error) {
        console.error(
            `Error in enrichBookData for book ${book._id || book.googleBooksId}:`,
            error.message
        );
        return book;
    }
};
// Create book with enrichment
const createBook = async (bookData, userId) => {
    try {
        console.debug(`Creating book: ${bookData.title}`);
        if (!bookData.slug) bookData.slug = generateSlug(bookData.title);
        bookData.createdBy = userId;
        bookData.updatedBy = userId;

        const book = await models.Book.create(bookData);
        console.debug(`Book created: ${book._id}`);
        let populated = await models.Book.findById(book._id).lean();
        console.debug(`Populating book: ${book._id}`);
        // Trigger enrichment in the background
        setImmediate(() => {
            enrichBookData(populated, userId).catch((err) => {
                console.error(`Background enrichment failed for book ${book._id}:`, err.message);
            });
        });
        return populated;
    } catch (error) {
        console.error(
            `Error in createBook for ${bookData.title}:`,
            error.message
        );
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Failed to create book: ${error.message}`
        );
    }
};

// Fetch and store authors from Google Books
const fetchAuthorsFromGoogleBooks = async (
    searchTerm,
    limit = 10,
    userId = null
) => {
    try {
        console.debug(`Fetching authors for search: ${searchTerm}`);
        if (
            !searchTerm ||
            typeof searchTerm !== "string" ||
            !searchTerm.trim()
        ) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Author search term is required and must be a string"
            );
        }

        const response = await axios.get(`${GOOGLE_BOOKS_BASE_URL}/volumes`, {
            params: {
                q: `from:${searchTerm}`,
                key: config.google.apiKey,
                maxResults: limit,
                startIndex: 0,
            },
        });

        const books = response.data.items || [];
        const authorNames = new Set();
        books.forEach((book) => {
            const authors = book.volumeInfo?.authors || [];
            authors.forEach((author) => authorNames.add(author));
        });

        console.debug(
            `Author names found: ${Array.from(authorNames).join(", ") || "none"}`
        );
        const authors = await Promise.all(
            Array.from(authorNames)
                .slice(0, limit)
                .map(async (authorName) => {
                    try {
                        return await getOrCreatePerson(
                            authorName,
                            null,
                            userId
                        );
                    } catch (error) {
                        console.warn(
                            `Skipping author ${authorName}:`,
                            error.message
                        );
                        return null;
                    }
                })
        );

        const validAuthors = authors.filter((author) => author !== null);
        console.debug(
            `Valid authors: ${validAuthors.map((a) => a._id).join(", ") || "none"}`
        );
        return await models.Person.find({
            _id: { $in: validAuthors.map((a) => a._id) },
        }).lean();
    } catch (error) {
        console.error(
            `Error in fetchAuthorsFromGoogleBooks for ${searchTerm}:`,
            error.message
        );
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Failed to fetch authors: ${error.message}`
        );
    }
};

// Fetch and store publishers from Google Books
const fetchPublishersFromGoogleBooks = async (
    searchTerm,
    limit = 10,
    userId = null
) => {
    try {
        console.debug(`Fetching publishers for search: ${searchTerm}`);
        if (
            !searchTerm ||
            typeof searchTerm !== "string" ||
            !searchTerm.trim()
        ) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Publisher search term is required and must be a string"
            );
        }

        const response = await axios.get(`${GOOGLE_BOOKS_BASE_URL}/volumes`, {
            params: {
                q: `from:${searchTerm}`,
                key: config.google.apiKey,
                maxResults: limit,
                startIndex: 0,
            },
        });

        const books = response.data.items || [];
        const publisherNames = new Set();
        books.forEach((book) => {
            const publisher = book.volumeInfo?.publisher;
            if (publisher && publisher.trim()) publisherNames.add(publisher);
        });

        console.debug(
            `Publisher names found: ${Array.from(publisherNames).join(", ") || "none"}`
        );
        const publishers = await Promise.all(
            Array.from(publisherNames)
                .slice(0, limit)
                .map(async (publisherName) => {
                    try {
                        return await getOrCreatePublisher(
                            publisherName,
                            userId
                        );
                    } catch (error) {
                        console.warn(
                            `Skipping publisher ${publisherName}:`,
                            error.message
                        );
                        return null;
                    }
                })
        );

        const validPublishers = publishers.filter(
            (publisher) => publisher !== null
        );
        console.debug(
            `Valid publishers: ${validPublishers.map((p) => p._id).join(", ") || "none"}`
        );
        return await models.Publisher.find({
            _id: { $in: validPublishers.map((p) => p._id) },
        }).lean();
    } catch (error) {
        console.error(
            `Error in fetchPublishersFromGoogleBooks for ${searchTerm}:`,
            error.message
        );
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Failed to fetch publishers: ${error.message}`
        );
    }
};

// Enrich all books
const enrichAllBooks = async () => {
    try {
        console.debug("Starting enrichAllBooks");
        const cursor = models.Book.find({}).lean().cursor();
        for await (const b of cursor) {
            try {
                await enrichBookData(b, null);
            } catch (error) {
                console.warn(`Failed to enrich book ${b._id}:`, error.message);
            }
        }
        console.debug("Completed enrichAllBooks");
    } catch (error) {
        console.error(`Error in enrichAllBooks:`, error.message);
    }
};

// Enrich all authors
const enrichAllAuthors = async () => {
    try {
        console.debug("Starting enrichAllAuthors");
        const cursor = models.Person.find({}).lean().cursor();
        for await (const p of cursor) {
            try {
                await enrichData(p, "Person", `${p.name} author`);
            } catch (error) {
                console.warn(
                    `Failed to enrich person ${p._id}:`,
                    error.message
                );
            }
        }
        console.debug("Completed enrichAllAuthors");
    } catch (error) {
        console.error(`Error in enrichAllAuthors:`, error.message);
    }
};

// Enrich all publishers
const enrichAllPublishers = async () => {
    try {
        console.debug("Starting enrichAllPublishers");
        const cursor = models.Publisher.find({}).lean().cursor();
        for await (const p of cursor) {
            try {
                await enrichData(p, "Publisher", `${p.name} publisher`);
            } catch (error) {
                console.warn(
                    `Failed to enrich publisher ${p._id}:`,
                    error.message
                );
            }
        }
        console.debug("Completed enrichAllPublishers");
    } catch (error) {
        console.error(`Error in enrichAllPublishers:`, error.message);
    }
};

// Generic enrich all entities
const enrichAllEntities = async (modelType) => {
    try {
        console.debug(`Starting enrichAllEntities for ${modelType}`);
        const cursor = models[modelType].find({}).lean().cursor();
        for await (const record of cursor) {
            try {
                await enrichData(
                    record,
                    modelType,
                    `${record.name} ${modelType.toLowerCase()}`
                );
            } catch (error) {
                console.warn(
                    `Failed to enrich ${modelType} ${record._id}:`,
                    error.message
                );
            }
        }
        console.debug(`Completed enrichAllEntities for ${modelType}`);
    } catch (error) {
        console.error(
            `Error in enrichAllEntities for ${modelType}:`,
            error.message
        );
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
            ? { $or: [{ _id: id }, { googleBooksId: id }] }
            : { googleBooksId: id };
        let book = await models.Book.findOne(q)
            .populate("author")
            .populate("publisher")
            .lean();

        if (book) {
            console.debug(`Book found in DB: ${book._id}`);
            // Trigger enrichment in the background
            setImmediate(() => {
                enrichBookData(book, userId).catch((err) => {
                    console.error(`Background enrichment failed for book ${book._id}:`, err.message);
                });
            });
            return book;
        }

        console.debug(
            `Book not found in DB, fetching from Google Books: ${id}`
        );
        const fromGB = await fetchFromGoogleBooks(id);
        if (!fromGB) {
            console.warn(`Book not found for ${id}`);
            throw new ApiError(httpStatus.NOT_FOUND, "Book not found");
        }
        Object.assign(fromGB, { createdBy: userId, updatedBy: userId });

        console.debug(`Creating new book for ${id}`);
        return await createBook(fromGB, userId);
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

// Global unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
    console.error(
        "Unhandled Rejection at:",
        promise,
        "reason:",
        reason?.stack || reason
    );
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