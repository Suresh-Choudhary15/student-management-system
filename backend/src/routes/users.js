const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

// Get all users (students for adding to groups/courses)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query).select("-password").sort("name");

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("enrolledCourses", "name code")
      .populate("teachingCourses", "name code");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Get current user profile
router.get("/me/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("enrolledCourses", "name code professor")
      .populate("teachingCourses", "name code");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update user profile
router.put("/me/profile", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get students by course
router.get(
  "/course/:courseId/students",
  authenticateToken,
  async (req, res) => {
    try {
      const users = await User.find({
        role: "student",
        enrolledCourses: req.params.courseId,
      }).select("-password");

      res.json(users);
    } catch (error) {
      console.error("Get course students error:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  }
);

module.exports = router;
