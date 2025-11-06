import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import CourseCard from "../components/CourseCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ProgressBar from "../components/ProgressBar";

const StudentDashboard = () => {
  const { user, logout, API_URL } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("courses");

  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch enrolled courses
      const coursesRes = await axios.get(`${API_URL}/api/courses`);
      // console.log("📚 Courses API Response:", coursesRes.data);
      // console.log("📚 Number of courses:", coursesRes.data.length);
      setCourses(coursesRes.data);

      // Fetch student analytics
      const analyticsRes = await axios.get(
        `${API_URL}/api/analytics/student/dashboard`
      );
      // console.log("📊 Analytics API Response:", analyticsRes.data);
      setAnalytics(analyticsRes.data);

      // Get upcoming assignments
      if (analyticsRes.data.upcomingAssignments) {
        setUpcomingAssignments(analyticsRes.data.upcomingAssignments);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: "error", text: "Failed to load dashboard data" });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollCourse = () => {
    // In a real app, this would show a modal to enter course code
    setMessage({
      type: "info",
      text: "Course enrollment feature - contact your professor for course codes",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading your courses..." />
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
                Welcome back, {user?.name?.split(" ")[0]}! 👋
              </motion.h1>
              <p className="text-gray-600 mt-1">
                Ready to learn something new today?
              </p>
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
                    Enrolled Courses
                  </p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {analytics.totalCourses}
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
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
                    Total Assignments
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
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {analytics.completedAssignments}
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
                    Overall Progress
                  </p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {Math.round(analytics.overallProgress)}%
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
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Overall Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Overall Progress
            </h3>
            <ProgressBar progress={analytics.overallProgress} height="h-6" />
            <p className="text-sm text-gray-600 mt-2">
              {analytics.completedAssignments} of {analytics.totalAssignments}{" "}
              assignments completed
            </p>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          {["courses", "assignments", "progress"].map((tab) => (
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
                onClick={handleEnrollCourse}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md"
              >
                + Enroll in Course
              </motion.button>
            </div>

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
                description="You haven't enrolled in any courses yet. Contact your professor to get course codes."
                actionLabel="Learn More"
                onAction={handleEnrollCourse}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                {courses.map((course, index) => (
                  <motion.div
                    key={course._id || course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CourseCard course={course} role="student" />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Upcoming Assignments Tab */}
        {activeTab === "assignments" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="pb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Upcoming Assignments
            </h2>

            {upcomingAssignments.length === 0 ? (
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                title="All Caught Up!"
                description="You don't have any upcoming assignments. Great job!"
              />
            ) : (
              <div className="space-y-4">
                {upcomingAssignments.map((assignment, index) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card card-hover cursor-pointer"
                    onClick={() => navigate(`/assignment/${assignment.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 capitalize">
                          {assignment.type} Assignment
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm text-gray-600">
                            Due:{" "}
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className="badge badge-warning">Pending</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Progress Tab */}
        {activeTab === "progress" && analytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="pb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Course Progress
            </h2>

            {analytics.progressByCourse &&
            analytics.progressByCourse.length > 0 ? (
              <div className="space-y-6">
                {analytics.progressByCourse.map((course, index) => (
                  <motion.div
                    key={course.courseId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {course.courseName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {course.courseCode}
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {Math.round(course.progress)}%
                      </span>
                    </div>
                    <ProgressBar progress={course.progress} />
                    <p className="text-sm text-gray-600 mt-2">
                      {course.completedAssignments} of {course.totalAssignments}{" "}
                      assignments completed
                    </p>
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                }
                title="No Progress Data"
                description="Enroll in courses to see your progress"
              />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
