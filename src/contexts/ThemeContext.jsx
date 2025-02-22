import React, { createContext, useContext, useState, useEffect } from 'react';

const themes = {
  default: {
    name: 'Default Dred',
    gradient: 'from-[#2A2A72] to-[#6A3DE8]',
    accent: '#6a3de8',
    description: 'Classic purple gradient'
  },
  amoled: {
    name: 'AMOLED Black',
    gradient: 'from-black to-black',
    accent: '#000000',
    description: 'Pure black theme'
  },
  darkNavy: {
    name: 'Dark Navy',
    gradient: 'from-[#1a1a2e] to-[#2a2a4a]',
    accent: '#4a4a8a',
    description: 'Deep navy blue'
  },
  emerald: {
    name: 'Emerald',
    gradient: 'from-[#064e3b] to-[#059669]',
    accent: '#10b981',
    description: 'Rich emerald green'
  },
  midnight: {
    name: 'Midnight Blue',
    gradient: 'from-[#1e3a8a] to-[#3b82f6]',
    accent: '#3b82f6',
    description: 'Deep blue gradient'
  },
  crimson: {
    name: 'Crimson',
    gradient: 'from-[#7f1d1d] to-[#dc2626]',
    accent: '#dc2626',
    description: 'Bold red gradient'
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('dred-theme');
    return saved || 'default';
  });

  useEffect(() => {
    localStorage.setItem('dred-theme', currentTheme);
  }, [currentTheme]);

  const value = {
    currentTheme,
    setCurrentTheme,
    themes,
    currentThemeData: themes[currentTheme]
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 