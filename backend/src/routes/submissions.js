const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Group = require("../models/Group");
const { authenticateToken } = require("../middleware/auth");

// Get all submissions (with filters)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { assignmentId, courseId, status } = req.query;
    let query = {};

    if (assignmentId) {
      query.assignment = assignmentId;
    }

    if (status) {
      query.status = status;
    }

    // If courseId provided, get assignments for that course first
    if (courseId) {
      const Assignment = require("../models/Assignment");
      const assignments = await Assignment.find({ course: courseId });
      query.assignment = { $in: assignments.map((a) => a._id) };
    }

    const submissions = await Submission.find(query)
      .populate("assignment", "title type dueDate course")
      .populate("student", "name email")
      .populate("group", "name leader members")
      .populate({
        path: "group",
        populate: {
          path: "members leader",
          select: "name email",
        },
      })
      .populate("acknowledgedBy", "name email")
      .sort("-submittedAt");

    res.json(submissions);
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Get user's submissions
router.get("/my-submissions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get groups user is part of
    const groups = await Group.find({ members: userId });
    const groupIds = groups.map((g) => g._id);

    // Get submissions (individual or group)
    const submissions = await Submission.find({
      $or: [{ student: userId }, { group: { $in: groupIds } }],
    })
      .populate("assignment", "title type dueDate course")
      .populate({
        path: "assignment",
        populate: {
          path: "course",
          select: "name code",
        },
      })
      .populate("group", "name leader members")
      .populate("acknowledgedBy", "name email")
      .sort("-submittedAt");

    res.json(submissions);
  } catch (error) {
    console.error("Get my submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Create or update submission
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { assignmentId, groupId, status, submissionLink } = req.body;
    const userId = req.user.id;

    if (!assignmentId) {
      return res.status(400).json({ error: "Assignment ID is required" });
    }

    // Get assignment details
    const assignment = await Assignment.findById(assignmentId).populate(
      "course"
    );
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Check if user is enrolled in the course
    if (!assignment.course.students.includes(userId)) {
      return res
        .status(403)
        .json({ error: "You are not enrolled in this course" });
    }

    let submission;

    // Handle group assignment
    if (assignment.type === "group") {
      if (!groupId) {
        return res
          .status(400)
          .json({ error: "Group ID is required for group assignments" });
      }

      // Verify group exists and user is a member
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      if (!group.members.includes(userId)) {
        return res
          .status(403)
          .json({ error: "You are not a member of this group" });
      }

      // Check if trying to acknowledge
      if (status === "acknowledged") {
        // Only group leader can acknowledge
        if (!group.leader.equals(userId)) {
          return res
            .status(403)
            .json({ error: "Only group leader can acknowledge submission" });
        }
      }

      // Find or create submission
      submission = await Submission.findOne({
        assignment: assignmentId,
        group: groupId,
      });

      if (submission) {
        // Update existing
        if (status) submission.status = status;
        if (submissionLink) submission.submissionLink = submissionLink;
        if (status === "acknowledged") {
          submission.acknowledgedBy = userId;
          submission.acknowledgedAt = new Date();
        }
        await submission.save();
      } else {
        // Create new
        submission = await Submission.create({
          assignment: assignmentId,
          group: groupId,
          status: status || "pending",
          submissionLink,
          acknowledgedBy: status === "acknowledged" ? userId : null,
          acknowledgedAt: status === "acknowledged" ? new Date() : null,
          submittedAt: new Date(),
        });
      }
    }
    // Handle individual assignment
    else {
      // Find or create submission
      submission = await Submission.findOne({
        assignment: assignmentId,
        student: userId,
      });

      if (submission) {
        // Update existing
        if (status) submission.status = status;
        if (submissionLink) submission.submissionLink = submissionLink;
        if (status === "acknowledged") {
          submission.acknowledgedBy = userId;
          submission.acknowledgedAt = new Date();
        }
        await submission.save();
      } else {
        // Create new
        submission = await Submission.create({
          assignment: assignmentId,
          student: userId,
          status: status || "pending",
          submissionLink,
          acknowledgedBy: status === "acknowledged" ? userId : null,
          acknowledgedAt: status === "acknowledged" ? new Date() : null,
          submittedAt: new Date(),
        });
      }
    }

    // Populate for response
    const populatedSubmission = await Submission.findById(submission._id)
      .populate("assignment", "title type dueDate")
      .populate("student", "name email")
      .populate("group", "name leader members")
      .populate("acknowledgedBy", "name email");

    res.json({
      message:
        status === "acknowledged"
          ? "Submission acknowledged successfully"
          : "Submission recorded successfully",
      submission: populatedSubmission,
    });
  } catch (error) {
    console.error("Submit assignment error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ error: "Submission already exists" });
    }

    res.status(500).json({ error: "Failed to submit assignment" });
  }
});

// Get submission by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("assignment", "title type dueDate course")
      .populate("student", "name email")
      .populate("group", "name leader members")
      .populate({
        path: "group",
        populate: {
          path: "members leader",
          select: "name email",
        },
      })
      .populate("acknowledgedBy", "name email");

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json(submission);
  } catch (error) {
    console.error("Get submission error:", error);
    res.status(500).json({ error: "Failed to fetch submission" });
  }
});

// Get submissions by assignment
router.get("/assignment/:assignmentId", authenticateToken, async (req, res) => {
  try {
    const submissions = await Submission.find({
      assignment: req.params.assignmentId,
    })
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
    console.error("Get assignment submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Get submissions by group
router.get("/group/:groupId", authenticateToken, async (req, res) => {
  try {
    const submissions = await Submission.find({ group: req.params.groupId })
      .populate("assignment", "title type dueDate course")
      .populate({
        path: "assignment",
        populate: {
          path: "course",
          select: "name code",
        },
      })
      .populate("acknowledgedBy", "name email")
      .sort("-submittedAt");

    res.json(submissions);
  } catch (error) {
    console.error("Get group submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Update submission (for grading - Admin only)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { marks, feedback, status } = req.body;

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Verify professor owns the course
    const assignment = await Assignment.findById(
      submission.assignment
    ).populate("course");
    if (!assignment.course.professor.equals(req.user.id)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update submission
    if (marks !== undefined) submission.marks = marks;
    if (feedback !== undefined) submission.feedback = feedback;
    if (status) submission.status = status;

    if (marks !== undefined) {
      submission.gradedBy = req.user.id;
      submission.gradedAt = new Date();
    }

    await submission.save();

    const updatedSubmission = await Submission.findById(submission._id)
      .populate("assignment", "title type dueDate")
      .populate("student", "name email")
      .populate("group", "name leader members")
      .populate("gradedBy", "name email");

    res.json({
      message: "Submission updated successfully",
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error("Update submission error:", error);
    res.status(500).json({ error: "Failed to update submission" });
  }
});

// Delete submission
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Students can only delete their own pending submissions
    if (req.user.role === "student") {
      const isOwner =
        submission.student && submission.student.equals(req.user.id);
      const isPending = submission.status === "pending";

      if (!isOwner || !isPending) {
        return res.status(403).json({ error: "Cannot delete this submission" });
      }
    }

    await Submission.findByIdAndDelete(req.params.id);

    res.json({ message: "Submission deleted successfully" });
  } catch (error) {
    console.error("Delete submission error:", error);
    res.status(500).json({ error: "Failed to delete submission" });
  }
});

module.exports = router;
