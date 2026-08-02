import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/heavy_sarafi";

  // Ensure database name is present in the URI
  let finalUri = uri;
  if (!uri.includes("mongodb+srv") && !uri.match(/\/[^/]+$/)) {
    finalUri = uri.replace(/\/?$/, "/heavy_sarafi");
  } else if (!uri.includes("mongodb+srv") && uri.match(/:\d+\/?$/)) {
    finalUri = uri.replace(/\/?$/, "/heavy_sarafi");
  }

  console.log("───────────────────────────────────────");
  console.log("📡 Connecting to MongoDB...");
  console.log(`   URI: ${finalUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")}`);
  console.log("───────────────────────────────────────");

  try {
    const conn = await mongoose.connect(finalUri);
    const host = conn.connection.host;
    const dbName = conn.connection.name;

    console.log("───────────────────────────────────────");
    console.log("✅ MongoDB Connected Successfully!");
    console.log(`   Host:     ${host}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   State:    ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}`);
    console.log("───────────────────────────────────────");
    
    // Drop stale unique uid index left from older schemas
    try {
      const db = conn.connection.db;
      const collections = await db.listCollections({ name: "users" }).toArray();
      if (collections.length > 0) {
        const indexes = await db.collection("users").indexes();
        const hasUidIndex = indexes.some(idx => idx.name === "uid_1");
        if (hasUidIndex) {
          await db.collection("users").dropIndex("uid_1");
          console.log("Successfully dropped stale unique index 'uid_1' from 'users' collection.");
        }
      }
    } catch (err) {
      console.warn("Warning during stale index cleanup:", err.message);
    }


  } catch (error) {
    console.log("───────────────────────────────────────");
    console.log("❌ MongoDB Connection FAILED!");
    console.log(`   Error: ${error.message}`);
    console.log("───────────────────────────────────────");
    process.exit(1);
  }

  // Log connection state changes
  mongoose.connection.on("disconnected", () => {
    console.log("⚠️  MongoDB disconnected!");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected!");
  });
  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
};
