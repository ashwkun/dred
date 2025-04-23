import React from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';

export function LoadingOverlay({ message = "Loading", submessage = "Please wait..." }) {
  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="flex flex-col items-center gap-6 p-8 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          damping: 25,
          stiffness: 300,
          delay: 0.1
        }}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        >
          <LoadingSpinner size="lg" />
        </motion.div>
        <div className="flex flex-col items-center gap-1.5">
          <motion.p 
            className="text-lg font-medium text-white/90"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {message}
          </motion.p>
          <motion.p 
            className="text-sm text-white/60"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {submessage}
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
} 