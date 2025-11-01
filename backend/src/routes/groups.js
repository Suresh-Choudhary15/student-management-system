const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, u.name as creator_name,
      COUNT(DISTINCT gm.user_id) as member_count
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      GROUP BY g.id, u.name
      ORDER BY g.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Group name is required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const groupResult = await client.query(
        "INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *",
        [name, req.user.id]
      );

      const group = groupResult.rows[0];

      await client.query(
        "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
        [group.id, req.user.id]
      );

      await client.query("COMMIT");

      res.status(201).json({ message: "Group created successfully", group });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const groupResult = await pool.query(
      "SELECT g.*, u.name as creator_name FROM groups g LEFT JOIN users u ON g.created_by = u.id WHERE g.id = $1",
      [id]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, gm.joined_at 
       FROM group_members gm 
       JOIN users u ON gm.user_id = u.id 
       WHERE gm.group_id = $1 
       ORDER BY gm.joined_at`,
      [id]
    );

    const group = groupResult.rows[0];
    group.members = membersResult.rows;

    res.json(group);
  } catch (error) {
    console.error("Get group error:", error);
    res.status(500).json({ error: "Failed to fetch group details" });
  }
});

router.post("/:id/members", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail, userId } = req.body;

    const groupResult = await pool.query("SELECT * FROM groups WHERE id = $1", [
      id,
    ]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    let targetUserId = userId;

    if (userEmail && !userId) {
      const userResult = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [userEmail]
      );
      if (userResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "User not found with this email" });
      }
      targetUserId = userResult.rows[0].id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: "User email or ID is required" });
    }

    const existingMember = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2",
      [id, targetUserId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: "User is already a member" });
    }

    await pool.query(
      "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
      [id, targetUserId]
    );

    res.status(201).json({ message: "Member added successfully" });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
});

router.delete("/:id/members/:userId", authenticateToken, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const result = await pool.query(
      "DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Member not found in group" });
    }

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

router.get("/user/my-groups", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT g.*, u.name as creator_name,
      COUNT(DISTINCT gm.user_id) as member_count
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      WHERE g.id IN (SELECT group_id FROM group_members WHERE user_id = $1)
      GROUP BY g.id, u.name
      ORDER BY g.created_at DESC
    `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get user groups error:", error);
    res.status(500).json({ error: "Failed to fetch user groups" });
  }
});

module.exports = router;
