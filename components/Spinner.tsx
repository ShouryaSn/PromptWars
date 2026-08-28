"use client";

import { motion } from "framer-motion";

export default function Spinner({ size = "h-10 w-10" }: { size?: string }) {
  return (
    <div className={`relative ${size}`}>
      <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-t-accent border-r-accent/40 border-b-transparent border-l-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
