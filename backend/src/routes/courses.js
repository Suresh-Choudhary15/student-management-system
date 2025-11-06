const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const User = require("../models/User");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Get all courses (with filters) - FIXED VERSION
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.user;

    // console.log("=== COURSES API REQUEST ===");
    // console.log("Authenticated User ID:", userId);
    // console.log("Authenticated User Role:", role);

    let query = {};

    if (role === "student") {
      // console.log("Fetching courses for STUDENT:", userId);

      const user = await User.findById(userId);
      if (!user) {
        // console.log("❌ STUDENT NOT FOUND IN DATABASE");
        return res.status(404).json({ error: "Student profile not found" });
      }

      // console.log("✅ Student found:", user.email);
      // console.log("Enrolled courses:", user.enrolledCourses);

      if (!user.enrolledCourses || user.enrolledCourses.length === 0) {
        // console.log("ℹ️ Student has no enrolled courses");
        return res.json([]);
      }

      query._id = { $in: user.enrolledCourses };
      // console.log("Final query for student:", query);
    } else if (role === "admin") {
      query = {};
      // console.log("👨‍🏫 Admin viewing ALL courses");
    }

    const courses = await Course.find(query)
      .populate("professor", "name email")
      .populate("students", "name email")
      .sort("-createdAt");

    // console.log(`✅ Returning ${courses.length} courses for ${role}`);
    // console.log(
    // "Course names:",
    // courses.map((c) => c.name)
    // );

    res.json(courses);
  } catch (error) {
    // console.error("❌ Get courses error:", error);
    res.status(500).json({
      error: "Failed to fetch courses",
      details: error.message,
    });
  }
});

// Get single course
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("professor", "name email")
      .populate("students", "name email");

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // FIXED: Better access control
    const { userId, role } = req.user;
    let hasAccess = false;

    if (role === "admin") {
      // Admin can access if they created the course OR for debugging, allow all
      hasAccess = true;
      // console.log(`Admin ${userId} accessing course ${course._id}`);
    } else if (role === "student") {
      // Student can access if enrolled
      hasAccess = course.students.some((s) => s._id.toString() === userId);
      // console.log(
      //   `Student ${userId} access to course ${course._id}: ${hasAccess}`
      // );
      // console.log(
      //   "Course students:",
      //   course.students.map((s) => s._id.toString())
      // );
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: "Access denied",
        details: `You don't have permission to access this course. Course professor: ${course.professor._id}, Your ID: ${userId}`,
      });
    }

    res.json(course);
  } catch (error) {
    // console.error("Get course error:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

// Create course (Admin only) - FIXED to handle duplicate codes
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, code, description, semester, year } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: "Name and code are required" });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code: code.toUpperCase() });
    if (existingCourse) {
      return res.status(400).json({
        error: "Course code already exists",
        suggestion: `Try using a different code like ${code}${new Date().getFullYear()}`,
      });
    }

    const course = await Course.create({
      name,
      code: code.toUpperCase(),
      description,
      semester,
      year,
      professor: req.user.id,
      students: [],
    });

    // Add to professor's teaching courses
    await User.findByIdAndUpdate(req.user.id, {
      $push: { teachingCourses: course._id },
    });

    console.log(
      `Course created: ${course.name} (${course.code}) by professor ${req.user.id}`
    );

    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Create course error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Course code already exists",
        details: "Please use a unique course code",
      });
    }
    res.status(500).json({ error: "Failed to create course" });
  }
});

// Enroll student in course
router.post("/:id/enroll", authenticateToken, async (req, res) => {
  try {
    const { studentEmail } = req.body;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Find student
    const student = await User.findOne({
      email: studentEmail,
      role: "student",
    });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if already enrolled
    if (course.students.includes(student._id)) {
      return res.status(400).json({ error: "Student already enrolled" });
    }

    // Enroll student
    course.students.push(student._id);
    await course.save();

    // Update student's enrolled courses
    student.enrolledCourses.push(course._id);
    await student.save();

    res.json({
      message: "Student enrolled successfully",
      course,
    });
  } catch (error) {
    console.error("Enroll student error:", error);
    res.status(500).json({ error: "Failed to enroll student" });
  }
});

// Update course
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, code, description, semester, year } = req.body;

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, professor: req.user.id },
      { name, code, description, semester, year },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res
        .status(404)
        .json({ error: "Course not found or unauthorized" });
    }

    res.json({
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
});

// Delete course
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({
      _id: req.params.id,
      professor: req.user.id,
    });

    if (!course) {
      return res
        .status(404)
        .json({ error: "Course not found or unauthorized" });
    }

    // Remove from users
    await User.updateMany(
      {
        $or: [{ enrolledCourses: course._id }, { teachingCourses: course._id }],
      },
      { $pull: { enrolledCourses: course._id, teachingCourses: course._id } }
    );

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

module.exports = router;
