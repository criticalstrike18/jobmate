import React, { useState } from 'react';
import { THEME } from '../constants/theme';
import type { AuthUser } from '../types/auth';
import { signInWithGithub, getFirebaseConfigStatus } from '../lib/firebase';

interface GithubFlowScreenProps {
  onBack: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const GithubFlowScreen: React.FC<GithubFlowScreenProps> = ({ onBack, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const configStatus = getFirebaseConfigStatus();

  const handleAuthorize = async () => {
    setIsLoading(true);
    setAuthError(null);

    if (configStatus.isConfigured) {
      try {
        const user = await signInWithGithub();
        onSuccess(user);
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'GitHub authorization failed';
        if (message === 'FIREBASE_NOT_CONFIGURED') {
          // Fall through to simulated authorization
        } else {
          setAuthError(message);
          setIsLoading(false);
          return;
        }
      }
    }

    // Interactive simulated authorization matching Stitch design
    setTimeout(() => {
      setIsLoading(false);
      onSuccess({
        uid: 'github-sim-developer',
        displayName: 'OctoDeveloper',
        email: 'developer@github.com',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        providerId: 'github.com',
      });
    }, 900);
  };

  return (
    <div className={THEME.layout.centerContainer}>
      
      {/* Brand Icon Lockup: GitHub Octocat + JobMate Mark */}
      <div 
        className="animate-entrance flex items-center justify-center gap-3 cursor-default"
        style={{ animationDelay: '0ms' }}
      >
        {/* GitHub Logo */}
        <div className="w-9 h-9 rounded-xl bg-[#24292f] shadow-xs flex items-center justify-center">
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fillRule="evenodd" />
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
        Authorize JobMate
      </h1>
      <p 
        className={`animate-entrance mt-1.5 sm:mt-2 ${THEME.typography.subtitle}`}
        style={{ animationDelay: '140ms' }}
      >
        by JobMate-org <span className="inline-flex items-center text-sky-600 font-medium text-xs ml-1">✓ Verified</span>
      </p>

      {/* Error notice if any */}
      {authError && (
        <div className="animate-entrance mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 w-full text-center">
          {authError}
        </div>
      )}

      {/* Seamless Permission Rows (Zero Box-in-a-Box) */}
      <div 
        className="animate-entrance w-full mt-6 flex flex-col gap-3 py-2 text-left"
        style={{ animationDelay: '200ms' }}
      >
        <div className="flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={THEME.typography.scopeName}>read:user</span>
            </div>
            <span className={`mt-0.5 ${THEME.typography.scopeDesc}`}>
              Personal profile metadata and verified primary email
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={THEME.typography.scopeName}>public_repo</span>
            </div>
            <span className={`mt-0.5 ${THEME.typography.scopeDesc}`}>
              Repository manifests & READMEs for automated skill proof
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Button (Standard 50px pill button) */}
      <div 
        className="animate-entrance w-full mt-6 flex flex-col gap-3"
        style={{ animationDelay: '280ms' }}
      >
        <button
          type="button"
          onClick={handleAuthorize}
          disabled={isLoading}
          className={`pill-bloom ${THEME.buttons.base} ${THEME.buttons.githubPill}`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Authorize with GitHub</span>
              <span className="text-slate-400">→</span>
            </>
          )}
        </button>

        {/* Return to Sign-in */}
        <button
          type="button"
          onClick={onBack}
          className={`mt-2 ${THEME.typography.returnLink} justify-center`}
        >
          <span>← Cancel and return to sign-in</span>
        </button>
      </div>

      {/* Security Redirect Notice */}
      <p 
        className={`animate-entrance mt-4 ${THEME.typography.caption}`}
        style={{ animationDelay: '360ms' }}
      >
        Authorizing will redirect back to jobmate.io
      </p>

    </div>
  );
};
