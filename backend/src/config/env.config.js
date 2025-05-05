import dotenv from "dotenv";
import joi from "joi";
import ApiError from "../utils/ApiError.js";

dotenv.config({ path: ".env" });

const envVarSchema = joi
    .object({
        NODE_ENV: joi.string().description("node environment type"),
        PORT: joi.number().default(3000),
        MONGODB_URI: joi.string().description("Mongo DB connection string"),
        CORS_ORIGIN: joi.string().description("CORS origin url"),
        ACCESS_TOKEN_SECRET_KEY: joi
            .string()
            .description("Access token secret key"),
        ACCESS_TOKEN_EXPIRY: joi
            .string()
            .description("Access token expiry time"),
        CLOUDINARY_CLOUD_NAME: joi
            .string()
            .description("Cloudinary cloud name"),
        CLOUDINARY_API_KEY: joi.string().description("Cloudinary api key"),
        CLOUDINARY_API_SECRET: joi
            .string()
            .description("Cloudinary api secret"),
        CLOUDINARY_FOLDER: joi.string().description("Cloudinary folder name"),
        TMDB_API_KEY: joi.string().description("TMDB API Access Key"),
        TMDB_AUTH_TOKEN: joi.string().description("TMDB Access Token"),
        GOOGLE_API_KEY: joi.string().description("Google API Access Key"),
        OPEN_AI_API_KEY: joi.string().description("OPEN AI API Access Key"),
        SERP_API_KEY: joi.string().description("Serp API Access Key"),
        ENABLE_CACHE_WRITE:joi.string().description("Google API Access Key"),
    })
    .unknown();

const { value: envVars, error } = envVarSchema
    .prefs({ errors: { label: "key" } })
    .validate(process.env);

if (error) {
    throw new ApiError(500, `ENV config validation error : ${error.message}`);
}

const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongoose: {
        url: envVars.MONGODB_URI,
        options: {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    cors: {
        origin: envVars.CORS_ORIGIN,
    },
    jwt: {
        secret: envVars.ACCESS_TOKEN_SECRET_KEY,
        expiry: envVars.ACCESS_TOKEN_EXPIRY,
    },
    cloudinary: {
        cloudName: envVars.CLOUDINARY_CLOUD_NAME,
        apiKey: envVars.CLOUDINARY_API_KEY,
        apiSecret: envVars.CLOUDINARY_API_SECRET,
        folder: envVars.CLOUDINARY_FOLDER,
    },
    tmdb: {
        apiKey: envVars.TMDB_API_KEY,
        accessToken: envVars.TMDB_AUTH_TOKEN,
    },
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    },
    openLibrary: {
        baseUrl: "https://openlibrary.org",
    },
    google: {
        apiKey: envVars.GOOGLE_API_KEY,
        serpApiKey: envVars.SERP_API_KEY,
    },
    openAi: {
        apiKey: envVars.OPEN_AI_API_KEY,
    },
    cache:{
        enableCacheWrite: envVars.ENABLE_CACHE_WRITE
    }
};

export default config;
