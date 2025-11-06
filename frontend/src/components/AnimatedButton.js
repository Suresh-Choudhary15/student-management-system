import React from "react";
import { motion } from "framer-motion";

const AnimatedButton = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  className = "",
  fullWidth = false,
  ...props
}) => {
  // Base classes
  const baseClasses =
    "rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  // Size variants
  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    medium: "px-4 py-3 text-base",
    large: "px-6 py-4 text-lg",
  };

  // Color variants
  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800 shadow-md hover:shadow-lg",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400",
    success:
      "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 active:bg-green-800 shadow-md hover:shadow-lg",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800 shadow-md hover:shadow-lg",
    warning:
      "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 active:bg-yellow-700 shadow-md hover:shadow-lg",
    outline:
      "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100",
  };

  // Width class
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${widthClass}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default AnimatedButton;
