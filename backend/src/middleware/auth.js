const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // console.log("=== JWT DECODED ===");
    // console.log("Full decoded token:", decoded);

    // FIX: Handle different JWT payload structures
    let userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return res.status(403).json({ error: "Invalid token: missing user ID" });
    }

    // Verify user exists in database
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(403).json({ error: "User not found" });
    }

    // Set req.user with consistent structure
    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    // console.log("=== AUTHENTICATED USER ===");
    // console.log("User ID:", req.user.userId);
    // console.log("User Email:", req.user.email);
    // console.log("User Role:", req.user.role);

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Token expired" });
    }
    return res.status(500).json({ error: "Authentication failed" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };
