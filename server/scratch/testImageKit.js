import ImageKit, { toFile } from "@imagekit/nodejs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

console.log("Keys loaded:");
console.log("PUBLIC_KEY:", process.env.IMAGEKIT_PUBLIC_KEY);
console.log("PRIVATE_KEY:", process.env.IMAGEKIT_PRIVATE_KEY);
console.log("URL_ENDPOINT:", process.env.IMAGEKIT_URL_ENDPOINT);

import axios from "axios";

async function run() {
  try {
    const authHeader = "Basic " + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ":").toString("base64");
    console.log("Auth Header:", authHeader);

    const formData = new URLSearchParams();
    formData.append("file", "https://placehold.co/600x400.png");
    formData.append("fileName", "test.png");

    const res = await axios.post("https://upload.imagekit.io/api/v1/files/upload", formData, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    console.log("Success! Raw Response:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("HTTP Error Status:", err.response.status);
      console.error("HTTP Error Data:", err.response.data);
      console.error("HTTP Error Headers:", err.response.headers);
    } else {
      console.error("Error:", err.message);
    }
  }
}

run();
