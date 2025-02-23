import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export function LoadingOverlay({ message = "Loading", submessage = "Please wait..." }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6">
        <LoadingSpinner size="lg" />
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-lg font-medium text-white/90">{message}</p>
          <p className="text-sm text-white/50">{submessage}</p>
        </div>
      </div>
    </div>
  );
} 