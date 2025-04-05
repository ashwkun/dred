import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

// SVG patterns that will be used as backgrounds
const patterns = {
  circuit: (opacity) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="absolute inset-0 pointer-events-none">
      <defs>
        <pattern id="circuit-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path fill="none" stroke={`rgba(255, 255, 255, ${opacity / 100})`} strokeWidth="0.5" d="M10,10 h80 v80 h-80 Z" />
          <circle cx="50" cy="50" r="2" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
          <path fill="none" stroke={`rgba(255, 255, 255, ${opacity / 100})`} strokeWidth="0.5" d="M20,50 H40 M60,50 H80 M50,20 V40 M50,60 V80" />
          <circle cx="10" cy="10" r="1" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
          <circle cx="90" cy="10" r="1" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
          <circle cx="10" cy="90" r="1" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
          <circle cx="90" cy="90" r="1" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit-pattern)" />
    </svg>
  ),
  
  topography: (opacity) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="absolute inset-0 pointer-events-none">
      <defs>
        <pattern id="topography-pattern" width="200" height="200" patternUnits="userSpaceOnUse">
          <path fill="none" stroke={`rgba(255, 255, 255, ${opacity / 100})`} strokeWidth="0.5" d="
            M0,50 Q50,0 100,50 T200,50
            M0,100 Q50,50 100,100 T200,100
            M0,150 Q50,100 100,150 T200,150
          "></path>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#topography-pattern)" />
    </svg>
  ),
  
  constellation: (opacity) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="absolute inset-0 pointer-events-none">
      <defs>
        <pattern id="constellation-pattern" width="200" height="200" patternUnits="userSpaceOnUse">
          <circle cx="25" cy="25" r="1" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
          <circle cx="75" cy="50" r="1" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
          <circle cx="125" cy="25" r="1" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
          <circle cx="175" cy="75" r="1" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
          <circle cx="25" cy="125" r="1" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
          <circle cx="125" cy="125" r="1" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
          <circle cx="175" cy="175" r="1" fill={`rgba(255, 255, 255, ${opacity / 100})`} />
          
          <line x1="25" y1="25" x2="75" y2="50" stroke={`rgba(255, 255, 255, ${opacity / 200})`} strokeWidth="0.3" />
          <line x1="75" y1="50" x2="125" y2="25" stroke={`rgba(255, 255, 255, ${opacity / 200})`} strokeWidth="0.3" />
          <line x1="125" y1="25" x2="175" y2="75" stroke={`rgba(255, 255, 255, ${opacity / 200})`} strokeWidth="0.3" />
          <line x1="175" y1="75" x2="175" y2="175" stroke={`rgba(255, 255, 255, ${opacity / 200})`} strokeWidth="0.3" />
          <line x1="175" y1="175" x2="125" y2="125" stroke={`rgba(255, 255, 255, ${opacity / 200})`} strokeWidth="0.3" />
          <line x1="125" y1="125" x2="25" y2="125" stroke={`rgba(255, 255, 255, ${opacity / 200})`} strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#constellation-pattern)" />
    </svg>
  ),
  
  hexagons: (opacity) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="absolute inset-0 pointer-events-none">
      <defs>
        <pattern id="hexagon-pattern" width="50" height="86.6" patternUnits="userSpaceOnUse">
          <path fill="none" stroke={`rgba(255, 255, 255, ${opacity / 100})`} strokeWidth="0.5" d="
            M25,0 L50,14.4 L50,43.3 L25,57.7 L0,43.3 L0,14.4 Z
            M25,57.7 L50,72.2 L50,86.6 L25,86.6 L0,86.6 L0,72.2 Z
          "></path>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#hexagon-pattern)" />
    </svg>
  ),
  
  graph: (opacity) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="absolute inset-0 pointer-events-none">
      <defs>
        <pattern id="graph-pattern" width="25" height="25" patternUnits="userSpaceOnUse">
          <rect width="25" height="25" fill="none"/>
          <path stroke={`rgba(255, 255, 255, ${opacity / 100})`} strokeWidth="0.3" d="M0,0 L25,0 M0,25 L25,25" />
          <path stroke={`rgba(255, 255, 255, ${opacity / 200})`} strokeWidth="0.2" d="M0,5 L25,5 M0,10 L25,10 M0,15 L25,15 M0,20 L25,20" />
          <path stroke={`rgba(255, 255, 255, ${opacity / 200})`} strokeWidth="0.2" d="M5,0 L5,25 M10,0 L10,25 M15,0 L15,25 M20,0 L20,25" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#graph-pattern)" />
    </svg>
  )
};

function ThemePatterns() {
  const { currentThemeData } = useTheme();
  
  if (!currentThemeData.pattern || currentThemeData.pattern.type === 'none') {
    return null;
  }
  
  const patternRenderer = patterns[currentThemeData.pattern.type];
  
  if (!patternRenderer) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {patternRenderer(currentThemeData.pattern.opacity)}
    </div>
  );
}

export default ThemePatterns; 