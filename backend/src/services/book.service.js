import mongoose from "mongoose";
import models from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import axios from "axios";
import config from "../config/env.config.js";

// Open Library API configuration
const OPEN_LIBRARY_BASE_URL = config.openLibrary.baseUrl;

// Helper function to generate a valid slug
const generateSlug = (name, fallback = "unknown") => {
    const baseName =
        name && typeof name === "string" && name.trim() ? name : fallback;
    return baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
};

// Helper function to create or find a Person (author) with Open Library data
const getOrCreatePerson = async (authorData, userId = null) => {
    if (!authorData || !authorData.key || !authorData.key.split("/")[2]) {
        console.warn("Invalid author data, skipping:", authorData);
        return null;
    }

    const openLibraryId = authorData.key.split("/")[2];
    let person = await models.Person.findOne({ openLibraryId });
    console.log("author data :  ", authorData);

    console.log(
        "generated slug :  ",
        generateSlug(authorData.personal_name, `author-${openLibraryId}`)
    );
    // Map author data with fallback for name
    const authorDetails = {
        name: authorData.name || `Author-${openLibraryId}`,
        openLibraryId,
        slug: generateSlug(authorData.personal_name, `author-${openLibraryId}`),
        professions: ["Author"],
        isActive: true,
        createdBy: null,
        updatedBy: null,
    };

    try {
        // Fetch detailed author data from Open Library
        const response = await axios.get(
            `${OPEN_LIBRARY_BASE_URL}${authorData.key}.json`
        );
        const personData = response.data;
        authorDetails.biography = personData.bio?.value || personData.bio || "";
        authorDetails.birthday = personData.birth_date
            ? new Date(personData.birth_date)
            : null;

        if (!person) {
            person = await models.Person.create(authorDetails);
        } else {
            await person.updateOne(authorDetails);
        }
        return person._id;
    } catch (error) {
        console.error(
            `Open Library API error for author ${openLibraryId}:`,
            error.message
        );
        if (!person) {
            person = await models.Person.create(authorDetails);
        }
        return person._id;
    }
};

// Helper function to create or find a Publisher
const getOrCreatePublisher = async (publisherName, userId) => {
    if (
        !publisherName ||
        typeof publisherName !== "string" ||
        !publisherName.trim()
    ) {
        console.warn("Invalid publisher name, using default:", publisherName);
        publisherName = "Unknown Publisher";
    }

    let publisher = await models.Publisher.findOne({ name: publisherName });
    if (publisher) return publisher._id;

    publisher = await models.Publisher.create({
        name: publisherName,
        slug: generateSlug(publisherName),
        isActive: true,
        createdBy: null,
        updatedBy: null,
    });
    return publisher._id;
};

// Helper function to fetch book details from Open Library
const fetchFromOpenLibrary = async (openLibraryId) => {
    try {
        const response = await axios.get(
            `${OPEN_LIBRARY_BASE_URL}/works/${openLibraryId}.json`
        );
        const book = response.data;

        // Fetch additional details (ISBN, covers, etc.)
        const searchResponse = await axios.get(
            `${OPEN_LIBRARY_BASE_URL}/search.json`,
            {
                params: { q: `olid:${openLibraryId}` },
            }
        );
        const searchData = searchResponse.data.docs[0] || {};

        // Map authors
        const authorIds = book.authors
            ? await Promise.all(
                  book.authors.slice(0, 5).map(async (a) => {
                      try {
                          const authorResponse = await axios.get(
                              `${OPEN_LIBRARY_BASE_URL}${a.author.key}.json`
                          );
                          return getOrCreatePerson(
                              authorResponse.data,
                              a.author.key
                          );
                      } catch (error) {
                          console.warn(
                              `Skipping author ${a.author.key} due to error:`,
                              error.message
                          );
                          return null;
                      }
                  })
              )
            : [];
        const validAuthors = authorIds.filter((id) => id !== null);

        // Map publisher
        const publisherName = searchData.publisher?.[0] || "Unknown Publisher";
        const publisherId = await getOrCreatePublisher(publisherName, null);

        // Map book type
        const bookType = searchData.subject?.includes("fiction")
            ? "Novel"
            : searchData.subject?.includes("comics")
              ? "Comics"
              : "Other";

        // Map book details to Book schema
        const bookDetails = {
            title: book.title || `Book-${openLibraryId}`,
            openLibraryId,
            slug: generateSlug(book.title, `book-${openLibraryId}`),
            description: book.description?.value || book.description || "",
            publishedYear:
                searchData.first_publish_year || new Date().getFullYear(),
            isbn: searchData.isbn?.[0] || "",
            genres: searchData.subject?.slice(0, 5) || [],
            language: searchData.language?.[0] || "English",
            pages: searchData.number_of_pages_median || null,
            publisher: publisherId,
            coverImage: searchData.cover?.[0]
                ? {
                      url: `https://covers.openlibrary.org/b/id/${searchData.cover[0]}-L.jpg`,
                      publicId: searchData.cover[0],
                  }
                : {
                      url: "https://via.placeholder.com/150",
                      publicId: "placeholder",
                  },
            author: validAuthors,
            bookType,
            isActive: true,
            isVerified: false,
            createdBy: null,
            updatedBy: null,
        };

        return bookDetails;
    } catch (error) {
        console.error(
            `Open Library API error for book ${openLibraryId}:`,
            error.message
        );
        return null;
    }
};

// Service to get book details by bookId or openLibraryId
const getBookDetails = async (bookId, userId) => {
    if (!bookId || typeof bookId !== "string") {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Book ID or Open Library ID is required and must be a string"
        );
    }

    // Check if bookId is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(bookId);

    // Query the database
    let query = {};
    if (isValidObjectId) {
        query = { $or: [{ _id: bookId }, { openLibraryId: bookId }] };
    } else {
        query = { openLibraryId: bookId };
    }

    let book = await models.Book.findOne(query)
        .populate("author")
        .populate("publisher")
        .populate("distributor")
        .populate("createdBy")
        .populate("updatedBy")
        .lean();

    if (book) {
        return book;
    }

    // Fetch from Open Library if not found in database
    const openLibraryBookDetails = await fetchFromOpenLibrary(bookId);
    if (!openLibraryBookDetails) {
        throw new ApiError(httpStatus.NOT_FOUND, "Book not found");
    }

    // Set createdBy and updatedBy
    openLibraryBookDetails.createdBy = userId || null;
    openLibraryBookDetails.updatedBy = userId || null;

    // Save to database
    try {
        const newBook = await models.Book.create(openLibraryBookDetails);
        // Populate the saved book
        const populatedBook = await models.Book.findById(newBook._id)
            .populate("author")
            .populate("publisher")
            .populate("distributor")
            .populate("createdBy")
            .populate("updatedBy")
            .lean();
        return populatedBook;
    } catch (error) {
        console.error("Error saving book to database:", error.message);
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Failed to save book to database: ${error.message}`
        );
    }
};

const bookService = {
    getBookDetails,
};

export default bookService;
