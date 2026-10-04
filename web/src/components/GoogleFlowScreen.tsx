import React, { useState } from 'react';
import { THEME } from '../constants/theme';
import type { AuthUser } from '../types/auth';
import { signInWithGoogle, getFirebaseConfigStatus } from '../lib/firebase';

interface GoogleFlowScreenProps {
  onBack: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const GoogleFlowScreen: React.FC<GoogleFlowScreenProps> = ({ onBack, onSuccess }) => {
  const [loadingAccount, setLoadingAccount] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const configStatus = getFirebaseConfigStatus();

  const handleSelectAccount = async (accountType: 'personal' | 'work' | 'real_firebase') => {
    setLoadingAccount(accountType);
    setAuthError(null);

    if (configStatus.isConfigured || accountType === 'real_firebase') {
      try {
        const user = await signInWithGoogle();
        onSuccess(user);
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Google authentication failed';
        if (message === 'FIREBASE_NOT_CONFIGURED') {
          // Fall back gracefully to interactive simulation
        } else {
          setAuthError(message);
          setLoadingAccount(null);
          return;
        }
      }
    }

    // Interactive simulated flow matching Stitch screen state
    setTimeout(() => {
      setLoadingAccount(null);
      if (accountType === 'personal') {
        onSuccess({
          uid: 'google-sim-1',
          displayName: 'Alex Rivera',
          email: 'alex.rivera@gmail.com',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          providerId: 'google.com',
        });
      } else {
        onSuccess({
          uid: 'google-sim-2',
          displayName: 'Alex Rivera (Work)',
          email: 'alex@company.dev',
          photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          providerId: 'google.com',
        });
      }
    }, 700);
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

      {/* Standardized Title & Subtitle */}
      <h1 
        className={`animate-entrance mt-5 sm:mt-6 ${THEME.typography.heading}`}
        style={{ animationDelay: '80ms' }}
      >
        Choose an account
      </h1>
      <p 
        className={`animate-entrance mt-1.5 sm:mt-2 ${THEME.typography.subtitle}`}
        style={{ animationDelay: '140ms' }}
      >
        to continue to JobMate
      </p>

      {/* Error Notice if any */}
      {authError && (
        <div className="animate-entrance mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 w-full text-center">
          {authError}
        </div>
      )}

      {/* Account Selector Stack: Standardized 50px pill buttons */}
      <div className="w-full mt-6 sm:mt-7 flex flex-col gap-2.5">
        
        {/* Account 1: Personal */}
        <button
          type="button"
          onClick={() => handleSelectAccount('personal')}
          disabled={loadingAccount !== null}
          className={`animate-entrance pill-bloom ${THEME.buttons.base} ${THEME.buttons.lightPill} justify-start px-4`}
          style={{ animationDelay: '200ms' }}
        >
          {loadingAccount === 'personal' ? (
            <div className="w-7 h-7 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full overflow-hidden bg-sky-100 flex-shrink-0 border border-slate-200">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                alt="Alex Rivera"
                className="w-full h-full object-cover" 
              />
            </div>
          )}
          <div className="flex flex-col items-start leading-tight text-left min-w-0">
            <span className="text-[13px] sm:text-[14px] font-semibold text-slate-800 truncate">Alex Rivera</span>
            <span className="text-[11px] text-slate-400 font-normal truncate">alex.rivera@gmail.com</span>
          </div>
        </button>

        {/* Account 2: Work */}
        <button
          type="button"
          onClick={() => handleSelectAccount('work')}
          disabled={loadingAccount !== null}
          className={`animate-entrance pill-bloom ${THEME.buttons.base} ${THEME.buttons.lightPill} justify-start px-4`}
          style={{ animationDelay: '260ms' }}
        >
          {loadingAccount === 'work' ? (
            <div className="w-7 h-7 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 border border-slate-200">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" 
                alt="Alex Rivera Work"
                className="w-full h-full object-cover" 
              />
            </div>
          )}
          <div className="flex flex-col items-start leading-tight text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] sm:text-[14px] font-semibold text-slate-800 truncate">Alex Rivera</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-medium border border-sky-200/60">Work</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal truncate">alex@company.dev</span>
          </div>
        </button>

        {/* Account 3: Use Another Account / Real Firebase Login */}
        <button
          type="button"
          onClick={() => handleSelectAccount('real_firebase')}
          disabled={loadingAccount !== null}
          className={`animate-entrance pill-bloom ${THEME.buttons.base} ${THEME.buttons.lightPill} justify-start px-4 text-slate-600 hover:text-slate-900`}
          style={{ animationDelay: '320ms' }}
        >
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-[13px] sm:text-[14px] font-medium">Use another Google account</span>
        </button>
      </div>

      {/* Google Disclosure Notice */}
      <div 
        className="animate-entrance mt-5 sm:mt-6 flex flex-col items-center gap-3 w-full"
        style={{ animationDelay: '380ms' }}
      >
        <p className={THEME.typography.caption}>
          To continue, Google will share your name, email address, language preference, and profile picture with JobMate.
        </p>

        {/* Return to Sign-in */}
        <button
          type="button"
          onClick={onBack}
          className={`mt-2 ${THEME.typography.returnLink}`}
        >
          <span>← Back to sign-in options</span>
        </button>
      </div>

    </div>
  );
};
