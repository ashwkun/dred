import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Standard loading with theme-based styling
export const ThemedLoading = ({ message = 'Loading...', size = 'md' }) => {
  const { currentThemeData } = useTheme();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };
  
  const getLoadingAnimation = () => {
    switch(currentThemeData.animations?.loading) {
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} bg-white/60 rounded-full animate-pulse`}></div>
        );
      
      case 'bounce':
        return (
          <div className="flex items-center gap-1">
            <div className={`${sizeClasses.sm} bg-white/60 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`${sizeClasses.sm} bg-white/60 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`${sizeClasses.sm} bg-white/60 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      
      case 'wave':
        return (
          <div className="flex items-center gap-1">
            <div className={`h-6 w-1 bg-white/60 animate-wave`} style={{ animationDelay: '0ms' }}></div>
            <div className={`h-6 w-1 bg-white/60 animate-wave`} style={{ animationDelay: '100ms' }}></div>
            <div className={`h-6 w-1 bg-white/60 animate-wave`} style={{ animationDelay: '200ms' }}></div>
            <div className={`h-6 w-1 bg-white/60 animate-wave`} style={{ animationDelay: '300ms' }}></div>
            <div className={`h-6 w-1 bg-white/60 animate-wave`} style={{ animationDelay: '400ms' }}></div>
          </div>
        );
      
      case 'slide':
        return (
          <div className={`${sizeClasses[size]} relative overflow-hidden rounded-full border border-white/40`}>
            <div className="absolute inset-0 -translate-x-full animate-slide bg-white/60"></div>
          </div>
        );
      
      case 'glow':
        return (
          <div className={`${sizeClasses[size]} border-2 border-white/40 rounded-full animate-pulse 
            shadow-[0_0_10px_rgba(255,255,255,0.5)] opacity-70`}>
          </div>
        );
      
      case 'simple':
        return (
          <div className={`${sizeClasses[size]} border border-white/60 border-t-transparent rounded-full`}
            style={{ animation: 'spin-slow 1.5s linear infinite' }}>
          </div>
        );
      
      // Default spin animation
      default:
        return (
          <div className={`${sizeClasses[size]} border-2 border-white/20 border-t-white rounded-full animate-spin`}>
          </div>
        );
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {getLoadingAnimation()}
      {message && <p className="text-white/70 text-sm font-medium">{message}</p>}
    </div>
  );
};

// Enhanced overlay with themed animations
export const ThemedLoadingOverlay = ({ message = 'Loading...', blur = false }) => {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center
      ${blur ? 'backdrop-blur-sm' : ''} bg-black/30`}>
      <div className="p-6 rounded-2xl bg-black/40 backdrop-blur-lg shadow-xl">
        <ThemedLoading message={message} size="lg" />
      </div>
    </div>
  );
};

export default { ThemedLoading, ThemedLoadingOverlay }; 