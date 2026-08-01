import axios from "axios";
import { handleGuestRequest } from "./guestMockData";

export const SERVER_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "http://localhost:5001";

const API = axios.create({
  baseURL: SERVER_BASE.endsWith("/api") ? SERVER_BASE : `${SERVER_BASE}/api`,
  withCredentials: true,
});

// Intercept all HTTP requests if in Guest Demo mode
// Resolve the real XHR adapter once at init time (Axios 1.x returns an array from defaults.adapter, not a function)
const xhrAdapter = axios.getAdapter("xhr");
API.defaults.adapter = async (config) => {
  if (typeof window !== "undefined" && localStorage.getItem("isGuest") === "true") {
    return handleGuestRequest(config);
  }
  return xhrAdapter(config);
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
