import React from "react";
import { motion } from "framer-motion";

const ProgressBar = ({
  progress,
  showPercentage = true,
  height = "h-4",
  color = "bg-blue-600",
}) => {
  return (
    <div className="w-full">
      <div
        className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}
      >
        <motion.div
          className={`${color} ${height} rounded-full flex items-center justify-center text-white text-xs font-bold`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {showPercentage && progress > 10 && (
            <span className="px-2">{Math.round(progress)}%</span>
          )}
        </motion.div>
      </div>
      {showPercentage && progress <= 10 && (
        <p className="text-sm text-gray-600 mt-1 text-right">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
