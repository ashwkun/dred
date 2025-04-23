import React, { useState, useEffect } from 'react';
import logo from "../assets/logo.png";

/**
 * A centralized component for displaying the Dred logo with robust fallback mechanisms
 * @param {Object} props
 * @param {string} props.className - CSS class names for styling
 * @param {Object} props.style - Additional inline styles
 * @param {boolean} props.invertColors - Whether to invert colors for better visibility on dark backgrounds
 * @param {string} props.alt - Alt text for the image
 */
function DredLogo({ className = "", style = {}, invertColors = false, alt = "Dred", ...props }) {
  const [fallbackState, setFallbackState] = useState(0); // 0: PNG, 1: SVG, 2: Direct path, 3: Text
  const [logoSrc, setLogoSrc] = useState(logo);
  const [logoError, setLogoError] = useState(false);

  // Update logo source based on current fallback state
  useEffect(() => {
    let source;
    
    switch (fallbackState) {
      case 0: 
        source = logo; // Import from assets (PNG)
        break;
      case 1:
        source = `${window.location.origin}/logo.b6b4f441.svg`; // SVG with hash from build
        break;
      case 2:
        // Try different SVG file path patterns
        source = `${window.location.origin}/logo.svg`; // Direct SVG URL without hash
        break;
      default:
        source = null; // Will display text fallback
    }
    
    setLogoSrc(source);
  }, [fallbackState]);

  const handleLogoError = () => {
    console.error("Dred logo failed to load:", fallbackState);
    setFallbackState(prevState => prevState + 1);
    
    if (fallbackState >= 2) {
      setLogoError(true);
    }
  };

  // Define filter style for logos on dark backgrounds if invertColors is true
  const filterStyle = invertColors 
    ? { filter: 'brightness(0) invert(1)', ...style } 
    : style;

  // If all image formats failed, show text fallback
  if (logoError || fallbackState > 2) {
    return (
      <div 
        className={`flex items-center justify-center font-bold ${className}`}
        style={{ 
          color: invertColors ? 'white' : 'inherit',
          ...style
        }}
        {...props}
      >
        DRED
      </div>
    );
  }

  // Otherwise, show the image with appropriate fallback strategy
  return (
    <img
      src={logoSrc}
      alt={alt}
      onError={handleLogoError}
      className={className}
      style={filterStyle}
      {...props}
    />
  );
}

export default DredLogo;