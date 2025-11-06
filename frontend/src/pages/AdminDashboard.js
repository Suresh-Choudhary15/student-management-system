import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import CourseCard from "../components/CourseCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ProgressBar from "../components/ProgressBar";

const AdminDashboard = () => {
  const { user, logout, API_URL } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("courses");

  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    description: "",
    semester: "",
    year: new Date().getFullYear(),
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch courses taught by professor
      const coursesRes = await axios.get(`${API_URL}/api/courses`);
      setCourses(coursesRes.data);

      // Fetch analytics
      const analyticsRes = await axios.get(`${API_URL}/api/analytics/overview`);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: "error", text: "Failed to load dashboard data" });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseFormChange = (e) => {
    setCourseForm({
      ...courseForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/courses`, courseForm);
      setMessage({ type: "success", text: "Course created successfully!" });
      setCourseForm({
        name: "",
        code: "",
        description: "",
        semester: "",
        year: new Date().getFullYear(),
      });
      setShowCreateCourse(false);
      fetchData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to create course",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900"
              >
                Professor Dashboard 👨‍🏫
              </motion.h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold shadow-md"
            >
              Logout
            </motion.button>
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

      {/* Analytics Overview Cards */}
      {analytics && (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Students
                  </p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {analytics.totalStudents}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg
                    className="w-8 h-8 text-blue-600"
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
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Groups
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {analytics.totalGroups}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Assignments
                  </p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {analytics.totalAssignments}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg
                    className="w-8 h-8 text-purple-600"
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
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Submissions
                  </p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {analytics.totalSubmissions}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <svg
                    className="w-8 h-8 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Submission Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Overall Submission Rate
            </h3>
            <ProgressBar progress={analytics.submissionRate} height="h-6" />
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          {["courses", "analytics", "submissions"].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold capitalize transition-all ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateCourse(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md"
              >
                + Create Course
              </motion.button>
            </div>

            {/* Create Course Modal */}
            <AnimatePresence>
              {showCreateCourse && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowCreateCourse(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Create New Course
                    </h3>
                    <form onSubmit={handleCreateCourse} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Course Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={courseForm.name}
                          onChange={handleCourseFormChange}
                          className="input-field"
                          placeholder="e.g., Web Development"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Course Code
                        </label>
                        <input
                          type="text"
                          name="code"
                          value={courseForm.code}
                          onChange={handleCourseFormChange}
                          className="input-field"
                          placeholder="e.g., CS101"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={courseForm.description}
                          onChange={handleCourseFormChange}
                          className="input-field"
                          rows="3"
                          placeholder="Course description..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Semester
                          </label>
                          <input
                            type="text"
                            name="semester"
                            value={courseForm.semester}
                            onChange={handleCourseFormChange}
                            className="input-field"
                            placeholder="e.g., Fall"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Year
                          </label>
                          <input
                            type="number"
                            name="year"
                            value={courseForm.year}
                            onChange={handleCourseFormChange}
                            className="input-field"
                            placeholder="2025"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3 pt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={submitting}
                          className="flex-1 btn-primary"
                        >
                          {submitting ? "Creating..." : "Create Course"}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setShowCreateCourse(false)}
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

            {/* Course Cards */}
            {courses.length === 0 ? (
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                }
                title="No Courses Yet"
                description="Create your first course to get started teaching"
                actionLabel="Create Course"
                onAction={() => setShowCreateCourse(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                {courses.map((course, index) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CourseCard course={course} role="admin" />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && analytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="pb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recent Submissions
            </h2>

            {analytics.recentSubmissions &&
            analytics.recentSubmissions.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentSubmissions.map((submission, index) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {submission.assignmentTitle}
                        </h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Type:</span>{" "}
                            {submission.assignmentType}
                          </p>
                          {submission.groupName ? (
                            <>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Group:</span>{" "}
                                {submission.groupName}
                              </p>
                              {submission.groupMembers && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Members:</span>{" "}
                                  {submission.groupMembers.join(", ")}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Student:</span>{" "}
                              {submission.studentName}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Submitted by:</span>{" "}
                            {submission.submittedBy}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              submission.acknowledgedAt ||
                                submission.submittedAt
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          submission.status === "acknowledged" ||
                          submission.status === "submitted"
                            ? "badge-success"
                            : "badge-warning"
                        }`}
                      >
                        {submission.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
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
                title="No Submissions Yet"
                description="Student submissions will appear here"
              />
            )}
          </motion.div>
        )}

        {/* Submissions Tab - placeholder for detailed view */}
        {activeTab === "submissions" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="pb-8"
          >
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              }
              title="Detailed Submissions View"
              description="View submissions from course pages for detailed tracking"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
