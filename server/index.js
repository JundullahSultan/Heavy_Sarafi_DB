import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieSession from "cookie-session";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Environment Variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET || "heavysarafisessionkeysecret"],
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year session lifespan
    secure: false, // set to true in production with HTTPS
    httpOnly: true,
  })
);

// Routes
import authRouter from "./routes/auth.js";
import customersRouter from "./routes/customers.js";
import hawalasRouter from "./routes/hawalas.js";
import expensesRouter from "./routes/expenses.js";
import kahataRouter from "./routes/kahata.js";
import safesRouter from "./routes/safes.js";

app.use("/api/auth", authRouter);
app.use("/api/customers", customersRouter);
app.use("/api/hawalas", hawalasRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/kahata", kahataRouter);
app.use("/api/safes", safesRouter);

// Health Check
app.get("/", (req, res) => {
  res.send("Heavy Sarafi DB API is running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
