import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const AssignmentPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user, API_URL } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchAssignmentData();
  }, [assignmentId]);

  const fetchAssignmentData = async () => {
    setLoading(true);
    try {
      // Fetch assignment details
      const assignmentRes = await axios.get(
        `${API_URL}/api/assignments/${assignmentId}`
      );
      setAssignment(assignmentRes.data);

      // If student, fetch groups and submission data
      if (user.role === "student") {
        // Fetch user's groups for this course
        const groupsRes = await axios.get(
          `${API_URL}/api/groups?courseId=${assignmentRes.data.course._id}`
        );
        setGroups(groupsRes.data);

        // If group assignment, preselect user's group
        if (assignmentRes.data.type === "group" && groupsRes.data.length > 0) {
          const userGroup = groupsRes.data.find((group) =>
            group.members.some((member) => member._id === user.id)
          );
          if (userGroup) {
            setSelectedGroup(userGroup._id);
          }
        }

        // Check if user already has a submission
        if (assignmentRes.data.userSubmission) {
          setSubmission(assignmentRes.data.userSubmission);
        }
      }
    } catch (error) {
      console.error("Error fetching assignment data:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.error || "Failed to load assignment details",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async (status = "acknowledged") => {
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const submissionData = {
        assignmentId: assignmentId,
        status: status,
        submissionLink: assignment.oneDriveLink,
      };

      // Add group ID for group assignments
      if (assignment.type === "group") {
        if (!selectedGroup) {
          setMessage({
            type: "error",
            text: "Please select a group for group assignments",
          });
          setSubmitting(false);
          return;
        }
        submissionData.groupId = selectedGroup;
      }

      const response = await axios.post(
        `${API_URL}/api/submissions`,
        submissionData
      );
      setSubmission(response.data.submission);
      setMessage({
        type: "success",
        text: response.data.message,
      });

      // Refresh assignment data to get updated submission status
      fetchAssignmentData();
    } catch (error) {
      console.error("Submission error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to submit assignment",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "acknowledged":
      case "submitted":
        return <span className="badge badge-success">Submitted</span>;
      case "pending":
        return <span className="badge badge-warning">Pending</span>;
      case "graded":
        return <span className="badge badge-info">Graded</span>;
      default:
        return <span className="badge badge-danger">Not Submitted</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading assignment details..." />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
          title="Assignment Not Found"
          description="The assignment you're looking for doesn't exist or you don't have access to it."
          actionLabel="Back to Dashboard"
          onAction={() =>
            navigate(user.role === "admin" ? "/admin" : "/student")
          }
        />
      </div>
    );
  }

  const isOverdue = new Date(assignment.dueDate) < new Date();
  const daysUntilDue = Math.ceil(
    (new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/course/${assignment.course._id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
            Back to {assignment.course.name}
          </motion.button>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className="badge badge-info capitalize">
                  {assignment.type}
                </span>
                {submission && getStatusBadge(submission.status)}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {assignment.title}
              </h1>
              <p className="text-gray-600">
                Course: {assignment.course.name} ({assignment.course.code})
              </p>
            </div>

            <div className="text-right">
              <p
                className={`text-lg font-semibold ${
                  isOverdue
                    ? "text-red-600"
                    : daysUntilDue <= 3
                    ? "text-yellow-600"
                    : "text-gray-900"
                }`}
              >
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </p>
              {isOverdue && <p className="text-red-500 text-sm">Overdue</p>}
              {!isOverdue && daysUntilDue <= 3 && (
                <p className="text-yellow-600 text-sm">
                  {daysUntilDue} days left
                </p>
              )}
            </div>
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
                  className="text-lg font-bold hover:text-gray-700"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assignment Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {assignment.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {assignment.description}
                </p>
              </motion.div>
            )}

            {/* Instructions */}
            {assignment.instructions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Instructions
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {assignment.instructions}
                </p>
              </motion.div>
            )}

            {/* Submission Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Submission Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Maximum Marks:</span>
                  <span className="font-semibold">{assignment.maxMarks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Assignment Type:</span>
                  <span className="font-semibold capitalize">
                    {assignment.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-semibold">
                    {new Date(assignment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Submission Panel - Right Column */}
          {user.role === "student" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="card sticky top-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Submit Assignment
                </h3>

                {/* OneDrive Link */}
                {assignment.oneDriveLink && (
                  <div className="mb-6">
                    <a
                      href={assignment.oneDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors mb-3"
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
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      Open OneDrive Folder
                    </a>
                    <p className="text-sm text-gray-600 text-center">
                      Upload your work to the OneDrive folder above
                    </p>
                  </div>
                )}

                {/* Group Selection for Group Assignments */}
                {assignment.type === "group" && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Your Group
                    </label>
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">Choose your group</option>
                      {groups.map((group) => (
                        <option key={group._id} value={group._id}>
                          {group.name} ({group.memberCount} members)
                        </option>
                      ))}
                    </select>
                    {groups.length === 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        You are not in any groups for this course.
                        <button
                          onClick={() =>
                            navigate(`/course/${assignment.course._id}`)
                          }
                          className="text-blue-600 hover:text-blue-700 ml-1 font-semibold"
                        >
                          Create a group first.
                        </button>
                      </p>
                    )}
                  </div>
                )}

                {/* Submission Status */}
                {submission ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center">
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Submission Recorded
                    </h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <p>
                        Status:{" "}
                        <span className="capitalize font-medium">
                          {submission.status}
                        </span>
                      </p>
                      {submission.acknowledgedAt && (
                        <p>
                          Submitted:{" "}
                          {new Date(submission.acknowledgedAt).toLocaleString()}
                        </p>
                      )}
                      {submission.marks !== undefined && (
                        <p>
                          Marks:{" "}
                          <span className="font-bold">
                            {submission.marks}/{assignment.maxMarks}
                          </span>
                        </p>
                      )}
                      {submission.feedback && (
                        <div>
                          <p className="font-medium mt-2">Feedback:</p>
                          <p className="mt-1">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Submit Button */
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSubmitAssignment("acknowledged")}
                    disabled={
                      submitting ||
                      (assignment.type === "group" && !selectedGroup)
                    }
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      "Acknowledge Submission"
                    )}
                  </motion.button>
                )}

                {/* Help Text */}
                {!submission && (
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Click to acknowledge that you've submitted your work to the
                    OneDrive folder
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Admin View */}
          {user.role === "admin" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Professor Actions
                </h3>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      navigate(`/assignment/${assignmentId}/submissions`)
                    }
                    className="w-full btn-secondary"
                  >
                    View Submissions
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setMessage({
                        type: "info",
                        text: "Edit assignment feature coming soon",
                      })
                    }
                    className="w-full btn-primary"
                  >
                    Edit Assignment
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentPage;
