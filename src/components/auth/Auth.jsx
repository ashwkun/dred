import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { useTheme } from './contexts/ThemeContext';
import AppHints from './components/AppHints';
import logo from "./assets/logo.png"; // Import the logo

function Auth() {
  const { currentThemeData } = useTheme();
  
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

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
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8">
          {/* App Logo */}
          <div className="mb-8 text-center">
            <img 
              src={logo} 
              alt="Dred Logo" 
              className="w-24 h-24 mx-auto object-contain"
            />
          </div>

          {/* Welcome Text */}
          <h1 className="text-3xl font-bold text-white text-center mb-3">
            Welcome to Dred
          </h1>
          <p className="text-white/70 text-center mb-8">
            Securely store and manage your cards in one place
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <svg className="w-6 h-6 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
              <h3 className="text-white font-medium mb-1">Secure Storage</h3>
              <p className="text-white/60 text-sm">End-to-end encrypted card details</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <svg className="w-6 h-6 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" 
                />
              </svg>
              <h3 className="text-white font-medium mb-1">Easy Access</h3>
              <p className="text-white/60 text-sm">Quick view of all your cards</p>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 
              bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl 
              text-white font-medium transition-colors duration-200 
              focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Privacy Notice */}
          <p className="mt-6 text-sm text-white/50 text-center">
            Your data is encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
