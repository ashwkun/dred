import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "./firebase";
import { BiLock, BiCreditCard, BiMobile, BiLogoGoogle } from 'react-icons/bi';
import logo from "./assets/logo.png";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-primary">
      {/* Main Container with enhanced glassmorphic effect */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-8
        border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]
        relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.15] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5" />
        
        {/* Content container to position above overlays */}
        <div className="relative">
          {/* App Icon with enhanced effect */}
          <div className="w-20 h-20 mx-auto mb-8 bg-white/10 backdrop-blur-md
            rounded-2xl flex items-center justify-center
            border border-white/20 shadow-lg">
            <img src={logo} alt="Dred" className="h-12" />
          </div>

          {/* Welcome Text */}
          <h1 className="text-2xl font-semibold text-white text-center mb-2">
            Welcome to Dred
          </h1>
          <p className="text-white/60 text-center mb-12">
            Securely store and manage your cards in one place
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              {
                icon: <BiLock className="w-6 h-6" />,
                title: "Secure",
                desc: "Storage"
              },
              {
                icon: <BiCreditCard className="w-6 h-6" />,
                title: "Easy",
                desc: "Access"
              },
              {
                icon: <BiMobile className="w-6 h-6" />,
                title: "Offline",
                desc: "Support"
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className={`
                  bg-white/5 backdrop-blur-sm rounded-2xl p-4
                  flex flex-col items-center text-center aspect-square
                  ${i === 2 ? 'hover:bg-white/10 cursor-pointer transition-colors' : ''}
                `}
                onClick={i === 2 ? () => window.location.href = '/billpay' : undefined}
              >
                <div className="text-white mb-3">
                  {feature.icon}
                </div>
                <h3 className="text-white font-medium text-base">
                  {feature.title}
                </h3>
                <p className="text-white/40 text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Sign In Button */}
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="w-full bg-white/10 hover:bg-white/20
              rounded-2xl py-4 flex items-center justify-center gap-3
              text-white font-medium transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <BiLogoGoogle className="w-5 h-5" />
                Continue with Google
              </>
            )}
          </button>

          {/* Footer */}
          <p className="mt-6 text-white/40 text-xs text-center">
            Your data is encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  );
}
