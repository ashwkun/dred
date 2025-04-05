import React, { createContext, useContext, useState, useEffect } from 'react';

// Define theme presets with comprehensive styling options
const themesData = {
  default: {
    name: 'Default Dred',
    gradient: 'from-[#2A2A72] to-[#6A3DE8]',
    accent: '#6a3de8',
    description: 'Classic purple gradient',
    font: {
      family: "'Outfit', sans-serif",
      heading: 'font-outfit font-bold',
      body: 'font-outfit font-normal',
    },
    pattern: {
      type: 'none',
      opacity: '10',
    },
    radius: 'rounded-xl',
    iconSet: 'default',
    cardStyle: 'classic',
    animations: {
      loading: 'spin',
      transition: 'fade',
    },
    shadows: 'shadow-lg shadow-black/20',
    surfaces: {
      primary: 'bg-white/10 backdrop-blur-lg',
      secondary: 'bg-white/5',
      card: 'bg-white/10 backdrop-blur-md',
    }
  },
  amoled: {
    name: 'AMOLED Black',
    gradient: 'from-black to-black',
    accent: '#ffffff',
    description: 'Pure black theme with white accents',
    font: {
      family: "'Space Grotesk', sans-serif",
      heading: 'font-space-grotesk font-semibold tracking-tight',
      body: 'font-space-grotesk font-light tracking-wide',
    },
    pattern: {
      type: 'none',
      opacity: '0',
    },
    radius: 'rounded-lg',
    iconSet: 'minimal',
    cardStyle: 'flat',
    animations: {
      loading: 'pulse',
      transition: 'slide',
    },
    shadows: 'shadow-none',
    surfaces: {
      primary: 'bg-zinc-900/90',
      secondary: 'bg-zinc-950',
      card: 'bg-zinc-900',
    }
  },
  darkNavy: {
    name: 'Dark Navy',
    gradient: 'from-[#1a1a2e] to-[#2a2a4a]',
    accent: '#4a4a8a',
    description: 'Deep navy blue',
    font: {
      family: "'Outfit', sans-serif",
      heading: 'font-outfit font-medium',
      body: 'font-outfit',
    },
    pattern: {
      type: 'circuit',
      opacity: '5',
    },
    radius: 'rounded-xl',
    iconSet: 'outline',
    cardStyle: 'glass',
    animations: {
      loading: 'bounce',
      transition: 'fade',
    },
    shadows: 'shadow-md shadow-black/30',
    surfaces: {
      primary: 'bg-blue-950/60 backdrop-blur-sm',
      secondary: 'bg-blue-950/90',
      card: 'bg-blue-900/30 backdrop-blur-md',
    }
  },
  emerald: {
    name: 'Emerald',
    gradient: 'from-[#064e3b] to-[#059669]',
    accent: '#10b981',
    description: 'Rich emerald green',
    font: {
      family: "'Space Grotesk', sans-serif",
      heading: 'font-space-grotesk font-bold',
      body: 'font-space-grotesk',
    },
    pattern: {
      type: 'topography',
      opacity: '10',
    },
    radius: 'rounded-2xl',
    iconSet: 'filled',
    cardStyle: 'bordered',
    animations: {
      loading: 'pulse',
      transition: 'scale',
    },
    shadows: 'shadow-lg shadow-emerald-900/30',
    surfaces: {
      primary: 'bg-emerald-900/50 backdrop-blur-lg',
      secondary: 'bg-emerald-950/70',
      card: 'bg-emerald-800/40 backdrop-blur-md border border-emerald-600/30',
    }
  },
  midnight: {
    name: 'Midnight Blue',
    gradient: 'from-[#1e3a8a] to-[#3b82f6]',
    accent: '#3b82f6',
    description: 'Deep blue gradient',
    font: {
      family: "'Outfit', sans-serif",
      heading: 'font-outfit font-bold',
      body: 'font-outfit',
    },
    pattern: {
      type: 'constellation',
      opacity: '20',
    },
    radius: 'rounded-lg',
    iconSet: 'duotone',
    cardStyle: 'modern',
    animations: {
      loading: 'wave',
      transition: 'slide',
    },
    shadows: 'shadow-xl shadow-blue-900/40',
    surfaces: {
      primary: 'bg-blue-800/40 backdrop-blur-md',
      secondary: 'bg-blue-900/60',
      card: 'bg-gradient-to-br from-blue-700/30 to-blue-900/30 backdrop-blur-md',
    }
  },
  crimson: {
    name: 'Crimson',
    gradient: 'from-[#7f1d1d] to-[#dc2626]',
    accent: '#dc2626',
    description: 'Bold red gradient',
    font: {
      family: "'Space Grotesk', sans-serif",
      heading: 'font-space-grotesk font-extrabold',
      body: 'font-space-grotesk',
    },
    pattern: {
      type: 'hexagons',
      opacity: '10',
    },
    radius: 'rounded-md',
    iconSet: 'sharp',
    cardStyle: 'gradient',
    animations: {
      loading: 'slide',
      transition: 'scale',
    },
    shadows: 'shadow-lg shadow-red-900/30',
    surfaces: {
      primary: 'bg-red-900/40 backdrop-blur-lg',
      secondary: 'bg-red-950/70',
      card: 'bg-gradient-to-br from-red-800/40 to-red-900/40 backdrop-blur-md',
    }
  },
  neonDusk: {
    name: 'Neon Dusk',
    gradient: 'from-[#0f0326] via-[#3b0764] to-[#701a75]',
    accent: '#d946ef',
    description: 'Cyberpunk-inspired purple with neon accents',
    font: {
      family: "'Space Grotesk', sans-serif",
      heading: 'font-space-grotesk font-bold tracking-widest',
      body: 'font-space-grotesk tracking-wide',
    },
    pattern: {
      type: 'circuit',
      opacity: '15',
    },
    radius: 'rounded-none',
    iconSet: 'neon',
    cardStyle: 'neon',
    animations: {
      loading: 'glow',
      transition: 'glitch',
    },
    shadows: 'shadow-lg shadow-fuchsia-500/20',
    surfaces: {
      primary: 'bg-purple-950/60 backdrop-blur-md border-t border-purple-500/20',
      secondary: 'bg-purple-950/80 border-l border-fuchsia-500/20',
      card: 'bg-purple-900/30 backdrop-blur-lg border border-fuchsia-500/30',
    }
  },
  monochrome: {
    name: 'Monochrome',
    gradient: 'from-zinc-900 to-zinc-800',
    accent: '#a1a1aa',
    description: 'Clean minimalist black and white',
    font: {
      family: "'Outfit', sans-serif",
      heading: 'font-outfit font-light tracking-tight',
      body: 'font-outfit font-extralight',
    },
    pattern: {
      type: 'graph',
      opacity: '5',
    },
    radius: 'rounded-sm',
    iconSet: 'outline',
    cardStyle: 'minimal',
    animations: {
      loading: 'simple',
      transition: 'fade',
    },
    shadows: 'shadow-none',
    surfaces: {
      primary: 'bg-zinc-800/70 backdrop-blur-sm',
      secondary: 'bg-zinc-900/90',
      card: 'bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50',
    }
  }
};

// Create context
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Load theme preferences from localStorage
  const getInitialThemePrefs = () => {
    try {
      // Main theme
      const savedTheme = localStorage.getItem('dred-theme') || 'default';
      
      // Custom theme elements
      const savedCustomizations = JSON.parse(localStorage.getItem('dred-theme-customizations')) || {
        fontFamily: null,
        radius: null,
        iconSet: null,
        pattern: null,
        cardStyle: null
      };
      
      return {
        currentTheme: savedTheme,
        customizations: savedCustomizations
      };
    } catch (error) {
      console.error('Error loading theme preferences:', error);
      return {
        currentTheme: 'default',
        customizations: {
          fontFamily: null,
          radius: null,
          iconSet: null,
          pattern: null,
          cardStyle: null
        }
      };
    }
  };

  const [themePrefs, setThemePrefs] = useState(getInitialThemePrefs);

  // Save preferences whenever they change
  useEffect(() => {
    localStorage.setItem('dred-theme', themePrefs.currentTheme);
    localStorage.setItem('dred-theme-customizations', JSON.stringify(themePrefs.customizations));
    
    // Add necessary web fonts to the document
    updateFonts();
  }, [themePrefs]);

  // Function to add web fonts to the document
  const updateFonts = () => {
    const fontLinks = document.querySelectorAll('link[data-font]');
    fontLinks.forEach(link => link.remove());

    const requiredFonts = new Set();
    requiredFonts.add(themesData[themePrefs.currentTheme].font.family.split("'")[1]);
    
    if (themePrefs.customizations.fontFamily) {
      const customFont = Object.values(themesData).find(
        theme => theme.font.family.includes(themePrefs.customizations.fontFamily)
      );
      if (customFont) {
        requiredFonts.add(themePrefs.customizations.fontFamily);
      }
    }

    // Add font links to document head
    requiredFonts.forEach(font => {
      if (font === 'Outfit' || font === 'Space Grotesk') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.setAttribute('data-font', font);
        link.href = `https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    });
  };

  // Get the effective theme data with customizations applied
  const getEffectiveThemeData = () => {
    const baseTheme = themesData[themePrefs.currentTheme];
    const { customizations } = themePrefs;
    
    // Start with the base theme
    const effectiveTheme = { ...baseTheme };
    
    // Apply customizations if they exist
    if (customizations.fontFamily) {
      const customFont = Object.values(themesData).find(theme => 
        theme.font.family.includes(customizations.fontFamily)
      );
      if (customFont) {
        effectiveTheme.font = { ...customFont.font };
      }
    }
    
    if (customizations.radius) {
      effectiveTheme.radius = customizations.radius;
    }
    
    if (customizations.iconSet) {
      effectiveTheme.iconSet = customizations.iconSet;
    }
    
    if (customizations.pattern) {
      const customPattern = Object.values(themesData).find(theme => 
        theme.pattern.type === customizations.pattern
      );
      if (customPattern) {
        effectiveTheme.pattern = { ...customPattern.pattern };
      }
    }
    
    if (customizations.cardStyle) {
      effectiveTheme.cardStyle = customizations.cardStyle;
    }
    
    return effectiveTheme;
  };

  // Set the current theme
  const setCurrentTheme = (themeName) => {
    if (themesData[themeName]) {
      setThemePrefs(prev => ({
        ...prev,
        currentTheme: themeName
      }));
    }
  };

  // Customize an individual theme element
  const customizeThemeElement = (element, value) => {
    setThemePrefs(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [element]: value
      }
    }));
  };

  // Reset all customizations
  const resetCustomizations = () => {
    setThemePrefs(prev => ({
      ...prev,
      customizations: {
        fontFamily: null,
        radius: null,
        iconSet: null,
        pattern: null,
        cardStyle: null
      }
    }));
  };

  // Reset to default theme with no customizations
  const resetToDefaultTheme = () => {
    setThemePrefs({
      currentTheme: 'default',
      customizations: {
        fontFamily: null,
        radius: null,
        iconSet: null,
        pattern: null,
        cardStyle: null
      }
    });
  };

  // Context value
  const value = {
    currentTheme: themePrefs.currentTheme,
    setCurrentTheme,
    themes: themesData,
    currentThemeData: getEffectiveThemeData(),
    customizations: themePrefs.customizations,
    customizeThemeElement,
    resetCustomizations,
    resetToDefaultTheme
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