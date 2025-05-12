import crypto from "crypto";
import UserKey from "../models/userKey.model.js";
import ApiError from "./ApiError.js";
import httpStatus from "http-status";
import logger from "../config/logger.config.js";

// Generate RSA key pair
const generateKeyPair = async (userId) => {
    try {
        return new Promise((resolve, reject) => {
            crypto.generateKeyPair(
                "rsa",
                {
                    modulusLength: 2048,
                    publicKeyEncoding: { type: "spki", format: "pem" },
                    privateKeyEncoding: { type: "pkcs8", format: "pem" },
                },
                async (err, publicKey, privateKey) => {
                    if (err) {
                        logger.logMessage(
                            "error",
                            `Error generating key pair for user ${userId}: ${err.message}`
                        );
                        return reject(
                            new ApiError(
                                httpStatus.INTERNAL_SERVER_ERROR,
                                "Failed to generate key pair"
                            )
                        );
                    }

                    // Convert to base64 for storage
                    const publicKeyBase64 =
                        Buffer.from(publicKey).toString("base64");
                    const privateKeyBase64 =
                        Buffer.from(privateKey).toString("base64");

                    // Store in UserKey model
                    const userKey = await UserKey.createOrUpdateKey(
                        userId,
                        publicKeyBase64,
                        privateKeyBase64
                    );
                    resolve(userKey);
                }
            );
        });
    } catch (error) {
        logger.logMessage(
            "error",
            `Error in generateKeyPair for user ${userId}: ${error.message}`
        );
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Key generation failed"
        );
    }
};

export default { generateKeyPair };
