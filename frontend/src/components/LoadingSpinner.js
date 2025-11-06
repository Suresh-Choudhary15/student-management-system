import React from "react";

const LoadingSpinner = ({ size = "medium", text = "Loading..." }) => {
  const sizeClasses = {
    small: "w-6 h-6 border-2",
    medium: "w-12 h-12 border-3",
    large: "w-16 h-16 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`spinner ${sizeClasses[size]}`}></div>
      {text && (
        <p className="mt-4 text-gray-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
