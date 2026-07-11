import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

console.log("MONGODB_URI:", process.env.MONGODB_URI);
try {
  const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/heavy_sarafi");
  console.log("Connected Host:", conn.connection.host);
  process.exit(0);
} catch (e) {
  console.error("Connection error:", e.message);
  process.exit(1);
}
