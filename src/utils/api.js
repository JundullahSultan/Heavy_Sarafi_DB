import axios from "axios";

export const SERVER_BASE = "http://localhost:5001";

const API = axios.create({
  baseURL: `${SERVER_BASE}/api`,
  withCredentials: true,
});

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
