import express from "express";
import { User } from "../models/User.js";
import { checkAuth, requireRole } from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const logAuthError = (username, message) => {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] [LOGIN FAILED] User: "${username || 'unknown'}" | Reason: ${message}\n`;
  try {
    const logFilePath = path.join(__dirname, "../auth_errors.log");
    fs.appendFileSync(logFilePath, logMsg);
  } catch (err) {
    console.error("Failed to write to auth_errors.log:", err.message);
  }
};

// ============================================================
// Seed default admin user if database has no users
// ============================================================
const seedDefaultUser = async () => {
  // Clean up legacy undefined accounts
  await User.deleteMany({ username: { $exists: false } });
  await User.deleteMany({ username: null });

  const seedUsers = [
    { username: "admin", password: "admin123", name: "Admin Manager", branch: "Kabul Branch", role: "manager" },
    { username: "kabul", password: "kabul123", name: "Kabul Manager", branch: "Kabul Branch", role: "manager" },
    { username: "herat", password: "herat123", name: "Herat Manager", branch: "Herat Main", role: "manager" },
    { username: "dubai", password: "dubai123", name: "Dubai Manager", branch: "Dubai Branch", role: "manager" },
    { username: "mazar", password: "mazar123", name: "Mazar Manager", branch: "Mazar Branch", role: "manager" }
  ];

  for (const u of seedUsers) {
    const existing = await User.findOne({ username: u.username });
    if (!existing) {
      await User.create({
        ...u,
        phone: "0700000000",
        status: "Active"
      });
      console.log(`Seeded user created fresh: ${u.username} (${u.password})`);
    } else {
      const isMatch = await bcrypt.compare(u.password, existing.password);
      const needsMetadataUpdate = existing.branch !== u.branch || existing.role !== u.role || existing.name !== u.name || existing.status !== "Active";
      if (!isMatch) {
        existing.password = u.password;
        existing.branch = u.branch;
        existing.role = u.role;
        existing.name = u.name;
        existing.status = "Active";
        await existing.save();
        console.log(`Updated seeded user credentials: ${u.username} (${u.password})`);
      } else if (needsMetadataUpdate) {
        existing.branch = u.branch;
        existing.role = u.role;
        existing.name = u.name;
        existing.status = "Active";
        await existing.save();
        console.log(`Updated seeded user metadata for: ${u.username}`);
      }
    }
  }

  // Log summary of all seeded users for convenience
  const totalUsers = await User.countDocuments();
  console.log("───────────────────────────────────────");
  console.log(`👤 Users in database: ${totalUsers}`);
  for (const u of seedUsers) {
    console.log(`   ${u.username} / ${u.password}  →  ${u.branch} (${u.role})`);
  }
  console.log("───────────────────────────────────────");
};
seedDefaultUser().catch((err) => console.error("Seed user error:", err));

// ============================================================
// POST /api/auth/login
// ============================================================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`[LOGIN] Attempt for username: "${username}"`);

    if (!username || !password) {
      console.log("[LOGIN] ❌ Missing username or password");
      logAuthError(username, "Missing username or password");
      return res.status(400).json({ message: "Username and password are required." });
    }

    // Find user by username (case-insensitive due to schema lowercase)
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      console.log(`[LOGIN] ❌ User "${username}" not found in database`);
      logAuthError(username, "User not found in database");
      return res.status(401).json({ message: "Invalid username or password." });
    }
    console.log(`[LOGIN] ✅ User "${username}" found (id: ${user._id})`);

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`[LOGIN] ❌ Password mismatch for "${username}"`);
      logAuthError(username, "Password mismatch");
      return res.status(401).json({ message: "Invalid username or password." });
    }
    console.log(`[LOGIN] ✅ Password verified for "${username}"`);

    // Check if account is suspended
    if (user.status === "Suspended") {
      console.log(`[LOGIN] ❌ Account "${username}" is suspended`);
      logAuthError(username, "Account suspended");
      return res.status(403).json({ message: "Account is suspended. Contact the owner." });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Set session
    req.session.userId = user._id.toString();
    console.log(`[LOGIN] ✅ Session set for "${username}" — login successful`);

    res.json(user);
  } catch (error) {
    console.error("[LOGIN] ❌ Server error:", error.message);
    logAuthError(req.body.username, `Server error: ${error.message}`);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ============================================================
// POST /api/auth/register
// ============================================================
router.post("/register", async (req, res) => {
  try {
    const { username, password, name, role, branch, phone } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ message: "Username, password, and name are required." });
    }

    // Check if username already exists
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Username already taken." });
    }

    const newUser = await User.create({
      username: username.toLowerCase(),
      password,
      name,
      role: role || "manager",
      branch: branch || "Kabul Branch",
      phone: phone || "",
      status: "Active",
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ============================================================
// POST /api/auth/logout
// ============================================================
router.post("/logout", (req, res) => {
  req.session = null;
  res.json({ message: "Successfully logged out." });
});

// ============================================================
// GET /api/auth/me — current session user
// ============================================================
router.get("/me", checkAuth, async (req, res) => {
  try {
    res.json(req.dbUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// GET /api/auth/users — list all staff (Owner only)
// ============================================================
router.get("/users", checkAuth, requireRole("owner"), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// PUT /api/auth/users/:id/status — toggle user status (Owner only)
// ============================================================
router.put("/users/:id/status", checkAuth, requireRole("owner"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.status = req.body.status || (user.status === "Active" ? "Suspended" : "Active");
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// PUT /api/auth/users/:id/role — change user role (Owner only)
// ============================================================
router.put("/users/:id/role", checkAuth, requireRole("owner"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.role = req.body.role;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// DELETE /api/auth/users/:id — delete a staff user (Owner only)
// ============================================================
router.delete("/users/:id", checkAuth, requireRole("owner"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
