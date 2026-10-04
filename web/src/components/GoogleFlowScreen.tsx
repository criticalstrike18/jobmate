import React, { useState } from 'react';
import { THEME } from '../constants/theme';
import type { AuthUser } from '../types/auth';
import { signInWithGoogle, getFirebaseConfigStatus } from '../lib/firebase';

interface GoogleFlowScreenProps {
  onBack: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const GoogleFlowScreen: React.FC<GoogleFlowScreenProps> = ({ onBack, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const configStatus = getFirebaseConfigStatus();

  const handleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);

    if (configStatus.isConfigured) {
      try {
        const user = await signInWithGoogle();
        onSuccess(user);
        return;
      } catch (err: any) {
        if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
          return;
        }
        const message = err?.message || 'Google sign-in failed. Please verify your credentials.';
        setAuthError(message);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Interactive demo fallback if Firebase credentials are not yet configured
    setTimeout(() => {
      setIsLoading(false);
      onSuccess({
        uid: 'google-sim-1',
        displayName: 'Google User',
        email: 'user@gmail.com',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        providerId: 'google.com',
      });
    }, 800);
  };

  const handleDemoSignIn = () => {
    onSuccess({
      uid: 'google-sim-demo',
      displayName: 'Alex Rivera',
      email: 'alex.rivera@gmail.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      providerId: 'google.com',
    });
  };

  return (
    <div className={THEME.layout.centerContainer}>
      
      {/* Brand Icon Lockup: Google G + JobMate Mark */}
      <div 
        className="animate-entrance flex items-center justify-center gap-3 cursor-default"
        style={{ animationDelay: '0ms' }}
      >
        {/* Google G Symbol */}
        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4" />
            <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853" />
            <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
            <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
          </svg>
        </div>

        <span className="text-slate-300 font-light text-base">to</span>

        {/* JobMate Mark */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-[1.5px] shadow-xs flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-[10.5px] flex items-center justify-center">
            <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.5 8C5.5 5.51472 7.51472 3.5 10 3.5V3.5C12.4853 3.5 14.5 5.51472 14.5 8V16C14.5 18.4853 12.4853 20.5 10 20.5V20.5C7.51472 20.5 5.5 18.4853 5.5 16" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
              <path d="M14.5 9.5L18.5 14L22.5 9.5V16C22.5 17.5 21.5 18.5 20 18.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
              <circle cx="10" cy="8" fill="currentColor" r="1.8" />
              <circle cx="18.5" cy="14" fill="currentColor" r="1.4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Title & Subtitle */}
      <h1 
        className={`animate-entrance mt-5 sm:mt-6 ${THEME.typography.heading}`}
        style={{ animationDelay: '80ms' }}
      >
        Sign in with Google
      </h1>
      <p 
        className={`animate-entrance mt-1.5 sm:mt-2 ${THEME.typography.subtitle}`}
        style={{ animationDelay: '140ms' }}
      >
        to continue to JobMate
      </p>

      {/* Error Notice if any */}
      {authError && (
        <div className="animate-entrance mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs text-rose-700 w-full text-center leading-relaxed">
          {authError}
        </div>
      )}

      {/* Primary Action Button: Standard 50px Pill Button */}
      <div 
        className="animate-entrance w-full mt-6 flex flex-col gap-3"
        style={{ animationDelay: '200ms' }}
      >
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isLoading}
          className={`pill-bloom ${THEME.buttons.base} border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-800`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-600 rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4" />
                <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853" />
                <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
                <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Return to Sign-in */}
        <button
          type="button"
          onClick={onBack}
          className={`mt-2 ${THEME.typography.returnLink} justify-center`}
        >
          <span>← Back to sign-in options</span>
        </button>
      </div>

      {/* Google Disclosure Notice */}
      <div 
        className="animate-entrance mt-6 flex flex-col items-center gap-2 w-full"
        style={{ animationDelay: '280ms' }}
      >
        <p className={THEME.typography.caption}>
          To continue, Google will share your name, email address, language preference, and profile picture with JobMate.
        </p>

        {/* Discreet Simulation Bypass */}
        <button
          type="button"
          onClick={handleDemoSignIn}
          className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors mt-1 cursor-pointer"
        >
          Or continue with demo preview
        </button>
      </div>

    </div>
  );
};
