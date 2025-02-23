import React from 'react';

export function LoadingSpinner({ size = 'lg' }) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40',
    lg: 'w-48 h-48'
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Outer rotating ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-purple-500 animate-spin-slow">
        <div className="absolute inset-1 rounded-full bg-black"></div>
      </div>
      
      {/* Middle ring with blur effect */}
      <div className="absolute inset-4 rounded-full bg-white/10 backdrop-blur-xl animate-pulse">
        <div className="absolute inset-2 rounded-full bg-black"></div>
      </div>
      
      {/* Inner spinning element */}
      <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/80 to-purple-500/80 animate-spin-fast">
        <div className="absolute inset-1 rounded-full bg-black"></div>
      </div>

      {/* Center static element */}
      <div className="absolute inset-[38%] rounded-full bg-white/20 backdrop-blur-xl shadow-lg"></div>

      {/* Glassmorphic overlay */}
      <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-sm shadow-xl"></div>

      {/* Decorative dots */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-white/30 backdrop-blur-sm"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 30}deg) translateY(-150%) translate(-50%, -50%)`,
          }}
        ></div>
      ))}
    </div>
  );
} 