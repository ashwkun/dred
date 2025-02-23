import React, { useState, useEffect } from 'react';

const hints = [
  // Security Hints
  {
    category: 'security',
    items: [
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
      }
    ]
  },
  // Feature Hints
  {
    category: 'features',
    items: [
      {
        icon: "💳",
        title: "Quick Copy",
        message: "Hover over any card to copy its number"
      },
      {
        icon: "👆",
        title: "View Details",
        message: "Click any card to view CVV and expiry"
      },
      {
        icon: "📱",
        title: "UPI Ready",
        message: "Pay bills directly using UPI feature"
      },
      {
        icon: "🎨",
        title: "Smart Theme",
        message: "Cards automatically match bank colors"
      }
    ]
  },
  // Usage Tips
  {
    category: 'tips',
    items: [
      {
        icon: "⚡",
        title: "Auto Hide",
        message: "Card details hide automatically after 5s"
      },
      {
        icon: "🔄",
        title: "Stay Updated",
        message: "Cards sync automatically across devices"
      },
      {
        icon: "📋",
        title: "Easy Add",
        message: "Add new cards with the + button"
      },
      {
        icon: "💾",
        title: "Always Safe",
        message: "Log out when using shared devices"
      }
    ]
  }
];

function AppHints() {
  const [currentCategory, setCurrentCategory] = useState(0);
  const [currentHint, setCurrentHint] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentHint(prev => {
          const category = hints[currentCategory];
          if (prev + 1 >= category.items.length) {
            setCurrentCategory((currentCategory + 1) % hints.length);
            return 0;
          }
          return prev + 1;
        });
        setIsTransitioning(false);
      }, 200);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentCategory]);

  const currentHintData = hints[currentCategory].items[currentHint];

  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center 
          bg-white/10 rounded-xl backdrop-blur-sm">
          <span className="text-xl">{currentHintData.icon}</span>
        </div>

        {/* Content */}
        <div className={`flex-grow transition-all duration-200 
          ${isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
          <h3 className="text-sm font-medium text-white">
            {currentHintData.title}
          </h3>
          <p className="text-xs text-white/60">
            {currentHintData.message}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex-shrink-0 flex flex-col gap-1.5">
          {hints.map((category, categoryIndex) => (
            <div key={categoryIndex} className="flex gap-1">
              {category.items.map((_, hintIndex) => (
                <div 
                  key={hintIndex}
                  className={`w-1 h-1 rounded-full transition-all duration-300 
                    ${categoryIndex === currentCategory && hintIndex === currentHint
                      ? 'bg-white/70 scale-125' 
                      : 'bg-white/20'
                    }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AppHints; 