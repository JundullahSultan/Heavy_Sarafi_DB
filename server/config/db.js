import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
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
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};
