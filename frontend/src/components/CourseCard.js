import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const CourseCard = ({ course, role = "student" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/course/${course._id || course.id}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden border border-gray-100"
      onClick={handleClick}
    >
      {/* Header with gradient */}
      <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative p-6 h-full flex flex-col justify-between">
          <div>
            <span className="inline-block px-3 py-1 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
              {course.code}
            </span>
          </div>
          <h3 className="text-white font-bold text-xl line-clamp-2">
            {course.name}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {course.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {course.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          {role === "admin" ? (
            <>
              <div className="flex items-center space-x-2">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="text-gray-700 font-medium">
                  {course.studentCount || course.students?.length || 0} Students
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/course/${course._id || course.id}/manage`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Manage
              </motion.button>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    {course.assignmentCount || 0} Assignments
                  </span>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-blue-600 font-semibold text-sm flex items-center"
              >
                View Course
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
