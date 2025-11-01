const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, role FROM users ORDER BY name"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, email, name, role, created_at FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.get("/me/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

module.exports = router;
