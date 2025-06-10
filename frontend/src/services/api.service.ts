import config from "@/config/env.config";
import axios from "axios";

const HOST_URL = config.API_URL;

const api = axios.create({
  baseURL: HOST_URL,
});

// Function to get the access token from localStorage
function getAccessToken(): string | null {
  const token: string | null = localStorage.getItem("token");
  console.log(token);
  return token;
}

// Add a request interceptor to include the Bearer token in headers
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for error handling (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      console.error("Unauthorized - Redirecting to login...");
      // Optionally: localStorage.removeItem("token");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;