const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Submission = require("../models/Submission");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Get all assignments (with filters)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.query;
    let query = {};

    if (courseId) {
      query.course = courseId;
    }

    const assignments = await Assignment.find(query)
      .populate("course", "name code")
      .populate("createdBy", "name email")
      .sort("-createdAt");

    // Get submission counts
    const assignmentsWithCounts = await Promise.all(
      assignments.map(async (assignment) => {
        const submissionCount = await Submission.countDocuments({
          assignment: assignment._id,
          status: { $in: ["acknowledged", "submitted", "graded"] },
        });

        return {
          ...assignment.toObject(),
          submissionCount,
        };
      })
    );

    res.json(assignmentsWithCounts);
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Get single assignment
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("course", "name code professor students")
      .populate("createdBy", "name email");

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Check if user has access
    const { id: userId, role } = req.user;
    const course = assignment.course;

    const hasAccess =
      (role === "admin" && course.professor.equals(userId)) ||
      (role === "student" && course.students.some((s) => s.equals(userId)));

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get user's submission status if student
    if (role === "student") {
      const submission = await Submission.findOne({
        assignment: assignment._id,
        $or: [
          { student: userId },
          { group: { $in: await getStudentGroups(userId, course._id) } },
        ],
      }).populate("group", "name leader members");

      assignment._doc.userSubmission = submission;
    }

    res.json(assignment);
  } catch (error) {
    console.error("Get assignment error:", error);
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

// Helper function to get student's groups for a course
async function getStudentGroups(studentId, courseId) {
  const Group = require("../models/Group");
  const groups = await Group.find({
    course: courseId,
    members: studentId,
  });
  return groups.map((g) => g._id);
}

// Create assignment (Admin only)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      type,
      dueDate,
      oneDriveLink,
      maxMarks,
      instructions,
    } = req.body;

    if (!title || !courseId || !dueDate) {
      return res
        .status(400)
        .json({ error: "Title, course, and due date are required" });
    }

    // Verify course exists and user is the professor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (!course.professor.equals(req.user.id)) {
      return res
        .status(403)
        .json({ error: "You can only create assignments for your courses" });
    }

    const assignment = await Assignment.create({
      title,
      description,
      course: courseId,
      type: type || "individual",
      dueDate,
      oneDriveLink,
      maxMarks: maxMarks || 100,
      instructions,
      createdBy: req.user.id,
    });

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate("course", "name code")
      .populate("createdBy", "name email");

    res.status(201).json({
      message: "Assignment created successfully",
      assignment: populatedAssignment,
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// Update assignment (Admin only)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      dueDate,
      oneDriveLink,
      maxMarks,
      instructions,
    } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Verify ownership
    const course = await Course.findById(assignment.course);
    if (!course.professor.equals(req.user.id)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update fields
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (type) assignment.type = type;
    if (dueDate) assignment.dueDate = dueDate;
    if (oneDriveLink !== undefined) assignment.oneDriveLink = oneDriveLink;
    if (maxMarks) assignment.maxMarks = maxMarks;
    if (instructions !== undefined) assignment.instructions = instructions;

    await assignment.save();

    const updatedAssignment = await Assignment.findById(assignment._id)
      .populate("course", "name code")
      .populate("createdBy", "name email");

    res.json({
      message: "Assignment updated successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

// Delete assignment (Admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Verify ownership
    const course = await Course.findById(assignment.course);
    if (!course.professor.equals(req.user.id)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete all submissions
    await Submission.deleteMany({ assignment: assignment._id });

    // Delete assignment
    await Assignment.findByIdAndDelete(req.params.id);

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

// Get assignment submissions (Admin only)
router.get(
  "/:id/submissions",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      const submissions = await Submission.find({ assignment: assignment._id })
        .populate("student", "name email")
        .populate("group", "name leader members")
        .populate({
          path: "group",
          populate: {
            path: "members",
            select: "name email",
          },
        })
        .populate("acknowledgedBy", "name email")
        .sort("-acknowledgedAt");

      res.json(submissions);
    } catch (error) {
      console.error("Get submissions error:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  }
);

module.exports = router;
