import React, { useEffect, useState } from "react";
import { bankThemes, popularColors } from "./cardThemes";
import LogoWithFallback from "./LogoWithFallback";

function CardCustomization({ cardHolder, cardNumber, bankName, networkName, expiry, theme, setTheme }) {
  const [showMoreGradients, setShowMoreGradients] = useState(false);
  const [showMoreSolids, setShowMoreSolids] = useState(false);

  // Auto-apply bank theme if available
  useEffect(() => {
    if (bankName && bankThemes[bankName]) {
      setTheme(bankThemes[bankName]);
    }
  }, [bankName]);

  // Use the same styleConfig as ViewCards for consistency
  const styleConfig = {
    cardContainer: {
      width: '100%',
      maxWidth: '384px',
      height: '224px',
      margin: '0 auto',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      overflow: 'hidden',
      color: 'white',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      position: 'relative',
    },
    bankLogoStyle: {
      position: 'absolute',
      top: '10px',
      left: '16px',
      width: '96px',
      height: '40px',
    },
    cardNumberTextStyle: {
      fontSize: '24px',
      letterSpacing: '0.1em',
      textAlign: 'center',
      fontWeight: '500',
    },
    cardHolderStyle: {
      position: 'absolute',
      bottom: '16px',
      left: '16px',
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'left',
      letterSpacing: '0.025em',
    },
    networkLogoStyle: {
      position: 'absolute',
      bottom: '5px',
      right: '16px',
      width: '70px',
      height: '50px',
    },
    middleContainerStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '0 16px',
    },
  };

  return (
    <div className="w-full max-w-sm">
      <h3 className="text-xl font-semibold text-white mb-4">Customize Your Card</h3>

      {/* Live Card Preview */}
      <div style={styleConfig.cardContainer}>
        {/* Theme color with reduced opacity */}
        <div 
          style={{ 
            position: 'absolute',
            inset: 0,
            background: theme,
            opacity: 0.3,
          }} 
        />

        {/* Glass overlay */}
        <div 
          style={{ 
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(8px)',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
          }} 
        />

        {/* Card content */}
        <div style={{ position: 'relative', height: '100%' }}>
          <div style={styleConfig.bankLogoStyle}>
            <LogoWithFallback
              logoName={bankName}
              logoType="bank"
              style={{
                width: styleConfig.bankLogoStyle.width,
                height: styleConfig.bankLogoStyle.height,
                objectFit: 'contain',
              }}
            />
          </div>

          <div style={styleConfig.middleContainerStyle}>
            <div style={styleConfig.cardNumberTextStyle}>
              {cardNumber ? cardNumber.replace(/(.{4})/g, "$1 ") : "•••• •••• •••• ••••"}
            </div>
          </div>

          <div style={styleConfig.cardHolderStyle}>
            <span style={{ fontSize: '14px' }}>{cardHolder || "Your Name"}</span>
          </div>

          <div style={styleConfig.networkLogoStyle}>
            <LogoWithFallback
              logoName={networkName}
              logoType="network"
              style={{
                width: styleConfig.networkLogoStyle.width,
                height: styleConfig.networkLogoStyle.height,
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      </div>

      {/* Suggested Bank Themes (Preview Blocks) */}
      <div>
        <label className="text-sm text-gray-400">Bank-Based Backgrounds</label>
        <div className="grid grid-cols-5 gap-3 mt-2">
          {Object.entries(bankThemes).slice(0, 5).map(([name, gradient]) => (
            <div
              key={name}
              className="w-14 h-10 rounded-md cursor-pointer transition-all duration-200 shadow-md hover:scale-105 border border-gray-700"
              style={{ background: gradient }}
              onClick={() => setTheme(gradient)}
            ></div>
          ))}
        </div>

        {/* Collapsible More Gradients */}
        {showMoreGradients && (
          <div className="grid grid-cols-5 gap-3 mt-2">
            {Object.entries(bankThemes).slice(5).map(([name, gradient]) => (
              <div
                key={name}
                className="w-14 h-10 rounded-md cursor-pointer transition-all duration-200 shadow-md hover:scale-105 border border-gray-700"
                style={{ background: gradient }}
                onClick={() => setTheme(gradient)}
              ></div>
            ))}
          </div>
        )}
        <button className="text-sm text-gray-400 mt-2 hover:text-white transition" onClick={() => setShowMoreGradients(!showMoreGradients)}>
          {showMoreGradients ? "Show Less" : "Show More"}
        </button>
      </div>

      {/* Solid Color Selection */}
      <div>
        <label className="text-sm text-gray-400">Solid Colors</label>
        <div className="grid grid-cols-5 gap-3 mt-2">
          {popularColors.slice(0, 5).map((color, index) => (
            <div
              key={index}
              className="w-14 h-10 rounded-md cursor-pointer transition-all duration-200 shadow-md hover:scale-105 border border-gray-700"
              style={{ background: color }}
              onClick={() => setTheme(color)}
            ></div>
          ))}
        </div>

        {/* Collapsible More Solid Colors */}
        {showMoreSolids && (
          <div className="grid grid-cols-5 gap-3 mt-2">
            {popularColors.slice(5).map((color, index) => (
              <div
                key={index}
                className="w-14 h-10 rounded-md cursor-pointer transition-all duration-200 shadow-md hover:scale-105 border border-gray-700"
                style={{ background: color }}
                onClick={() => setTheme(color)}
              ></div>
            ))}
          </div>
        )}
        <button className="text-sm text-gray-400 mt-2 hover:text-white transition" onClick={() => setShowMoreSolids(!showMoreSolids)}>
          {showMoreSolids ? "Show Less" : "Show More"}
        </button>
      </div>
    </div>
  );
}

export default CardCustomization;
