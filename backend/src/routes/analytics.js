const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Group = require("../models/Group");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Get overview analytics (Admin only)
router.get("/overview", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { courseId } = req.query;
    let courseQuery = {};

    // If courseId provided, filter by that course
    if (courseId) {
      courseQuery._id = courseId;
    } else {
      // Otherwise, get all courses taught by this professor
      courseQuery.professor = req.user.id;
    }

    // Get courses
    const courses = await Course.find(courseQuery);
    const courseIds = courses.map((c) => c._id);

    // Total students (across all professor's courses)
    const totalStudentsSet = new Set();
    courses.forEach((course) => {
      course.students.forEach((studentId) => {
        totalStudentsSet.add(studentId.toString());
      });
    });
    const totalStudents = totalStudentsSet.size;

    // Total groups for these courses
    const totalGroups = await Group.countDocuments({
      course: { $in: courseIds },
    });

    // Total assignments
    const totalAssignments = await Assignment.countDocuments({
      course: { $in: courseIds },
    });

    // Total submissions (acknowledged or submitted)
    const totalSubmissions = await Submission.countDocuments({
      assignment: {
        $in: await Assignment.find({ course: { $in: courseIds } }).distinct(
          "_id"
        ),
      },
      status: { $in: ["acknowledged", "submitted", "graded"] },
    });

    // Calculate submission rate
    let submissionRate = 0;
    if (totalAssignments > 0 && totalStudents > 0) {
      const expectedSubmissions = totalAssignments * totalStudents;
      submissionRate =
        expectedSubmissions > 0
          ? ((totalSubmissions / expectedSubmissions) * 100).toFixed(2)
          : 0;
    }

    // Recent submissions (last 10)
    const assignments = await Assignment.find({
      course: { $in: courseIds },
    }).select("_id");
    const assignmentIds = assignments.map((a) => a._id);

    const recentSubmissions = await Submission.find({
      assignment: { $in: assignmentIds },
      status: { $in: ["acknowledged", "submitted", "graded"] },
    })
      .populate("assignment", "title type")
      .populate("student", "name email")
      .populate({
        path: "group",
        populate: {
          path: "members",
          select: "name email",
        },
      })
      .populate("acknowledgedBy", "name email")
      .sort("-acknowledgedAt")
      .limit(10);

    res.json({
      totalStudents,
      totalGroups,
      totalAssignments,
      totalSubmissions,
      submissionRate: parseFloat(submissionRate),
      recentSubmissions: recentSubmissions.map((sub) => ({
        id: sub._id,
        assignmentTitle: sub.assignment.title,
        assignmentType: sub.assignment.type,
        submittedBy: sub.acknowledgedBy ? sub.acknowledgedBy.name : "Unknown",
        groupName: sub.group ? sub.group.name : null,
        groupMembers: sub.group ? sub.group.members.map((m) => m.name) : null,
        studentName: sub.student ? sub.student.name : null,
        status: sub.status,
        acknowledgedAt: sub.acknowledgedAt,
        submittedAt: sub.submittedAt,
      })),
    });
  } catch (error) {
    console.error("Get overview error:", error);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

// Get course-specific analytics (Admin only)
router.get(
  "/course/:courseId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const courseId = req.params.courseId;

      // Verify professor owns this course
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      if (!course.professor.equals(req.user.id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Get all assignments for this course
      const assignments = await Assignment.find({ course: courseId });
      const assignmentIds = assignments.map((a) => a._id);

      // Submissions by assignment
      const submissionsByAssignment = await Promise.all(
        assignments.map(async (assignment) => {
          const totalSubmissions = await Submission.countDocuments({
            assignment: assignment._id,
            status: { $in: ["acknowledged", "submitted", "graded"] },
          });

          const pendingSubmissions = await Submission.countDocuments({
            assignment: assignment._id,
            status: "pending",
          });

          const expectedCount =
            assignment.type === "individual"
              ? course.students.length
              : await Group.countDocuments({ course: courseId });

          return {
            assignmentId: assignment._id,
            assignmentTitle: assignment.title,
            type: assignment.type,
            dueDate: assignment.dueDate,
            totalSubmissions,
            pendingSubmissions,
            expectedCount,
            completionRate:
              expectedCount > 0
                ? ((totalSubmissions / expectedCount) * 100).toFixed(2)
                : 0,
          };
        })
      );

      // Student performance
      const studentPerformance = await Promise.all(
        course.students.map(async (studentId) => {
          const student = await User.findById(studentId).select("name email");

          const submissions = await Submission.find({
            assignment: { $in: assignmentIds },
            $or: [
              { student: studentId },
              {
                group: {
                  $in: await Group.find({
                    course: courseId,
                    members: studentId,
                  }).distinct("_id"),
                },
              },
            ],
          });

          const completedCount = submissions.filter((s) =>
            ["acknowledged", "submitted", "graded"].includes(s.status)
          ).length;

          const averageMarks =
            submissions.length > 0
              ? submissions.reduce((sum, s) => sum + (s.marks || 0), 0) /
                submissions.length
              : 0;

          return {
            studentId: student._id,
            studentName: student.name,
            studentEmail: student.email,
            totalAssignments: assignments.length,
            completedAssignments: completedCount,
            completionRate:
              assignments.length > 0
                ? ((completedCount / assignments.length) * 100).toFixed(2)
                : 0,
            averageMarks: averageMarks.toFixed(2),
          };
        })
      );

      // Group performance
      const groups = await Group.find({ course: courseId }).populate(
        "members",
        "name"
      );
      const groupPerformance = await Promise.all(
        groups.map(async (group) => {
          const groupAssignments = assignments.filter(
            (a) => a.type === "group"
          );
          const groupSubmissions = await Submission.find({
            assignment: { $in: groupAssignments.map((a) => a._id) },
            group: group._id,
          });

          const completedCount = groupSubmissions.filter((s) =>
            ["acknowledged", "submitted", "graded"].includes(s.status)
          ).length;

          return {
            groupId: group._id,
            groupName: group.name,
            memberCount: group.members.length,
            totalGroupAssignments: groupAssignments.length,
            completedAssignments: completedCount,
            completionRate:
              groupAssignments.length > 0
                ? ((completedCount / groupAssignments.length) * 100).toFixed(2)
                : 0,
          };
        })
      );

      res.json({
        course: {
          id: course._id,
          name: course.name,
          code: course.code,
          studentCount: course.students.length,
        },
        submissionsByAssignment,
        studentPerformance: studentPerformance.sort(
          (a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate)
        ),
        groupPerformance: groupPerformance.sort(
          (a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate)
        ),
      });
    } catch (error) {
      console.error("Get course analytics error:", error);
      res.status(500).json({ error: "Failed to fetch course analytics" });
    }
  }
);

// Get student analytics (for student view)
router.get("/student/dashboard", authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get enrolled courses
    const user = await User.findById(studentId).populate(
      "enrolledCourses",
      "name code"
    );
    const courseIds = user.enrolledCourses.map((c) => c._id);

    // Get all assignments for enrolled courses
    const assignments = await Assignment.find({
      course: { $in: courseIds },
    });

    // Get student's groups
    const groups = await Group.find({ members: studentId });
    const groupIds = groups.map((g) => g._id);

    // Get all submissions
    const submissions = await Submission.find({
      assignment: { $in: assignments.map((a) => a._id) },
      $or: [{ student: studentId }, { group: { $in: groupIds } }],
    });

    // Calculate overall progress
    const totalAssignments = assignments.length;
    const completedAssignments = submissions.filter((s) =>
      ["acknowledged", "submitted", "graded"].includes(s.status)
    ).length;

    const overallProgress =
      totalAssignments > 0
        ? ((completedAssignments / totalAssignments) * 100).toFixed(2)
        : 0;

    // Progress by course
    const progressByCourse = await Promise.all(
      user.enrolledCourses.map(async (course) => {
        const courseAssignments = assignments.filter((a) =>
          a.course.equals(course._id)
        );

        const courseSubmissions = submissions.filter((s) =>
          courseAssignments.some((a) => a._id.equals(s.assignment))
        );

        const completed = courseSubmissions.filter((s) =>
          ["acknowledged", "submitted", "graded"].includes(s.status)
        ).length;

        return {
          courseId: course._id,
          courseName: course.name,
          courseCode: course.code,
          totalAssignments: courseAssignments.length,
          completedAssignments: completed,
          progress:
            courseAssignments.length > 0
              ? ((completed / courseAssignments.length) * 100).toFixed(2)
              : 0,
        };
      })
    );

    // Upcoming deadlines
    const upcomingAssignments = assignments
      .filter((a) => new Date(a.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map((a) => ({
        id: a._id,
        title: a.title,
        type: a.type,
        dueDate: a.dueDate,
        courseId: a.course,
      }));

    // Recent submissions
    const recentSubmissions = submissions
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 5);

    res.json({
      totalCourses: courseIds.length,
      totalAssignments,
      completedAssignments,
      overallProgress: parseFloat(overallProgress),
      progressByCourse,
      upcomingAssignments,
      recentSubmissions,
      totalGroups: groups.length,
    });
  } catch (error) {
    console.error("Get student analytics error:", error);
    res.status(500).json({ error: "Failed to fetch student analytics" });
  }
});

module.exports = router;
