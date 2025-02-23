import React from 'react';

export function LoadingSpinner({ size = 'lg' }) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-primary animate-spin-fast"></div>
        <div className="absolute inset-0 rounded-full border-4 border-b-transparent border-secondary animate-spin-slow"></div>
        <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-md"></div>
      </div>
    </div>
  );
} 