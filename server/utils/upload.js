import ImageKit, { toFile } from "@imagekit/nodejs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure ImageKit once
let isImageKitConfigured = false;
let imagekit = null;

if (
  process.env.IMAGEKIT_PUBLIC_KEY &&
  process.env.IMAGEKIT_PRIVATE_KEY &&
  process.env.IMAGEKIT_URL_ENDPOINT
) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
  isImageKitConfigured = true;
  console.log("🖼️  ImageKit configured successfully.");
}

/**
 * Upload a file buffer. Tries ImageKit first; falls back to local disk.
 * @param {Buffer} buffer   – the raw file bytes (e.g. req.file.buffer)
 * @param {string} folder   – ImageKit folder / local sub-directory name
 * @param {string} originalName – original filename for extension detection
 * @returns {Promise<string>} – the public URL of the uploaded file
 */
export const uploadFile = async (buffer, folder, originalName = "file") => {
  // --- Try ImageKit first ---
  if (isImageKitConfigured) {
    try {
      const file = await toFile(buffer, originalName);
      const result = await imagekit.files.upload({
        file,
        fileName: originalName,
        folder: `/${folder}`,
      });
      return result.url;
    } catch (err) {
      console.warn(
        `⚠️  ImageKit upload failed (${err.message}). Falling back to local storage.`
      );
    }
  }

  // --- Fallback: save to local uploads/ directory ---
  const uploadsDir = path.join(__dirname, "..", "uploads", folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(originalName) || ".png";
  const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const filePath = path.join(uploadsDir, uniqueName);

  fs.writeFileSync(filePath, buffer);

  // Return a URL path that the express static middleware can serve
  return `/uploads/${folder}/${uniqueName}`;
};

export { isImageKitConfigured };
