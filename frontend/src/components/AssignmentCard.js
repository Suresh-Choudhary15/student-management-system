import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AssignmentCard = ({ assignment, onSubmit, submissionStatus }) => {
  const navigate = useNavigate();

  const isOverdue = new Date(assignment.dueDate) < new Date();
  const daysUntilDue = Math.ceil(
    (new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const getStatusBadge = () => {
    if (!submissionStatus) {
      return <span className="badge badge-danger">Not Submitted</span>;
    }

    switch (submissionStatus.status) {
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

  const getTypeIcon = () => {
    if (assignment.type === "group") {
      return (
        <svg
          className="w-5 h-5"
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
      );
    }
    return (
      <svg
        className="w-5 h-5"
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
    );
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} className="card card-hover">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="text-gray-600">{getTypeIcon()}</div>
            <span className="text-sm font-medium text-gray-600 capitalize">
              {assignment.type} Assignment
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {assignment.title}
          </h3>
          {assignment.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {assignment.description}
            </p>
          )}
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-3">
        {/* Due Date */}
        <div className="flex items-center space-x-2 text-sm">
          <svg
            className="w-5 h-5 text-gray-500"
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
          <span
            className={`font-medium ${
              isOverdue
                ? "text-red-600"
                : daysUntilDue <= 3
                ? "text-yellow-600"
                : "text-gray-700"
            }`}
          >
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
            {isOverdue && " (Overdue)"}
            {!isOverdue && daysUntilDue <= 3 && ` (${daysUntilDue} days left)`}
          </span>
        </div>

        {/* OneDrive Link */}
        {assignment.oneDriveLink && (
          <a
            href={assignment.oneDriveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              className="w-5 h-5"
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
            <span>View Submission Link</span>
          </a>
        )}

        {/* Marks */}
        {assignment.maxMarks && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg
              className="w-5 h-5"
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
            <span>Max Marks: {assignment.maxMarks}</span>
            {submissionStatus?.marks !== undefined && (
              <span className="font-semibold text-blue-600">
                | Your Score: {submissionStatus.marks}/{assignment.maxMarks}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() =>
            navigate(`/assignment/${assignment._id || assignment.id}`)
          }
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          View Details
        </motion.button>

        {!submissionStatus && onSubmit && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onSubmit(assignment);
            }}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Submit
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default AssignmentCard;
