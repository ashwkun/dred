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
    <div className="space-y-8">
      {/* Card Preview */}
      <div className="relative w-full max-w-md mx-auto aspect-[1.586/1] rounded-xl overflow-hidden">
        {/* Theme color with reduced opacity */}
        <div 
          className="absolute inset-0 transition-colors duration-300"
          style={{ background: theme, opacity: 0.3 }}
        />

        {/* Glass overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />

        {/* Card content */}
        <div className="relative h-full p-6 flex flex-col justify-between">
          {/* Bank Logo */}
          <div className="h-6 md:h-8 w-24 md:w-32">
            <LogoWithFallback
              logoName={bankName}
              logoType="bank"
              className="h-full w-full object-contain object-left"
            />
          </div>

          {/* Card Number */}
          <div className="text-xl md:text-2xl text-white tracking-wider text-center font-medium">
            {cardNumber ? cardNumber.replace(/(.{4})/g, "$1 ").trim() : "•••• •••• •••• ••••"}
          </div>

          {/* Card Holder & Network Logo */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/50 text-xs mb-1">Card Holder</p>
              <p className="text-white text-sm font-medium">{cardHolder || "Your Name"}</p>
            </div>
            <div className="h-10 md:h-12 w-16 md:w-20">
              <LogoWithFallback
                logoName={networkName}
                logoType="network"
                className="h-full w-full object-contain object-right"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium text-white mb-6">Customize Design</h3>
          
          {/* Bank Themes */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-white/70 text-sm font-medium">
                Bank Themes
              </label>
              {Object.keys(bankThemes).length > 8 && (
                <button
                  className="text-sm text-white/50 hover:text-white
                    transition-colors duration-200 flex items-center gap-2"
                  onClick={() => setShowMoreGradients(!showMoreGradients)}
                >
                  {showMoreGradients ? (
                    <>
                      <span>Show Less</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Show More</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(bankThemes)
                .slice(0, showMoreGradients ? undefined : 8)
                .map(([name, gradient]) => (
                  <button
                    key={name}
                    className="group relative aspect-video rounded-xl transition-all duration-200 
                      hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20
                      hover:shadow-lg hover:shadow-white/10 overflow-hidden"
                    onClick={() => setTheme(gradient)}
                  >
                    <div className="absolute inset-0" style={{ background: gradient }} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                      transition-opacity duration-200 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{name}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Custom Palettes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-white/70 text-sm font-medium">
                Custom Palettes
              </label>
              {popularColors.length > 8 && (
                <button
                  className="text-sm text-white/50 hover:text-white
                    transition-colors duration-200 flex items-center gap-2"
                  onClick={() => setShowMoreSolids(!showMoreSolids)}
                >
                  {showMoreSolids ? (
                    <>
                      <span>Show Less</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Show More</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {popularColors
                .slice(0, showMoreSolids ? undefined : 8)
                .map((color, index) => (
                  <button
                    key={index}
                    className="group relative aspect-video rounded-xl transition-all duration-200 
                      hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20
                      hover:shadow-lg hover:shadow-white/10 overflow-hidden"
                    onClick={() => setTheme(color.value)}
                  >
                    <div className="absolute inset-0" style={{ background: color.value }} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                      transition-opacity duration-200 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {color.name}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardCustomization;
