import React, { useEffect, useState } from 'react';
import TextScramble from './TextScramble';

function ValidationAnimation({ isValidating, isSuccess, error, validationSentence, isFirstTime }) {
  const [displayError, setDisplayError] = useState(null);
  
  // Handle the error state changes
  useEffect(() => {
    if (error) {
      setDisplayError(error);
    } else {
      setDisplayError(null);
    }
  }, [error]);

  // If there's no error, success, or validation in progress, don't render anything
  if (!isValidating && !isSuccess && !displayError) {
    return null;
  }

  return (
    <div className="fixed inset-4 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full border border-white/20">
        {isValidating && (
          <div className="text-center py-4">
            <div className="animate-spin w-8 h-8 border-3 border-white/20 border-t-white rounded-full mx-auto mb-3" />
            <div className="text-white text-base">
              <TextScramble 
                text={isFirstTime ? "Encrypting your sentence..." : "Decrypting your sentence..."} 
                isAnimating={true}
              />
            </div>
          </div>
        )}
        
        {isSuccess && (
          <div className="text-center py-4">
            {isFirstTime ? (
              <div className="text-center py-4">
                <svg className="w-12 h-12 mx-auto mb-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium text-white mb-2">
                  <TextScramble 
                    text={validationSentence} 
                    isAnimating={true}
                  />
                </p>
                <p className="text-white/70 text-sm">
                  <TextScramble 
                    text="You're now secured!" 
                    isAnimating={true}
                  />
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <svg className="w-12 h-12 mx-auto mb-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium text-white mb-2">
                  <TextScramble 
                    text={validationSentence} 
                    isAnimating={true}
                  />
                </p>
              </div>
            )}
          </div>
        )}

        {displayError && (
          <div className="text-center py-4">
            <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium text-red-400 mb-2">
              <TextScramble 
                text="Authentication Failed" 
                isAnimating={true}
              />
            </p>
            <p className="text-white/70 text-sm max-w-xs mx-auto leading-relaxed">
              <TextScramble 
                text={displayError} 
                isAnimating={true}
              />
            </p>
            <button 
              onClick={() => setDisplayError(null)}
              className="mt-4 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm text-white transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ValidationAnimation; 