import React, { useState, useEffect } from 'react';
import { BiX } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileNumberDialog({ isOpen, onClose, onSubmit, initialValue = '' }) {
  const [mobileNumber, setMobileNumber] = useState(initialValue);
  const [error, setError] = useState('');

  // Update mobileNumber when initialValue changes
  useEffect(() => {
    if (initialValue) {
      setMobileNumber(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = () => {
    if (!/^\d{10}$/.test(mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    onSubmit(mobileNumber);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          <motion.div 
            className="relative bg-black/30 backdrop-blur-xl border border-white/20 
              rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-white">
                  Enter Mobile Number
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
              
              <p className="text-sm text-white/70 mb-4">
                This number will be used to create UPI payment IDs for your credit cards.
              </p>

              <input
                type="tel"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setMobileNumber(value);
                  setError('');
                }}
                placeholder="Enter 10-digit mobile number"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl 
                  text-white placeholder-white/40 mb-2 focus:outline-none focus:ring-2 
                  focus:ring-white/30 focus:border-transparent"
              />

              {error && (
                <motion.p 
                  className="text-sm text-red-400 mb-4"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </div>
            
            <div className="flex border-t border-white/10">
              <motion.button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-medium text-white/70 
                  hover:bg-white/10 transition-colors"
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 text-sm font-medium text-white 
                  bg-gradient-to-r from-indigo-500/30 to-purple-600/30 hover:from-indigo-500/40 hover:to-purple-600/40 transition-all"
                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                Save
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 