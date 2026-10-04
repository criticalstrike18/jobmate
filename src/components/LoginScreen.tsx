import React, { useState, useEffect, useRef } from 'react';
import { THEME } from '../constants/theme';
import type { AuthFlowView, AuthUser } from '../types/auth';
import { 
  getFirebaseConfigStatus, 
  subscribeToAuthChanges, 
  logoutUser 
} from '../lib/firebase';
import { isKeyConnected } from '../lib/keys';
import { Header } from './Header';
import { Footer } from './Footer';
import { RevolvingAtmosphere } from './RevolvingAtmosphere';
import { GoogleFlowScreen } from './GoogleFlowScreen';
import { GithubFlowScreen } from './GithubFlowScreen';
import { GitlabFlowScreen } from './GitlabFlowScreen';
import { AuthenticatedScreen } from './AuthenticatedScreen';
import { ConnectEnginesScreen } from './ConnectEnginesScreen';
import { GeminiKeyFlowScreen } from './GeminiKeyFlowScreen';
import { GenericKeyFlowScreen } from './GenericKeyFlowScreen';
import { EnginesReadyScreen } from './EnginesReadyScreen';

interface LoginScreenProps {
  onNavigateHome?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateHome }) => {
  const isFreshLoginRef = useRef(false);

  const [currentView, setCurrentView] = useState<AuthFlowView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      if (view === 'engines' || view === 'connect-engines') return 'connect-engines';
      if (view === 'gemini-key' || view === 'gemini') return 'gemini-key-flow';
      if (view === 'ready' || view === 'engines-ready') return 'engines-ready';

      const savedView = localStorage.getItem('jobmate_active_view') as AuthFlowView | null;
      if (savedView && ['connect-engines', 'gemini-key-flow', 'generic-key-flow', 'engines-ready'].includes(savedView)) {
        return savedView;
      }
    }
    return 'main';
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [showFirebaseModal, setShowFirebaseModal] = useState<boolean>(false);
  const [activeGenericEngine, setActiveGenericEngine] = useState<'groq' | 'anthropic' | 'openai' | 'gitlab'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jobmate_generic_engine');
      if (saved === 'groq' || saved === 'anthropic' || saved === 'openai' || saved === 'gitlab') {
        return saved;
      }
    }
    return 'groq';
  });

  const configStatus = getFirebaseConfigStatus();

  const navigateToView = (view: AuthFlowView) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      if (['connect-engines', 'gemini-key-flow', 'generic-key-flow', 'engines-ready', 'authenticated'].includes(view)) {
        localStorage.setItem('jobmate_active_view', view);
      } else {
        localStorage.removeItem('jobmate_active_view');
      }
    }
  };

  // Listen to live Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (user) {
        setCurrentUser(user);

        // If this auth state change was triggered by fresh interactive login in this session,
        // do not override the direct transition to connect-engines
        if (isFreshLoginRef.current) {
          return;
        }

        // Returning from a previous session:
        // "only show the previous screen if left in the middle"
        const savedView = (typeof window !== 'undefined' ? localStorage.getItem('jobmate_active_view') : null) as AuthFlowView | null;
        const geminiConnected = isKeyConnected('gemini');

        const inMiddleOfFlow = 
          (savedView && ['connect-engines', 'gemini-key-flow', 'generic-key-flow'].includes(savedView)) ||
          !geminiConnected;

        if (inMiddleOfFlow) {
          // Restore the previous screen where the user left off in the middle
          const viewToResume = (savedView && ['connect-engines', 'gemini-key-flow', 'generic-key-flow'].includes(savedView))
            ? savedView
            : 'connect-engines';
          navigateToView(viewToResume);
        } else {
          // Session already completed onboarding (or explicitly on authenticated view)
          const viewToShow = savedView === 'engines-ready' ? 'engines-ready' : 'authenticated';
          navigateToView(viewToShow);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleProviderClick = (provider: 'google' | 'github' | 'gitlab') => {
    setLoadingProvider(provider);
    setTimeout(() => {
      setLoadingProvider(null);
      if (provider === 'google') navigateToView('google-flow');
      if (provider === 'github') navigateToView('github-flow');
      if (provider === 'gitlab') navigateToView('gitlab-flow');
    }, 280);
  };

  /**
   * Called right after interactive login succeeds.
   * If not returning from a previous session, show connect AI engines screen right after logging in to maintain flow.
   */
  const handleAuthSuccess = (user: AuthUser) => {
    isFreshLoginRef.current = true;
    setCurrentUser(user);
    navigateToView('connect-engines');
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jobmate_active_view');
      localStorage.removeItem('jobmate_generic_engine');
    }
    navigateToView('main');
  };

  // Delphi Full-Screen Onboarding Views (Distraction-free, zero header/footer clutter)
  if (currentView === 'connect-engines') {
    return (
      <ConnectEnginesScreen
        onBack={() => currentUser ? navigateToView('authenticated') : (onNavigateHome ? onNavigateHome() : navigateToView('main'))}
        onOpenGeminiKeyFlow={() => navigateToView('gemini-key-flow')}
        onOpenGenericKeyFlow={(engine) => {
          setActiveGenericEngine(engine);
          if (typeof window !== 'undefined') {
            localStorage.setItem('jobmate_generic_engine', engine);
          }
          navigateToView('generic-key-flow');
        }}
        onContinue={() => navigateToView('engines-ready')}
        isGitHubConnected={currentUser ? currentUser.providerId.includes('github') : true}
      />
    );
  }

  if (currentView === 'gemini-key-flow') {
    return (
      <GeminiKeyFlowScreen
        onBack={() => navigateToView('connect-engines')}
        onSuccess={() => navigateToView('connect-engines')}
      />
    );
  }

  if (currentView === 'generic-key-flow') {
    return (
      <GenericKeyFlowScreen
        engine={activeGenericEngine}
        onBack={() => navigateToView('connect-engines')}
        onSuccess={() => navigateToView('connect-engines')}
      />
    );
  }

  if (currentView === 'engines-ready') {
    return (
      <EnginesReadyScreen
        onBackToEngines={() => navigateToView('connect-engines')}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  return (
    <div className={`${THEME.canvasBg} ${THEME.canvasText} ${THEME.layout.pageContainer}`}>
      
      {/* Standardized Header across all views */}
      <Header onLogoClick={() => currentView === 'main' ? onNavigateHome?.() : navigateToView('main')} />

      {/* Main Center Area - Seamless, Zero Box-Inside-Box across all flows */}
      <main className={THEME.layout.mainContainer}>
        {currentView === 'main' && (
          <div className={THEME.layout.centerContainer}>
            
            {/* Horizontal Brand Lockup */}
            <div 
              className="animate-entrance flex items-center justify-center gap-3 cursor-default group transition-transform duration-300 hover:scale-[1.02]" 
              style={{ animationDelay: '0ms' }}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-[1.5px] shadow-xs flex items-center justify-center transition-all duration-300 group-hover:rotate-[6deg] group-hover:shadow-[0_0_16px_rgba(2,132,199,0.3)]">
                <div className="w-full h-full bg-white rounded-[10.5px] flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 text-sky-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M5.5 8C5.5 5.51472 7.51472 3.5 10 3.5V3.5C12.4853 3.5 14.5 5.51472 14.5 8V16C14.5 18.4853 12.4853 20.5 10 20.5V20.5C7.51472 20.5 5.5 18.4853 5.5 16" 
                      stroke="currentColor" 
                      strokeLinecap="round" 
                      strokeWidth="2.2" 
                    />
                    <path 
                      d="M14.5 9.5L18.5 14L22.5 9.5V16C22.5 17.5 21.5 18.5 20 18.5" 
                      stroke="currentColor" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2.2" 
                    />
                    <circle cx="10" cy="8" fill="currentColor" r="1.8" />
                    <circle cx="18.5" cy="14" fill="currentColor" r="1.4" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
                JobMate
              </span>
            </div>

            {/* Standard Subtitle */}
            <p 
              className={`animate-entrance mt-4 sm:mt-[20px] ${THEME.typography.subtitle} px-2`}
              style={{ animationDelay: '100ms' }}
            >
              Sign In or Create Your Account
            </p>

            {/* 3 Full-Width Standard 50px Pill Buttons */}
            <div className="w-full mt-7 sm:mt-[36px] flex flex-col gap-3">
              
              {/* Google Button */}
              <button 
                type="button"
                onClick={() => handleProviderClick('google')}
                disabled={loadingProvider !== null}
                className={`animate-entrance pill-bloom ${THEME.buttons.base} ${THEME.buttons.lightPill}`} 
                style={{ animationDelay: '200ms' }}
              >
                {loadingProvider === 'google' ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-2deg]" viewBox="0 0 24 24">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4" />
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853" />
                    <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* GitHub Button */}
              <button 
                type="button"
                onClick={() => handleProviderClick('github')}
                disabled={loadingProvider !== null}
                className={`animate-entrance pill-bloom ${THEME.buttons.base} ${THEME.buttons.lightPill}`} 
                style={{ animationDelay: '280ms' }}
              >
                {loadingProvider === 'github' ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0 fill-current text-[#24292F] transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-2deg]" viewBox="0 0 24 24">
                    <path clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fillRule="evenodd" />
                  </svg>
                )}
                <span>Continue with GitHub</span>
              </button>

              {/* GitLab Button */}
              <button 
                type="button"
                onClick={() => handleProviderClick('gitlab')}
                disabled={loadingProvider !== null}
                className={`animate-entrance pill-bloom ${THEME.buttons.base} ${THEME.buttons.lightPill}`} 
                style={{ animationDelay: '360ms' }}
              >
                {loadingProvider === 'gitlab' ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-2deg]" viewBox="0 0 24 24">
                    <path d="m12 20.896 3.658-11.26H8.342L12 20.896z" fill="#E24329" />
                    <path d="M12 20.896 8.342 9.636H1.385L12 20.896z" fill="#FC6D26" />
                    <path d="M1.385 9.636.321 12.91a.916.916 0 0 0 .333 1.025L12 20.896 1.385 9.636z" fill="#FCA326" />
                    <path d="M1.385 9.636h6.957L5.688 1.464a.458.458 0 0 0-.872 0L1.385 9.636z" fill="#E24329" />
                    <path d="M12 20.896l3.658-11.26h6.957L12 20.896z" fill="#FC6D26" />
                    <path d="m22.615 9.636 1.064 3.274a.916.916 0 0 1-.333 1.025L12 20.896l10.615-11.26z" fill="#FCA326" />
                    <path d="M22.615 9.636h-6.957l2.654-8.172a.458.458 0 0 1 .872 0l3.431 8.172z" fill="#E24329" />
                  </svg>
                )}
                <span>Continue with GitLab</span>
              </button>
            </div>

            {/* Legal Notice */}
            <div 
              className="animate-entrance mt-6 sm:mt-[24px] flex flex-col items-center" 
              style={{ animationDelay: '440ms' }}
            >
              <p className={THEME.typography.caption}>
                By continuing, you agree to JobMate's{' '}
                <a className="text-slate-600 underline underline-offset-2 hover:text-slate-900 transition-colors" href="#">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a className="text-slate-600 underline underline-offset-2 hover:text-slate-900 transition-colors" href="#">
                  Privacy Policy
                </a>.
              </p>

              {/* Back to Homepage */}
              {onNavigateHome && (
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className={`mt-4 ${THEME.typography.returnLink}`}
                >
                  <span>← Back to Homepage</span>
                </button>
              )}
            </div>

            {/* Discreet Firebase Status Toggle */}
            <div className="animate-entrance mt-5" style={{ animationDelay: '500ms' }}>
              <button
                type="button"
                onClick={() => setShowFirebaseModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 transition-all cursor-pointer"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${configStatus.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>Firebase: {configStatus.isConfigured ? 'Connected' : 'Setup Required'}</span>
              </button>
            </div>

          </div>
        )}

        {/* View: Standardized Google Flow */}
        {currentView === 'google-flow' && (
          <GoogleFlowScreen 
            onBack={() => navigateToView('main')} 
            onSuccess={handleAuthSuccess} 
          />
        )}

        {/* View: Standardized GitHub Flow */}
        {currentView === 'github-flow' && (
          <GithubFlowScreen 
            onBack={() => navigateToView('main')} 
            onSuccess={handleAuthSuccess} 
          />
        )}

        {/* View: Standardized GitLab Flow */}
        {currentView === 'gitlab-flow' && (
          <GitlabFlowScreen 
            onBack={() => navigateToView('main')} 
            onSuccess={handleAuthSuccess} 
          />
        )}

        {/* View: Authenticated Screen */}
        {currentView === 'authenticated' && currentUser && (
          <AuthenticatedScreen 
            user={currentUser} 
            onLogout={handleLogout} 
            onContinueToEngines={() => navigateToView('connect-engines')}
          />
        )}
      </main>

      {/* Shared Revolving Atmosphere across all states */}
      <RevolvingAtmosphere />

      {/* Shared Standardized Footer */}
      <Footer />

      {/* Firebase Credentials Modal */}
      {showFirebaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-entrance">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${configStatus.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <h3 className="font-semibold text-slate-900 text-sm">Firebase Authentication Setup</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowFirebaseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-600 space-y-3">
              <p>
                To enable live production Firebase authentication for Google, GitHub, and GitLab, provide your Firebase Web App credentials in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sky-700 font-mono">web/.env</code>:
              </p>

              <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto space-y-1">
                <div>VITE_FIREBASE_API_KEY=AIzaSy...</div>
                <div>VITE_FIREBASE_AUTH_DOMAIN=jobmate-app.firebaseapp.com</div>
                <div>VITE_FIREBASE_PROJECT_ID=jobmate-app</div>
                <div>VITE_FIREBASE_STORAGE_BUCKET=jobmate-app.appspot.com</div>
                <div>VITE_FIREBASE_MESSAGING_SENDER_ID=123456789</div>
                <div>VITE_FIREBASE_APP_ID=1:123456789:web:abcdef</div>
              </div>

              <div className="pt-2 text-slate-500">
                <p className="font-medium text-slate-700 mb-1">Firebase Console Checklist:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Enable <strong>Google</strong> provider in Authentication &gt; Sign-in method.</li>
                  <li>Enable <strong>GitHub</strong> provider with GitHub Client ID & Secret.</li>
                  <li>Add GitLab via OpenID Connect or custom OAuth.</li>
                  <li>Add <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">localhost</code> to Authorized Domains.</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFirebaseModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-medium rounded-full cursor-pointer transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
