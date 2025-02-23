import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export function LoadingOverlay({ message = "Loading", submessage = "Please wait..." }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-md">
      <div className="flex flex-col items-center gap-8">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
          <LoadingSpinner size="lg" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-medium text-white">{message}</p>
          <p className="text-white/70 animate-pulse">{submessage}</p>
        </div>
      </div>
    </div>
  );
} 