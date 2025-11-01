const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

router.get("/overview", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = $1",
      ["student"]
    );
    const totalGroups = await pool.query(
      "SELECT COUNT(*) as count FROM groups"
    );
    const totalAssignments = await pool.query(
      "SELECT COUNT(*) as count FROM assignments"
    );
    const totalSubmissions = await pool.query(
      "SELECT COUNT(*) as count FROM submissions WHERE status = $1",
      ["confirmed"]
    );

    // Calculate submission rate
    const submissionRate = await pool.query(`
      SELECT 
        CASE 
          WHEN COUNT(DISTINCT g.id) = 0 OR COUNT(DISTINCT a.id) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT CASE WHEN s.status = 'confirmed' THEN CONCAT(s.group_id, '-', s.assignment_id) END)::numeric / 
                NULLIF((COUNT(DISTINCT g.id) * COUNT(DISTINCT a.id))::numeric, 0) * 100), 2)
        END as rate
      FROM groups g
      CROSS JOIN assignments a
      LEFT JOIN submissions s ON g.id = s.group_id AND a.id = s.assignment_id
    `);

    // Get recent submissions with all details INCLUDING group members
    const recentSubmissions = await pool.query(`
      SELECT 
        s.id,
        s.status,
        s.confirmed_at,
        s.submitted_at,
        a.title as assignment_title,
        a.id as assignment_id,
        g.name as group_name,
        g.id as group_id,
        u.name as submitted_by,
        u.id as user_id,
        COUNT(DISTINCT gm.user_id) as member_count,
        ARRAY_AGG(DISTINCT u2.name ORDER BY u2.name) as all_members
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      INNER JOIN groups g ON s.group_id = g.id
      INNER JOIN users u ON s.user_id = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN users u2 ON gm.user_id = u2.id
      WHERE s.status = 'confirmed'
      GROUP BY s.id, a.title, a.id, g.name, g.id, u.name, u.id
      ORDER BY s.confirmed_at DESC
      LIMIT 10
    `);

    res.json({
      totalStudents: parseInt(totalUsers.rows[0].count),
      totalGroups: parseInt(totalGroups.rows[0].count),
      totalAssignments: parseInt(totalAssignments.rows[0].count),
      totalSubmissions: parseInt(totalSubmissions.rows[0].count),
      submissionRate: parseFloat(submissionRate.rows[0].rate || 0),
      recentSubmissions: recentSubmissions.rows,
    });
  } catch (error) {
    console.error("Get overview error:", error);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

router.get(
  "/submissions",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const byAssignment = await pool.query(`
      SELECT a.id, a.title,
             COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'confirmed') as confirmed_count,
             COUNT(DISTINCT g.id) as total_groups
      FROM assignments a
      CROSS JOIN groups g
      LEFT JOIN submissions s ON a.id = s.assignment_id AND g.id = s.group_id
      GROUP BY a.id, a.title
      ORDER BY a.title
    `);

      const byGroup = await pool.query(`
      SELECT g.id, g.name,
             COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'confirmed') as confirmed_count,
             COUNT(DISTINCT a.id) as total_assignments
      FROM groups g
      CROSS JOIN assignments a
      LEFT JOIN submissions s ON g.id = s.group_id AND a.id = s.assignment_id
      GROUP BY g.id, g.name
      ORDER BY confirmed_count DESC
    `);

      const timeline = await pool.query(`
      SELECT DATE(confirmed_at) as date, COUNT(*) as count
      FROM submissions
      WHERE status = 'confirmed' AND confirmed_at IS NOT NULL
      GROUP BY DATE(confirmed_at)
      ORDER BY date DESC
      LIMIT 30
    `);

      res.json({
        byAssignment: byAssignment.rows,
        byGroup: byGroup.rows,
        timeline: timeline.rows,
      });
    } catch (error) {
      console.error("Get submission stats error:", error);
      res.status(500).json({ error: "Failed to fetch submission statistics" });
    }
  }
);

module.exports = router;
