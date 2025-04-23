import React from 'react';
import { BiX } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default' // Can be 'default', 'danger', or 'success'
}) {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-gradient-to-r from-red-500/30 to-red-600/30 hover:from-red-500/40 hover:to-red-600/40 text-red-400 border-red-500/30';
      case 'success':
        return 'bg-gradient-to-r from-green-500/30 to-green-600/30 hover:from-green-500/40 hover:to-green-600/40 text-green-400 border-green-500/30';
      default:
        return 'bg-gradient-to-r from-indigo-500/30 to-purple-600/30 hover:from-indigo-500/40 hover:to-purple-600/40 text-white border-indigo-500/30';
    }
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 300,
        duration: 0.4 
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 10, 
      transition: { 
        duration: 0.2 
      } 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <motion.div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
          />
          
          {/* Dialog */}
          <motion.div 
            className="relative bg-black/30 backdrop-blur-xl border border-white/20 
              rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dialogVariants}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            
            <div className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {title}
                </h3>
                <motion.button 
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BiX className="text-xl" />
                </motion.button>
              </div>
              <p className="text-sm text-white/80 mb-6">
                {message}
              </p>
            </div>
            
            <div className="flex border-t border-white/10 relative z-10">
              <motion.button
                onClick={onClose}
                className="flex-1 px-4 py-3.5 text-sm font-medium text-white/80 
                  hover:bg-white/10 transition-colors"
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                {cancelText}
              </motion.button>
              <motion.button
                onClick={onConfirm}
                className={`flex-1 px-4 py-3.5 text-sm font-medium transition-all shadow-sm 
                  ${getTypeStyles()} border-l`}
                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 