import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user, logout, API_URL } = useAuth();
  const [activeTab, setActiveTab] = useState("analytics");

  const [assignments, setAssignments] = useState([]);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    due_date: "",
    onedrive_link: "",
  });

  const [submissions, setSubmissions] = useState([]);
  const [
    selectedAssignmentForSubmissions,
    setSelectedAssignmentForSubmissions,
  ] = useState("");

  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalGroups: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    submissionRate: 0,
    recentSubmissions: [],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchAssignments();
    fetchSubmissions();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (selectedAssignmentForSubmissions) {
      fetchAssignmentSubmissions(selectedAssignmentForSubmissions);
    } else {
      fetchSubmissions();
    }
  }, [selectedAssignmentForSubmissions]);

  // ADD THIS: Refresh analytics when switching to analytics tab
  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assignments`);
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/submissions`);
      setSubmissions(response.data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const fetchAssignmentSubmissions = async (assignmentId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/submissions/assignment/${assignmentId}`
      );
      setSubmissions(response.data);
    } catch (error) {
      console.error("Error fetching assignment submissions:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/analytics/overview`);
      console.log("Analytics response:", response.data); // Debug log
      setAnalytics({
        totalStudents: response.data.totalStudents || 0,
        totalGroups: response.data.totalGroups || 0,
        totalAssignments: response.data.totalAssignments || 0,
        totalSubmissions: response.data.totalSubmissions || 0,
        submissionRate: response.data.submissionRate || 0,
        recentSubmissions: response.data.recentSubmissions || [],
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setMessage({
        type: "error",
        text: "Failed to load analytics. Please refresh.",
      });
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
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/assignments`, assignmentForm);
      setMessage({ type: "success", text: "Assignment created successfully!" });
      setAssignmentForm({
        title: "",
        description: "",
        due_date: "",
        onedrive_link: "",
      });
      setShowCreateAssignment(false);
      fetchAssignments();
      fetchAnalytics(); // Refresh analytics
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to create assignment",
      });
    }
    setLoading(false);
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `${API_URL}/api/assignments/${editingAssignment.id}`,
        assignmentForm
      );
      setMessage({ type: "success", text: "Assignment updated successfully!" });
      setEditingAssignment(null);
      setAssignmentForm({
        title: "",
        description: "",
        due_date: "",
        onedrive_link: "",
      });
      fetchAssignments();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to update assignment",
      });
    }
    setLoading(false);
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/assignments/${id}`);
      setMessage({ type: "success", text: "Assignment deleted successfully!" });
      fetchAssignments();
      fetchAnalytics(); // Refresh analytics
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to delete assignment",
      });
    }
    setLoading(false);
  };

  const startEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date.split("T")[0],
      onedrive_link: assignment.onedrive_link || "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Welcome, Professor {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {message.text && (
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div
            className={`p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : message.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {message.text}
            <button
              onClick={() => setMessage({ type: "", text: "" })}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "analytics"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "assignments"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Manage Assignments
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "submissions"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Track Submissions
          </button>
        </div>

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.totalStudents}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Groups</p>
                <p className="text-3xl font-bold text-green-600">
                  {analytics.totalGroups}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Assignments</p>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.totalAssignments}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Submissions</p>
                <p className="text-3xl font-bold text-orange-600">
                  {analytics.totalSubmissions}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                Overall Submission Rate
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-8">
                    <div
                      className="bg-blue-500 h-8 rounded-full flex items-center justify-center text-white font-semibold transition-all"
                      style={{
                        width: `${Math.min(analytics.submissionRate, 100)}%`,
                      }}
                    >
                      {analytics.submissionRate > 0 &&
                        `${analytics.submissionRate}%`}
                    </div>
                  </div>
                </div>
                <span className="text-xl font-bold text-gray-700">
                  {analytics.submissionRate}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Submissions</h3>
              <div className="space-y-4">
                {analytics.recentSubmissions &&
                analytics.recentSubmissions.length > 0 ? (
                  analytics.recentSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {submission.assignment_title}
                          </h4>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Group:</span>{" "}
                              {submission.group_name}
                              {submission.member_count && (
                                <span className="text-gray-500">
                                  {" "}
                                  ({submission.member_count} member
                                  {submission.member_count > 1 ? "s" : ""})
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Submitted by:</span>{" "}
                              {submission.submitted_by}
                            </p>
                            {submission.all_members &&
                              submission.all_members.length > 0 && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">
                                    Group Members:
                                  </span>{" "}
                                  {submission.all_members.join(", ")}
                                </p>
                              )}
                            {submission.confirmed_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                <span className="font-medium">Confirmed:</span>{" "}
                                {new Date(
                                  submission.confirmed_at
                                ).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No submissions yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Manage Assignments</h2>
              <button
                onClick={() => {
                  setShowCreateAssignment(true);
                  setEditingAssignment(null);
                  setAssignmentForm({
                    title: "",
                    description: "",
                    due_date: "",
                    onedrive_link: "",
                  });
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                + Create Assignment
              </button>
            </div>

            {(showCreateAssignment || editingAssignment) && (
              <form
                onSubmit={
                  editingAssignment
                    ? handleUpdateAssignment
                    : handleCreateAssignment
                }
                className="mb-6 p-4 bg-gray-50 rounded-lg"
              >
                <h3 className="font-semibold mb-4">
                  {editingAssignment
                    ? "Edit Assignment"
                    : "Create New Assignment"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={assignmentForm.title}
                      onChange={handleAssignmentFormChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={assignmentForm.description}
                      onChange={handleAssignmentFormChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      value={assignmentForm.due_date}
                      onChange={handleAssignmentFormChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      OneDrive Link
                    </label>
                    <input
                      type="url"
                      name="onedrive_link"
                      value={assignmentForm.onedrive_link}
                      onChange={handleAssignmentFormChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      {editingAssignment ? "Update" : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateAssignment(false);
                        setEditingAssignment(null);
                        setAssignmentForm({
                          title: "",
                          description: "",
                          due_date: "",
                          onedrive_link: "",
                        });
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {assignment.title}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {assignment.description}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Due:{" "}
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                      {assignment.onedrive_link && (
                        <a
                          href={assignment.onedrive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-sm mt-2 inline-block"
                        >
                          OneDrive Link →
                        </a>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Submissions: {assignment.submission_count || 0}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditAssignment(assignment)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No assignments created yet
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "submissions" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Track Submissions</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Filter by Assignment
              </label>
              <select
                value={selectedAssignmentForSubmissions}
                onChange={(e) =>
                  setSelectedAssignmentForSubmissions(e.target.value)
                }
                className="w-full md:w-1/2 px-3 py-2 border rounded-lg"
              >
                <option value="">All Assignments</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {submission.assignment_title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Group: {submission.group_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Submitted by: {submission.submitted_by_name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {submission.status === "confirmed"
                          ? `Confirmed: ${new Date(
                              submission.confirmed_at
                            ).toLocaleString()}`
                          : "Status: Pending confirmation"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        submission.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {submission.status === "confirmed"
                        ? "Confirmed"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No submissions yet
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
