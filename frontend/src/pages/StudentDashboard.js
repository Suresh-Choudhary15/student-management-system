import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const StudentDashboard = () => {
  const { user, logout, API_URL } = useAuth();
  const [activeTab, setActiveTab] = useState("assignments");

  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitStep, setSubmitStep] = useState(1);
  const [selectedGroupForSubmit, setSelectedGroupForSubmit] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchMyGroups();
    fetchAssignments();
    fetchUsers();
    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupDetails(selectedGroup.id);
    }
  }, [selectedGroup]);

  // ADD THIS: Refresh users when Groups tab is active
  useEffect(() => {
    if (activeTab === "groups") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchMyGroups = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/groups/user/my-groups`);
      setMyGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchGroupDetails = async (groupId) => {
    try {
      const response = await axios.get(`${API_URL}/api/groups/${groupId}`);
      setSelectedGroup(response.data);
    } catch (error) {
      console.error("Error fetching group details:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setUsers(response.data.filter((u) => u.role === "student"));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

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
      const response = await axios.get(
        `${API_URL}/api/submissions/my-submissions`
      );
      setSubmissions(response.data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/groups`, { name: newGroupName });
      setMessage({ type: "success", text: "Group created successfully!" });
      setNewGroupName("");
      setShowCreateGroup(false);
      fetchMyGroups();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to create group",
      });
    }
    setLoading(false);
  };

  const handleAddMember = async () => {
    if (!selectedUser || !selectedGroup) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/groups/${selectedGroup.id}/members`, {
        userId: selectedUser,
      });
      setMessage({ type: "success", text: "Member added successfully!" });
      setSelectedUser("");
      fetchGroupDetails(selectedGroup.id);
      fetchUsers(); // Refresh user list after adding
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to add member",
      });
    }
    setLoading(false);
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    setLoading(true);
    try {
      await axios.delete(
        `${API_URL}/api/groups/${selectedGroup.id}/members/${userId}`
      );
      setMessage({ type: "success", text: "Member removed successfully!" });
      fetchGroupDetails(selectedGroup.id);
      fetchUsers(); // Refresh user list after removing
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to remove member",
      });
    }
    setLoading(false);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !selectedGroupForSubmit) {
      setMessage({ type: "error", text: "Please select a group" });
      return;
    }

    setLoading(true);
    try {
      const status = submitStep === 1 ? "pending" : "confirmed";
      await axios.post(`${API_URL}/api/submissions`, {
        assignment_id: selectedAssignment.id,
        group_id: selectedGroupForSubmit,
        status,
      });

      if (submitStep === 1) {
        setSubmitStep(2);
        setMessage({ type: "info", text: "Please confirm your submission" });
      } else {
        setMessage({
          type: "success",
          text: "Assignment submitted successfully!",
        });
        setShowSubmitModal(false);
        setSubmitStep(1);
        setSelectedGroupForSubmit("");
        setSelectedAssignment(null);
        fetchSubmissions();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Submission failed",
      });
    }
    setLoading(false);
  };

  const calculateGroupProgress = (groupId) => {
    if (assignments.length === 0) return 0;
    const confirmed = submissions.filter(
      (s) => s.group_id === groupId && s.status === "confirmed"
    ).length;
    return Math.round((confirmed / assignments.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Student Dashboard
            </h1>
            <p className="text-gray-600">Welcome, {user?.name}</p>
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
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "assignments"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "groups"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            My Groups
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "progress"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Progress
          </button>
        </div>

        {activeTab === "assignments" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">All Assignments</h2>
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
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
                          View OneDrive Link →
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowSubmitModal(true);
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No assignments available
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "groups" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">My Groups</h2>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  + Create Group
                </button>
              </div>

              {showCreateGroup && (
                <form
                  onSubmit={handleCreateGroup}
                  className="mb-4 p-4 bg-gray-50 rounded-lg"
                >
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                    required
                  />
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateGroup(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {myGroups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedGroup?.id === group.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-gray-600">
                      {group.member_count} member(s)
                    </p>
                  </div>
                ))}
                {myGroups.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No groups yet. Create one!
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Group Details</h2>
              {selectedGroup ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedGroup.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Created by: {selectedGroup.creator_name}
                  </p>

                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Add Member</h4>
                    <div className="flex space-x-2">
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      >
                        <option value="">Select a student...</option>
                        {users
                          .filter(
                            (u) =>
                              !selectedGroup.members?.some((m) => m.id === u.id)
                          )
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={handleAddMember}
                        disabled={!selectedUser || loading}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    {users.filter(
                      (u) => !selectedGroup.members?.some((m) => m.id === u.id)
                    ).length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        All students are already members
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Members</h4>
                    <div className="space-y-2">
                      {selectedGroup.members?.map((member) => (
                        <div
                          key={member.id}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-600">
                              {member.email}
                            </p>
                          </div>
                          {selectedGroup.created_by === user.id &&
                            member.id !== user.id && (
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                              >
                                Remove
                              </button>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Select a group to view details
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Group Progress</h2>
            <div className="space-y-6">
              {myGroups.map((group) => {
                const progress = calculateGroupProgress(group.id);
                return (
                  <div key={group.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{group.name}</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-blue-500 h-4 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-lg font-bold">{progress}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {
                        submissions.filter(
                          (s) =>
                            s.group_id === group.id && s.status === "confirmed"
                        ).length
                      }{" "}
                      of {assignments.length} assignments completed
                    </p>
                  </div>
                );
              })}
              {myGroups.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Join a group to track progress
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Submit Assignment</h3>
            <p className="mb-2">
              <strong>Assignment:</strong> {selectedAssignment.title}
            </p>

            {submitStep === 1 && (
              <>
                <p className="mb-4 text-sm text-gray-600">
                  Select your group and confirm submission
                </p>
                <select
                  value={selectedGroupForSubmit}
                  onChange={(e) => setSelectedGroupForSubmit(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-4"
                  required
                >
                  <option value="">Select a group...</option>
                  {myGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <p className="mb-4 text-sm">
                  Have you uploaded your work to OneDrive?
                </p>
              </>
            )}

            {submitStep === 2 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-semibold mb-2">⚠️ Final Confirmation</p>
                <p className="text-sm">
                  Are you sure you want to confirm this submission? This action
                  marks the assignment as completed.
                </p>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={handleSubmitAssignment}
                disabled={
                  loading || (!selectedGroupForSubmit && submitStep === 1)
                }
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : submitStep === 1
                  ? "Yes, I have submitted"
                  : "Confirm Submission"}
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSubmitStep(1);
                  setSelectedGroupForSubmit("");
                  setSelectedAssignment(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
