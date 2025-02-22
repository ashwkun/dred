import React, { useState, useEffect } from 'react';

const hints = [
  {
    icon: "🔒",
    title: "Security First",
    message: "Keep your master password safe and never share it"
  },
  {
    icon: "🔐",
    title: "End-to-End Encrypted",
    message: "All card details are encrypted in your browser"
  },
  {
    icon: "💪",
    title: "Strong Password",
    message: "Use mixed characters for better security"
  },
  {
    icon: "🔑",
    title: "Local Decryption",
    message: "Your data is only decrypted on your device"
  },
  {
    icon: "⚡",
    title: "Stay Safe",
    message: "Remember to log out on shared devices"
  },
  {
    icon: "💾",
    title: "Regular Backups",
    message: "Keep your cards backed up and secure"
  }
];

function AppHints() {
  const [currentHint, setCurrentHint] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentHint((prev) => (prev + 1) % hints.length);
        setIsTransitioning(false);
      }, 200);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const hint = hints[currentHint];

  return (
    <div className="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-3 mb-4">
      <div className="flex items-center gap-3 h-[3rem]">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg">
          <span className="text-lg">{hint.icon}</span>
        </div>
        <div className={`flex-grow transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <h3 className="text-sm font-medium text-white/90">
            {hint.title}
          </h3>
          <p className="text-xs text-white/60">
            {hint.message}
          </p>
        </div>
        <div className="flex-shrink-0 flex gap-1">
          {hints.map((_, index) => (
            <div 
              key={index}
              className={`w-1 h-1 rounded-full transition-colors duration-300 ${
                index === currentHint 
                  ? 'bg-white/70' 
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AppHints; 