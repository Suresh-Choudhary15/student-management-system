import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import AssignmentCard from "../components/AssignmentCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, API_URL } = useAuth();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showEnrollStudent, setShowEnrollStudent] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    type: "individual",
    dueDate: "",
    oneDriveLink: "",
    maxMarks: 100,
    instructions: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      // Fetch course details
      const courseRes = await axios.get(`${API_URL}/api/courses/${courseId}`);
      setCourse(courseRes.data);

      // Fetch assignments for this course
      const assignmentsRes = await axios.get(
        `${API_URL}/api/assignments?courseId=${courseId}`
      );
      setAssignments(assignmentsRes.data);

      // Fetch submissions if student
      if (user.role === "student") {
        const submissionsRes = await axios.get(
          `${API_URL}/api/submissions?courseId=${courseId}`
        );
        setSubmissions(submissionsRes.data);

        // Fetch groups for this course
        const groupsRes = await axios.get(
          `${API_URL}/api/groups?courseId=${courseId}`
        );
        setGroups(groupsRes.data);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
      setMessage({ type: "error", text: "Failed to load course data" });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentFormChange = (e) => {
    setAssignmentForm({
      ...assignmentForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/assignments`, {
        ...assignmentForm,
        courseId: courseId,
      });
      setMessage({ type: "success", text: "Assignment created successfully!" });
      setAssignmentForm({
        title: "",
        description: "",
        type: "individual",
        dueDate: "",
        oneDriveLink: "",
        maxMarks: 100,
        instructions: "",
      });
      setShowCreateAssignment(false);
      fetchCourseData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to create assignment",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/courses/${courseId}/enroll`, {
        studentEmail: studentEmail,
      });
      setMessage({ type: "success", text: "Student enrolled successfully!" });
      setStudentEmail("");
      setShowEnrollStudent(false);
      fetchCourseData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to enroll student",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmissionStatus = (assignmentId) => {
    return submissions.find(
      (s) => s.assignment === assignmentId || s.assignment._id === assignmentId
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading course..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Course Not Found
          </h2>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              navigate(user.role === "admin" ? "/admin" : "/student")
            }
            className="mb-4 flex items-center text-white hover:text-gray-200"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </motion.button>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <span className="inline-block px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold mb-3">
                {course.code}
              </span>
              <h1 className="text-4xl font-bold mb-2">{course.name}</h1>
              {course.description && (
                <p className="text-blue-100 text-lg">{course.description}</p>
              )}
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>Professor: {course.professor?.name}</span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>{course.students?.length || 0} Students</span>
                </div>
              </div>
            </div>

            {user.role === "admin" && (
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEnrollStudent(true)}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
                >
                  + Enroll Student
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateAssignment(true)}
                  className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50"
                >
                  + Create Assignment
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Alert */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8"
          >
            <div
              className={`p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 border-l-4 border-green-500 text-green-800"
                  : message.type === "error"
                  ? "bg-red-100 border-l-4 border-red-500 text-red-800"
                  : "bg-blue-100 border-l-4 border-blue-500 text-blue-800"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium">{message.text}</p>
                <button
                  onClick={() => setMessage({ type: "", text: "" })}
                  className="text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {user.role === "admin" ? "Course Assignments" : "Assignments"}
        </h2>

        {/* Assignments Grid */}
        {assignments.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="w-24 h-24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            title="No Assignments Yet"
            description={
              user.role === "admin"
                ? "Create your first assignment to get started"
                : "Your professor hasn't posted any assignments yet"
            }
            actionLabel={
              user.role === "admin" ? "Create Assignment" : undefined
            }
            onAction={
              user.role === "admin"
                ? () => setShowCreateAssignment(true)
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment, index) => (
              <motion.div
                key={assignment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AssignmentCard
                  assignment={assignment}
                  submissionStatus={
                    user.role === "student"
                      ? getSubmissionStatus(assignment._id)
                      : null
                  }
                  onSubmit={(assignment) =>
                    navigate(`/assignment/${assignment._id}`)
                  }
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      <AnimatePresence>
        {showCreateAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateAssignment(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Create Assignment
              </h3>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={assignmentForm.title}
                    onChange={handleAssignmentFormChange}
                    className="input-field"
                    placeholder="Assignment title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={assignmentForm.type}
                    onChange={handleAssignmentFormChange}
                    className="input-field"
                    required
                  >
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={assignmentForm.description}
                    onChange={handleAssignmentFormChange}
                    className="input-field"
                    rows="3"
                    placeholder="Assignment description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={assignmentForm.dueDate}
                      onChange={handleAssignmentFormChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Marks
                    </label>
                    <input
                      type="number"
                      name="maxMarks"
                      value={assignmentForm.maxMarks}
                      onChange={handleAssignmentFormChange}
                      className="input-field"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    OneDrive Submission Link
                  </label>
                  <input
                    type="url"
                    name="oneDriveLink"
                    value={assignmentForm.oneDriveLink}
                    onChange={handleAssignmentFormChange}
                    className="input-field"
                    placeholder="https://onedrive.live.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Instructions
                  </label>
                  <textarea
                    name="instructions"
                    value={assignmentForm.instructions}
                    onChange={handleAssignmentFormChange}
                    className="input-field"
                    rows="4"
                    placeholder="Additional instructions for students"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-primary"
                  >
                    {submitting ? "Creating..." : "Create Assignment"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowCreateAssignment(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enroll Student Modal */}
      <AnimatePresence>
        {showEnrollStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEnrollStudent(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Enroll Student
              </h3>
              <form onSubmit={handleEnrollStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Student Email
                  </label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="input-field"
                    placeholder="student@example.com"
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-primary"
                  >
                    {submitting ? "Enrolling..." : "Enroll Student"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowEnrollStudent(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePage;
