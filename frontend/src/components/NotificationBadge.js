import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const NotificationBadge = ({ count, color = "bg-red-600" }) => {
  if (!count || count === 0) return null;

  return (
    <AnimatePresence>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className={`absolute -top-1 -right-1 ${color} text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`}
      >
        {count > 9 ? "9+" : count}
      </motion.span>
    </AnimatePresence>
  );
};

export default NotificationBadge;
