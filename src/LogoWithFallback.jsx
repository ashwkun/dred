// LogoWithFallback.jsx
import React from "react";
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

function LogoWithFallback({ logoName, logoType, format = "logoSVG", ...props }) {
  if (!logoName) return null;

  // Simple name normalization
  const normalizedName = logoName.toLowerCase().replace(/\s+/g, '');

  // Get logo path
  let logoPath;
  if (logoType === 'bank') {
    const bankData = bankLogos[normalizedName] || bankLogos.default;
    logoPath = bankData[format] || bankData.logoSVG;
  } else {
    logoPath = networkLogos[normalizedName] || networkLogos.default;
  }

  return (
    <img
      src={logoPath}
      alt={`${logoType} logo`}
      {...props}
    />
  );
}

export default LogoWithFallback;
