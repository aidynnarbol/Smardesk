import React from "react";
import { motion } from "framer-motion";
import "./PageWrapper.css"; // отдельный CSS для отступов и контейнера

export default function PageWrapper({ children }) {
  return (
    <motion.div
      className="page-wrapper"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
