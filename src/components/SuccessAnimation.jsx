import React from 'react';

export function SuccessAnimation({ message = "Success!" }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 
        flex flex-col items-center animate-fade-up">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4
          animate-success-pop">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white text-lg font-medium">{message}</p>
      </div>
    </div>
  );
} 