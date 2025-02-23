import React from 'react';

export function LoadingSpinner({ size = 'lg' }) {
  const sizeClasses = {
    sm: { dot: 'w-1.5 h-1.5', gap: 'gap-1.5' },
    md: { dot: 'w-2 h-2', gap: 'gap-2' },
    lg: { dot: 'w-2.5 h-2.5', gap: 'gap-3' }
  };

  return (
    <div className={`flex items-center ${sizeClasses[size].gap}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${sizeClasses[size].dot}
            rounded-full
            bg-white/50
            animate-bounce-delayed
          `}
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
} 