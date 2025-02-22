import React, { useState, useEffect } from 'react';

function LockoutTimer({ minutesLeft }) {
  const [timeLeft, setTimeLeft] = useState(minutesLeft * 60);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const funnyMessages = [
    "Time to grab a coffee ☕",
    "Maybe try meditation? 🧘‍♂️",
    "Perfect time for a power nap 😴",
    "Did you try turning it off and on again? 🔄",
    "Patience is a virtue... or so they say 🤔"
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-lg">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full border border-white/20 text-center">
        <h3 className="text-xl font-bold text-white mb-2">Account Locked</h3>
        <div className="text-3xl font-mono text-white mb-4">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <p className="text-white/70 text-sm mb-4">
          Too many failed attempts. Please wait before trying again.
        </p>
        <p className="text-white/60 text-sm italic">
          {funnyMessages[Math.floor(Math.random() * funnyMessages.length)]}
        </p>
      </div>
    </div>
  );
}

export default LockoutTimer; 