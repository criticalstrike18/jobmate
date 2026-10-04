import React, { useState } from 'react';
import { THEME } from '../constants/theme';
import type { AuthUser } from '../types/auth';
import { signInWithGitlab, getFirebaseConfigStatus } from '../lib/firebase';

interface GitlabFlowScreenProps {
  onBack: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const GitlabFlowScreen: React.FC<GitlabFlowScreenProps> = ({ onBack, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const configStatus = getFirebaseConfigStatus();

  const handleAuthorize = async () => {
    setIsLoading(true);
    setAuthError(null);

    if (configStatus.isConfigured) {
      try {
        const user = await signInWithGitlab();
        onSuccess(user);
        return;
      } catch (err: unknown) {
        if ((err as any)?.code === 'auth/popup-closed-by-user' || (err as any)?.code === 'auth/cancelled-popup-request') {
          return;
        }
        const message = err instanceof Error ? err.message : 'GitLab authorization failed';
        if (message === 'FIREBASE_NOT_CONFIGURED') {
          // Fall through to simulated authorization
        } else {
          setAuthError(message);
          return;
        }
      } finally {
        setIsLoading(false);
      }
    }

    // Interactive simulated authorization matching Stitch design
    setTimeout(() => {
      setIsLoading(false);
      onSuccess({
        uid: 'gitlab-sim-engineer',
        displayName: 'GitLabEngineer',
        email: 'engineer@gitlab.com',
        photoURL: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
        providerId: 'gitlab.com',
      });
    }, 900);
  };

  const handleDemoSignIn = () => {
    onSuccess({
      uid: 'gitlab-sim-engineer',
      displayName: 'GitLabEngineer',
      email: 'engineer@gitlab.com',
      photoURL: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      providerId: 'gitlab.com',
    });
  };

  return (
    <div className={THEME.layout.centerContainer}>
      
      {/* Brand Icon Lockup: GitLab Tanuki + JobMate Mark */}
      <div 
        className="animate-entrance flex items-center justify-center gap-3 cursor-default"
        style={{ animationDelay: '0ms' }}
      >
        {/* GitLab Tanuki */}
        <div className="w-9 h-9 rounded-xl bg-orange-50/70 border border-orange-200/50 shadow-xs flex items-center justify-center">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="m12 20.896 3.658-11.26H8.342L12 20.896z" fill="#E24329" />
            <path d="M12 20.896 8.342 9.636H1.385L12 20.896z" fill="#FC6D26" />
            <path d="M1.385 9.636.321 12.91a.916.916 0 0 0 .333 1.025L12 20.896 1.385 9.636z" fill="#FCA326" />
            <path d="M1.385 9.636h6.957L5.688 1.464a.458.458 0 0 0-.872 0L1.385 9.636z" fill="#E24329" />
            <path d="M12 20.896l3.658-11.26h6.957L12 20.896z" fill="#FC6D26" />
            <path d="m22.615 9.636 1.064 3.274a.916.916 0 0 1-.333 1.025L12 20.896l10.615-11.26z" fill="#FCA326" />
            <path d="M22.615 9.636h-6.957l2.654-8.172a.458.458 0 0 1 .872 0l3.431 8.172z" fill="#E24329" />
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
        Authorize GitLab
      </h1>
      <p 
        className={`animate-entrance mt-1.5 sm:mt-2 ${THEME.typography.subtitle}`}
        style={{ animationDelay: '140ms' }}
      >
        JobMate is requesting account access
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
            <span className={THEME.typography.scopeName}>openid & profile</span>
            <span className={`mt-0.5 ${THEME.typography.scopeDesc}`}>
              GitLab identity, handle, and avatar photo
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
          <div className="flex flex-col">
            <span className={THEME.typography.scopeName}>email</span>
            <span className={`mt-0.5 ${THEME.typography.scopeDesc}`}>
              Verified primary email for ATS matching
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
          <div className="flex flex-col">
            <span className={THEME.typography.scopeName}>Single Sign-On</span>
            <span className={`mt-0.5 ${THEME.typography.scopeDesc}`}>
              Secure client-side session authentication
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
          className={`pill-bloom ${THEME.buttons.base} ${THEME.buttons.gitlabPill}`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Authorize with GitLab</span>
              <span className="text-white/80">→</span>
            </>
          )}
        </button>

        {/* Return to Sign-in */}
        <button
          type="button"
          onClick={onBack}
          className={`mt-2 ${THEME.typography.returnLink} justify-center`}
        >
          <span>← Deny and return to sign-in</span>
        </button>
      </div>

      {/* Security Redirect Notice */}
      <div 
        className="animate-entrance mt-4 flex flex-col items-center gap-2 w-full"
        style={{ animationDelay: '360ms' }}
      >
        <p className={THEME.typography.caption}>
          Authorizing will redirect back to jobmate.io
        </p>

        {/* Discreet Simulation Bypass */}
        <button
          type="button"
          onClick={handleDemoSignIn}
          className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors mt-0.5 cursor-pointer"
        >
          Or continue with demo preview
        </button>
      </div>

    </div>
  );
};
