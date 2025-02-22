import React from 'react';
import { BiX } from 'react-icons/bi';

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
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-400/20 hover:bg-red-400/30 text-red-400';
      case 'success':
        return 'bg-green-400/20 hover:bg-green-400/30 text-green-400';
      default:
        return 'bg-white/20 hover:bg-white/30 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 
        rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-fade-in"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              {title}
            </h3>
            <button 
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <BiX className="text-xl" />
            </button>
          </div>
          <p className="text-sm text-white/70 mb-2">
            {message}
          </p>
        </div>
        
        <div className="flex border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium text-white/70 
              hover:bg-white/10 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${getTypeStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 