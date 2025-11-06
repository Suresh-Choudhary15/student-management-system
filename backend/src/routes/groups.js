const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const Course = require("../models/Course");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

// Get all groups (filtered by course)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.query;
    const query = courseId ? { course: courseId } : {};

    const groups = await Group.find(query)
      .populate("leader", "name email")
      .populate("members", "name email")
      .populate("course", "name code")
      .sort("-createdAt");

    res.json(groups);
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Get user's groups
router.get("/my-groups", authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user.id,
    })
      .populate("leader", "name email")
      .populate("members", "name email")
      .populate("course", "name code")
      .sort("-createdAt");

    res.json(groups);
  } catch (error) {
    console.error("Get user groups error:", error);
    res.status(500).json({ error: "Failed to fetch user groups" });
  }
});

// Create new group
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, courseId } = req.body;

    if (!name || !courseId) {
      return res
        .status(400)
        .json({ error: "Group name and course are required" });
    }

    // Verify course exists and user is enrolled
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if student is enrolled in course
    if (req.user.role === "student" && !course.students.includes(req.user.id)) {
      return res
        .status(403)
        .json({ error: "You must be enrolled in this course" });
    }

    // Create group with creator as leader
    const group = await Group.create({
      name,
      course: courseId,
      leader: req.user.id,
      members: [req.user.id],
      createdBy: req.user.id,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("leader", "name email")
      .populate("members", "name email")
      .populate("course", "name code");

    res.status(201).json({
      message: "Group created successfully",
      group: populatedGroup,
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get group details
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("leader", "name email")
      .populate("members", "name email")
      .populate("course", "name code")
      .populate("createdBy", "name email");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.json(group);
  } catch (error) {
    console.error("Get group error:", error);
    res.status(500).json({ error: "Failed to fetch group details" });
  }
});

// Add member to group
router.post("/:id/members", authenticateToken, async (req, res) => {
  try {
    const { userId, userEmail } = req.body;
    const groupId = req.params.id;

    const group = await Group.findById(groupId).populate("course");
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Only group leader or creator can add members
    if (
      !group.leader.equals(req.user.id) &&
      !group.createdBy.equals(req.user.id)
    ) {
      return res
        .status(403)
        .json({ error: "Only group leader can add members" });
    }

    // Find user to add
    let targetUser;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (userEmail) {
      targetUser = await User.findOne({ email: userEmail });
    } else {
      return res.status(400).json({ error: "User ID or email is required" });
    }

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is enrolled in the course
    if (!group.course.students.includes(targetUser._id)) {
      return res
        .status(400)
        .json({ error: "User must be enrolled in the course" });
    }

    // Check if already a member
    if (group.members.includes(targetUser._id)) {
      return res.status(400).json({ error: "User is already a member" });
    }

    // Add member
    group.members.push(targetUser._id);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("leader", "name email")
      .populate("members", "name email")
      .populate("course", "name code");

    res.json({
      message: "Member added successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
});

// Remove member from group
router.delete("/:id/members/:userId", authenticateToken, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Only group leader can remove members (except themselves)
    if (!group.leader.equals(req.user.id)) {
      return res
        .status(403)
        .json({ error: "Only group leader can remove members" });
    }

    // Cannot remove the leader
    if (group.leader.equals(userId)) {
      return res.status(400).json({ error: "Cannot remove group leader" });
    }

    // Remove member
    group.members = group.members.filter((m) => !m.equals(userId));
    await group.save();

    const updatedGroup = await Group.findById(id)
      .populate("leader", "name email")
      .populate("members", "name email");

    res.json({
      message: "Member removed successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// Change group leader
router.put("/:id/leader", authenticateToken, async (req, res) => {
  try {
    const { newLeaderId } = req.body;
    const groupId = req.params.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Only current leader can transfer leadership
    if (!group.leader.equals(req.user.id)) {
      return res
        .status(403)
        .json({ error: "Only current leader can transfer leadership" });
    }

    // Check if new leader is a member
    if (!group.members.includes(newLeaderId)) {
      return res
        .status(400)
        .json({ error: "New leader must be a group member" });
    }

    group.leader = newLeaderId;
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("leader", "name email")
      .populate("members", "name email");

    res.json({
      message: "Group leader updated successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Change leader error:", error);
    res.status(500).json({ error: "Failed to change group leader" });
  }
});

// Delete group
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Only creator or leader can delete
    if (
      !group.createdBy.equals(req.user.id) &&
      !group.leader.equals(req.user.id)
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this group" });
    }

    await Group.findByIdAndDelete(req.params.id);

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Delete group error:", error);
    res.status(500).json({ error: "Failed to delete group" });
  }
});

module.exports = router;
