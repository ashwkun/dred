import React from 'react';

export default function MobileHeader({ icon: Icon, title, description }) {
  return (
    <>
      {/* Desktop Header - Stays the same */}
      <div className="hidden md:flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
          <Icon className="text-2xl text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-white/60">{description}</p>
        </div>
      </div>

      {/* New Mobile Header */}
      <div className="md:hidden">
        {/* Top Bar with Icon and Title */}
        <div className="fixed top-0 left-0 right-0 z-30 
          bg-black/20 backdrop-blur-lg border-b border-white/10
          px-4 py-3 flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Icon className="text-xl text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            <p className="text-sm text-white/60">{description}</p>
          </div>
        </div>
        
        {/* Spacer to prevent content from going under the fixed header */}
        <div className="h-[72px]" />
      </div>
    </>
  );
} 