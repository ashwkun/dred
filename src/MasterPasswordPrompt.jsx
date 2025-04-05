import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { useTheme } from './contexts/ThemeContext';
import AppHints from './components/AppHints';
import logo from "./assets/logo.png"; // Import the logo
import { doc, getDoc, setDoc } from "firebase/firestore";
import ValidationAnimation from "./components/ValidationAnimation";
import { securityManager } from "./utils/security";
import LockoutTimer from "./components/LockoutTimer";

function MasterPasswordPrompt({ setMasterPassword, user }) {
  const [inputValue, setInputValue] = useState("");
  const { currentThemeData } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [step, setStep] = useState(1); // Track setup steps
  const [validationSentence, setValidationSentence] = useState("");
  const [masterPass, setMasterPass] = useState("");
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);

  useEffect(() => {
    checkFirstTimeUser();
  }, [user]);

  const checkFirstTimeUser = async () => {
    try {
      // Check in dedicated validation collection
      const validationRef = doc(db, "validationStrings", user.uid);
      const validationDoc = await getDoc(validationRef);
      
      // User is first time if no validation document exists
      setIsFirstTime(!validationDoc.exists());
    } catch (error) {
      console.error("Error checking first time user:", error);
      // Assume first time if error occurs
      setIsFirstTime(true);
    }
  };

  // First time setup steps
  const handleFirstTimeStep1 = async (e) => {
    e.preventDefault();
    if (validationSentence.trim().length < 10) {
      setValidationError("Please enter a longer sentence for better security");
      return;
    }
    setStep(2);
  };

  const handleFirstTimeStep2 = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    setValidationError(null);

    try {
      // Create validation string using the user's sentence
      const validationString = securityManager.createValidationString(masterPass, validationSentence);
      await setDoc(doc(db, "validationStrings", user.uid), {
        validationString,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setShowSuccess(true);
      await new Promise(r => setTimeout(r, 2000));
      setMasterPassword(masterPass);
    } catch (error) {
      setValidationError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle returning user password submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    setValidationError(null);

    try {
      const validationDoc = await getDoc(doc(db, "validationStrings", user.uid));
      if (!validationDoc.exists()) {
        throw new Error("Validation string not found. Please contact support.");
      }
      
      const validationString = validationDoc.data().validationString;
      const result = await securityManager.validatePassword(validationString, inputValue, user.uid);
      
      // Set the decrypted sentence for the animation
      setValidationSentence(result.decryptedSentence);
      
      setShowSuccess(true);
      await new Promise(r => setTimeout(r, 2000));
      setMasterPassword(inputValue);
    } catch (error) {
      // Enhanced error messages
      let errorMessage = error.message;
      if (errorMessage === "Invalid password") {
        errorMessage = "The password you entered is incorrect. Please try again.";
      } else if (errorMessage.includes("Account locked")) {
        const minutes = errorMessage.match(/\d+/)[0];
        errorMessage = `Too many failed attempts. Your account is locked for ${minutes} minutes.`;
        setIsLockedOut(true);
        setLockoutMinutes(parseInt(minutes));
      }
      
      setValidationError(errorMessage);
      // Remove the automatic clearing of error message
      // Let it persist until the next attempt
    } finally {
      setIsValidating(false);
    }
  };

  // Render first time setup step 1
  const renderStep1 = () => (
    <>
      <h2 className="text-xl font-bold text-white text-center mb-3">
        Welcome to Dred!
      </h2>
      <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
        <p className="text-sm text-white">
          Enter any random sentence - you won't need to remember it.
          <span className="block mt-2 text-white/70 text-xs">
            We'll encrypt this sentence and use it to verify your password later.
          </span>
          <span className="block mt-2 text-white/70 text-xs italic">
            Example: "I had coffee with milk today!"
          </span>
        </p>
      </div>

      <form onSubmit={handleFirstTimeStep1} className="space-y-4">
        <div className="relative">
          <textarea
            value={validationSentence}
            onChange={(e) => setValidationSentence(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
              text-white placeholder-white/50 focus:outline-none focus:ring-2 
              focus:ring-white/20 focus:border-transparent backdrop-blur-sm"
            placeholder="Type any sentence here"
            rows={2}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 
            rounded-xl text-white font-medium transition-colors duration-200 
            focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          Continue
        </button>
      </form>
    </>
  );

  // Render first time setup step 2
  const renderStep2 = () => (
    <>
      <h2 className="text-lg font-bold text-white text-center mb-3">
        Create Master Password
      </h2>
      <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
        <p className="text-sm text-white mb-2">Password requirements:</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
          <span>• 12+ characters</span>
          <span>• Special characters</span>
          <span>• Upper & lowercase</span>
          <span>• Numbers</span>
        </div>
      </div>
      <p className="text-red-400/90 text-xs text-center mb-4">
        ⚠️ This password cannot be recovered
      </p>

      <form onSubmit={handleFirstTimeStep2} className="space-y-6">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={masterPass}
            onChange={(e) => setMasterPass(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
              text-white placeholder-white/50 focus:outline-none focus:ring-2 
              focus:ring-white/20 focus:border-transparent backdrop-blur-sm"
            placeholder="Create master password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 
              hover:text-white focus:outline-none"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" 
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                />
              </svg>
            )}
          </button>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 
            rounded-xl text-white font-medium transition-colors duration-200 
            focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          Set Master Password
        </button>
      </form>
    </>
  );

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: `linear-gradient(135deg, 
          ${currentThemeData?.gradientStart || '#6a3de8'}, 
          ${currentThemeData?.gradientEnd || '#4a2ead'}
        )` 
      }}
    >
      <div className="w-full max-w-md">
        <AppHints />
        
        {/* User Info & Logout */}
        <div className="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.photoURL && (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-white/20"
              />
            )}
            <span className="text-white/80">
              {user?.displayName || user?.email || 'User'}
            </span>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="text-white/60 hover:text-white/90 text-sm px-3 py-1 
              rounded-lg border border-white/10 hover:border-white/20 
              transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>

        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6">
          {/* App Logo */}
          <div className="mb-6 text-center">
            <img 
              src={logo} 
              alt="Dred Logo" 
              className="w-16 h-16 mx-auto object-contain"
            />
          </div>

          {isFirstTime ? (
            step === 1 ? renderStep1() : renderStep2()
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Enter Master Password
              </h2>
              <p className="text-white/70 text-center mb-8">
                Please enter your master password to decrypt your cards
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setValidationError(null); // Clear error on input change
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                      text-white placeholder-white/50 focus:outline-none focus:ring-2 
                      focus:ring-white/20 focus:border-transparent backdrop-blur-sm"
                    placeholder={isFirstTime ? "Create master password" : "Enter master password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 
                      hover:text-white focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" 
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                        />
                      </svg>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 
                    rounded-xl text-white font-medium transition-colors duration-200 
                    focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  {isFirstTime ? "Set Master Password" : "Unlock Cards"}
                </button>
              </form>

              <p className="mt-6 text-sm text-white/50 text-center">
                Make sure you're in a private place before entering your password
              </p>
            </>
          )}
        </div>

        {isLockedOut && (
          <LockoutTimer minutesLeft={lockoutMinutes} />
        )}
      </div>

      {(isValidating || showSuccess || validationError) && (
        <ValidationAnimation 
          isValidating={isValidating}
          isSuccess={showSuccess}
          error={validationError}
          validationSentence={validationSentence}
          isFirstTime={isFirstTime}
        />
      )}
    </div>
  );
}

export default MasterPasswordPrompt;
