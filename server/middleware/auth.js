import { User } from "../models/User.js";

/**
 * Session-based authentication middleware.
 * Checks req.session.userId set during login.
 */
export const checkAuth = async (req, res, next) => {
  const userId = req.session && req.session.userId;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated. Please log in." });
  }

  try {
    const dbUser = await User.findById(userId);
    if (!dbUser) {
      req.session = null;
      return res.status(401).json({ message: "User not found. Session cleared." });
    }

    if (dbUser.status === "Suspended") {
      req.session = null;
      return res.status(403).json({ message: "Account is suspended. Contact the owner." });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(500).json({ message: "Authentication error." });
  }
};

/**
 * Role-based access control middleware.
 * Usage: requireRole("owner") or requireRole("manager", "owner")
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.dbUser) {
      return res.status(401).json({ message: "Not authenticated." });
    }
    if (!roles.includes(req.dbUser.role)) {
      return res.status(403).json({ message: `Access denied. Required role: ${roles.join(" or ")}.` });
    }
    next();
  };
};
