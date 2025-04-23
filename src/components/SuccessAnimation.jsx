import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function SuccessAnimation({ message = "Success!" }) {
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-8 
            flex flex-col items-center shadow-xl max-w-[90%] md:max-w-[400px] mx-auto"
          initial={{ scale: 0.8, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 10 }}
          transition={{ 
            type: "spring",
            damping: 25,
            stiffness: 300
          }}
        >
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-green-500/30 to-green-600/30 
              rounded-full flex items-center justify-center mb-5 border border-green-500/30"
            initial={{ scale: 0.5 }}
            animate={{ 
              scale: [0.5, 1.2, 1],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 0.5,
              times: [0, 0.6, 1]
            }}
          >
            <motion.svg 
              className="w-10 h-10 text-green-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ 
                duration: 0.5,
                delay: 0.2
              }}
            >
              <motion.path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ 
                  duration: 0.6,
                  delay: 0.3,
                  ease: "easeInOut"
                }}
              />
            </motion.svg>
          </motion.div>
          <motion.p 
            className="text-white text-xl font-medium text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {message}
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 