import React, { useState } from 'react';
import { BiX } from 'react-icons/bi';

export default function MobileNumberDialog({ isOpen, onClose, onSubmit }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!/^\d{10}$/.test(mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    onSubmit(mobileNumber);
    setMobileNumber('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 
        rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-fade-in"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              Enter Mobile Number
            </h3>
            <button 
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <BiX className="text-xl" />
            </button>
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
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl 
              text-white placeholder-white/40 mb-2"
          />

          {error && (
            <p className="text-sm text-red-400 mb-4">{error}</p>
          )}
        </div>
        
        <div className="flex border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium text-white/70 
              hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 text-sm font-medium text-white 
              bg-white/20 hover:bg-white/30 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 