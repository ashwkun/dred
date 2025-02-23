import React from 'react';

export function LoadingSpinner({ size = 'lg' }) {
  const sizeClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  const ballSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${ballSizes[size]}
            rounded-full
            bg-gradient-to-br from-primary to-purple-500
            shadow-lg
            animate-bounce-delayed
            backdrop-blur-sm
            relative
          `}
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        >
          {/* Glassmorphic effect */}
          <div className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-sm"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-[15%] top-[5%] rounded-full bg-white/40"></div>
          
          {/* Shadow on surface */}
          <div 
            className="absolute -bottom-1 w-full h-1 bg-black/20 rounded-full blur-sm"
            style={{
              animationDelay: `${i * 0.15}s`,
              animation: 'shadow-bounce 0.6s infinite'
            }}
          ></div>
        </div>
      ))}
    </div>
  );
} 