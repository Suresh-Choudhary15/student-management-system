const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.name as creator_name,
      COUNT(DISTINCT s.id) as submission_count
      FROM assignments a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.status = 'confirmed'
      GROUP BY a.id, u.name
      ORDER BY a.due_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, due_date, onedrive_link } = req.body;

    if (!title || !due_date) {
      return res.status(400).json({ error: "Title and due date are required" });
    }

    const result = await pool.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_link, created_by) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, due_date, onedrive_link, req.user.id]
    );

    res.status(201).json({
      message: "Assignment created successfully",
      assignment: result.rows[0],
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, u.name as creator_name 
       FROM assignments a 
       LEFT JOIN users u ON a.created_by = u.id 
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get assignment error:", error);
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, onedrive_link } = req.body;

    const result = await pool.query(
      `UPDATE assignments 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           due_date = COALESCE($3, due_date),
           onedrive_link = COALESCE($4, onedrive_link)
       WHERE id = $5
       RETURNING *`,
      [title, description, due_date, onedrive_link, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({
      message: "Assignment updated successfully",
      assignment: result.rows[0],
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM assignments WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

module.exports = router;
