import React from 'react';

const MobileHeader = ({ icon: Icon, title, description }) => (
  <div className="md:hidden">
    {/* Mobile Header */}
    <div className="fixed top-0 left-0 right-0 z-20 
      bg-white/10 backdrop-blur-lg border-b border-white/10
      px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8">
          <Icon className="text-xl text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
        </div>
      </div>
      <p className="text-sm text-white/60 mt-0.5 ml-11">{description}</p>
    </div>
    
    {/* Spacer for fixed header */}
    <div className="h-[72px] md:hidden" />
  </div>
);

export default MobileHeader; 