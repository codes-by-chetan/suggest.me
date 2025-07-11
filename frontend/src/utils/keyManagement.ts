import { openDB } from "idb";
import api from "@/services/api.service";

// Generate RSA key pair and store private key in IndexedDB
export const generateAndStoreKeyPair = async (userId: string): Promise<string> => {
  try {
    // Generate RSA key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
        hash: "SHA-256",
      },
      true, // Extractable
      ["encrypt", "decrypt"]
    );

    // Export private key to store in IndexedDB
    const privateKeyData = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyData)));

    // Export public key to send to backend
    const publicKeyData = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyData)));
    console.log("Public Key Base64:", publicKeyBase64);
    console.log("Private Key Base64:", privateKeyBase64);
    // Store private key in IndexedDB
    const db = await openDB("my-app", 1, {
      upgrade(db) {
        db.createObjectStore("keys");
      },
    });
    

    // Send public key to backend using axios (userId not needed in body, extracted from token)
    await api.post("/user/keys/store/key/public", { publicKey: publicKeyBase64 });
    await db.put("keys", privateKeyBase64, `privateKey:${userId}`);

    return publicKeyBase64;
  } catch (error) {
    console.error("Failed to generate and store key pair:", error);
    throw error;
  }
};

// Retrieve private key from IndexedDB
export const retrievePrivateKey = async (userId: string): Promise<CryptoKey> => {
  try {
    const db = await openDB("my-app", 1, {
      upgrade(db) {
        db.createObjectStore("keys");
      },
    });
    const privateKeyData = await db.get("keys", `privateKey:${userId}`);
    if (!privateKeyData) throw new Error("Private key not found");

    const privateKeyBuffer = Uint8Array.from(atob(privateKeyData), (c) => c.charCodeAt(0)).buffer;
    return await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );
  } catch (error) {
    console.error("Failed to retrieve private key:", error);
    throw error;
  }
};