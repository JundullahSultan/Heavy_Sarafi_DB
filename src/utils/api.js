import axios from "axios";
import { handleGuestRequest } from "./guestMockData";

export const SERVER_BASE = "http://localhost:5001";

const API = axios.create({
  baseURL: `${SERVER_BASE}/api`,
  withCredentials: true,
});

// Intercept all HTTP requests if in Guest Demo mode
const defaultAdapter = axios.defaults.adapter;
API.defaults.adapter = async (config) => {
  if (typeof window !== "undefined" && localStorage.getItem("isGuest") === "true") {
    return handleGuestRequest(config);
  }
  if (typeof defaultAdapter === "function") {
    return defaultAdapter(config);
  }
  // Axios 1.x fallback adapter resolution
  return axios.getAdapter(config.adapter || "xhr")(config);
};

/**
 * Resolve a file URL that may be a relative local path (e.g. /uploads/...)
 * into a full URL the browser can fetch.
 */
export const resolveFileUrl = (url) => {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SERVER_BASE}${url}`;
};

export default API;
