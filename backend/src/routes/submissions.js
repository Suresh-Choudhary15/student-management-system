const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, 
             a.title as assignment_title,
             g.name as group_name,
             u.name as submitted_by_name
      FROM submissions s
      LEFT JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN groups g ON s.group_id = g.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.submitted_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { assignment_id, group_id, status } = req.body;

    if (!assignment_id || !group_id || !status) {
      return res
        .status(400)
        .json({ error: "Assignment ID, Group ID, and status are required" });
    }

    if (!["pending", "confirmed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const memberCheck = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2",
      [group_id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    const existingSubmission = await pool.query(
      "SELECT * FROM submissions WHERE assignment_id = $1 AND group_id = $2",
      [assignment_id, group_id]
    );

    let result;

    if (existingSubmission.rows.length > 0) {
      if (status === "confirmed") {
        result = await pool.query(
          `UPDATE submissions 
           SET status = $1, confirmed_at = CURRENT_TIMESTAMP, user_id = $2
           WHERE assignment_id = $3 AND group_id = $4
           RETURNING *`,
          [status, req.user.id, assignment_id, group_id]
        );
      } else {
        result = await pool.query(
          `UPDATE submissions 
           SET status = $1, user_id = $2
           WHERE assignment_id = $3 AND group_id = $4
           RETURNING *`,
          [status, req.user.id, assignment_id, group_id]
        );
      }
    } else {
      if (status === "confirmed") {
        result = await pool.query(
          `INSERT INTO submissions (assignment_id, group_id, user_id, status, confirmed_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING *`,
          [assignment_id, group_id, req.user.id, status]
        );
      } else {
        result = await pool.query(
          `INSERT INTO submissions (assignment_id, group_id, user_id, status)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [assignment_id, group_id, req.user.id, status]
        );
      }
    }

    res.json({
      message:
        status === "confirmed"
          ? "Submission confirmed successfully"
          : "Submission initiated",
      submission: result.rows[0],
    });
  } catch (error) {
    console.error("Submit assignment error:", error);
    res.status(500).json({ error: "Failed to submit assignment" });
  }
});

router.get("/assignment/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT s.*, 
             g.name as group_name,
             u.name as submitted_by_name
      FROM submissions s
      LEFT JOIN groups g ON s.group_id = g.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.assignment_id = $1
      ORDER BY s.submitted_at DESC
    `,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get assignment submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

router.get("/group/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT s.*, 
             a.title as assignment_title,
             a.due_date,
             u.name as submitted_by_name
      FROM submissions s
      LEFT JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.group_id = $1
      ORDER BY a.due_date DESC
    `,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get group submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

router.get("/my-submissions", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT DISTINCT s.*, 
             a.title as assignment_title,
             a.due_date,
             g.name as group_name
      FROM submissions s
      LEFT JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN groups g ON s.group_id = g.id
      WHERE s.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = $1
      )
      ORDER BY a.due_date DESC
    `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get my submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

module.exports = router;
