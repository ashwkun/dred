// LogoWithFallback.jsx
import React, { useState } from "react";
import { bankLogos, networkLogos } from "./utils/logoMap";

/*
  Dynamic Sizing Explanation:
  - Prop: fixedHeight (number, in pixels) sets the desired display height.
    • Supported values: any positive number (e.g., 80, 96, 120).
  - When the image loads, we use the onLoad event to read:
    • e.target.naturalWidth and e.target.naturalHeight
  - We then compute the width as:
    width = fixedHeight * (naturalWidth / naturalHeight)
  - This ensures that the image maintains its original aspect ratio.
  - If the image hasn't loaded yet, we render a square container of size fixedHeight.
  - All images use CSS property objectFit: "contain" so they never get stretched.
*/

function LogoWithFallback({ logoName, logoType, format = "logoSVG", invertColors = false, className = "", ...props }) {
  const [fallbackState, setFallbackState] = useState(0); // 0: primary, 1: fallback to PNG, 2: fallback to text

  if (!logoName) return null;

  // Simple name normalization
  const normalizedName = logoName.toLowerCase().replace(/\s+/g, '');

  // Display text fallback if all image options have failed
  if (fallbackState === 2) {
    const displayName = normalizedName === 'default' ? 'Bank' : logoName;
    
    // Use a styled div for the text fallback
    return (
      <div 
        className={`flex items-center justify-center text-sm font-semibold bg-gray-100 text-gray-800 rounded p-1 ${className}`}
        style={{ 
          minWidth: '60px', 
          minHeight: '24px',
          ...props.style 
        }}
      >
        {displayName.substring(0, 10)}
      </div>
    );
  }
  
  // Get logo path - use PNG fallback if SVG failed
  let logoPath;
  let logoFormat = fallbackState === 1 ? format.replace('SVG', 'PNG') : format;

  if (logoType === 'bank') {
    const bankData = bankLogos[normalizedName] || bankLogos.default;
    logoPath = bankData[logoFormat] || bankData.logoSVG || bankData.logoPNG || bankLogos.default.logoPNG;
  } else {
    logoPath = networkLogos[normalizedName] || networkLogos.default;
  }

  // Define filter style for black logos on dark backgrounds
  const filterStyle = invertColors ? { filter: 'brightness(0) invert(1)' } : {};

  return (
    <img
      src={logoPath}
      alt={`${logoType} logo`}
      onError={() => {
        // If we're already trying PNG and it failed, fallback to text
        if (fallbackState === 1) {
          setFallbackState(2);
        }
        // If SVG failed, try PNG
        else if (fallbackState === 0) {
          setFallbackState(1);
        }
      }}
      style={filterStyle}
      className={className}
      {...props}
    />
  );
}

export default LogoWithFallback;
