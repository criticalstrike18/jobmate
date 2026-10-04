import { useState } from 'react';

export const LoginScreen = () => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuthLogin = (provider: 'google' | 'github' | 'gitlab') => {
    setLoadingProvider(provider);
    setTimeout(() => {
      setLoadingProvider(null);
    }, 1200);
  };

  return (
    <div className="bg-[#fafcff] text-slate-900 antialiased min-h-[100dvh] flex flex-col justify-between selection:bg-sky-100 selection:text-sky-900 relative overflow-x-hidden font-sans">
      
      {/* Top Bar Navigation / Minimal Header */}
      <header className="w-full max-w-7xl mx-auto px-5 sm:px-8 pt-5 sm:pt-6 flex items-center justify-between z-10">
        <a 
          href="#" 
          className="text-xs sm:text-[13px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors flex items-center gap-1.5"
        >
          <span>jobmate.io</span>
        </a>
        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-neutral-50/80 border border-neutral-100 text-[11px] sm:text-[12px] font-medium text-neutral-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Verified ATS Network</span>
        </div>
      </header>

      {/* Main Center Area - Seamless, Zero Box-Inside-Box, Fully Responsive */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 w-full">
        <div className="w-full max-w-[380px] mx-auto flex flex-col items-center text-center">
          
          {/* Horizontal Logo Lockup (Icon + JobMate on single row with micro-interaction) */}
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

          {/* Subtitle (Exactly 20px below logo, identical to Delphi) */}
          <p 
            className="animate-entrance mt-4 sm:mt-[20px] text-[15px] sm:text-[17px] font-normal text-slate-500 tracking-normal px-2" 
            style={{ animationDelay: '100ms' }}
          >
            Sign In or Create Your Account
          </p>

          {/* 3 Full-Width Pill Buttons (36px below subtitle, 12px gap) */}
          <div className="w-full mt-7 sm:mt-[36px] flex flex-col gap-3">
            
            {/* Google OAuth Button */}
            <button 
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={loadingProvider !== null}
              className="animate-entrance pill-bloom w-full h-[48px] sm:h-[50px] px-5 sm:px-6 rounded-full border border-slate-200/90 bg-white/90 hover:bg-white hover:border-sky-300 hover:-translate-y-[1.5px] hover:scale-[1.01] active:scale-[0.985] active:translate-y-0 shadow-sm flex items-center justify-center gap-3 text-[14px] sm:text-[15px] font-medium text-slate-800 group cursor-pointer disabled:opacity-60 transition-all" 
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
              <span className="tracking-tight">Continue with Google</span>
            </button>

            {/* GitHub OAuth Button */}
            <button 
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={loadingProvider !== null}
              className="animate-entrance pill-bloom w-full h-[48px] sm:h-[50px] px-5 sm:px-6 rounded-full border border-slate-200/90 bg-white/90 hover:bg-white hover:border-sky-300 hover:-translate-y-[1.5px] hover:scale-[1.01] active:scale-[0.985] active:translate-y-0 shadow-sm flex items-center justify-center gap-3 text-[14px] sm:text-[15px] font-medium text-slate-800 group cursor-pointer disabled:opacity-60 transition-all" 
              style={{ animationDelay: '280ms' }}
            >
              {loadingProvider === 'github' ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 flex-shrink-0 fill-current text-[#24292F] transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-2deg]" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fillRule="evenodd" />
                </svg>
              )}
              <span className="tracking-tight">Continue with GitHub</span>
            </button>

            {/* GitLab OAuth Button */}
            <button 
              type="button"
              onClick={() => handleOAuthLogin('gitlab')}
              disabled={loadingProvider !== null}
              className="animate-entrance pill-bloom w-full h-[48px] sm:h-[50px] px-5 sm:px-6 rounded-full border border-slate-200/90 bg-white/90 hover:bg-white hover:border-sky-300 hover:-translate-y-[1.5px] hover:scale-[1.01] active:scale-[0.985] active:translate-y-0 shadow-sm flex items-center justify-center gap-3 text-[14px] sm:text-[15px] font-medium text-slate-800 group cursor-pointer disabled:opacity-60 transition-all" 
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
              <span className="tracking-tight">Continue with GitLab</span>
            </button>
          </div>

          {/* Understated Legal Disclaimer (SOC 2 Line completely removed) */}
          <div 
            className="animate-entrance mt-6 sm:mt-[24px] flex flex-col items-center" 
            style={{ animationDelay: '440ms' }}
          >
            <p className="text-center text-[12px] text-slate-400 font-normal leading-relaxed px-2">
              By continuing, you agree to JobMate's{' '}
              <a className="text-slate-600 underline underline-offset-2 hover:text-slate-900 transition-colors" href="#">
                Terms of Service
              </a>{' '}
              and{' '}
              <a className="text-slate-600 underline underline-offset-2 hover:text-slate-900 transition-colors" href="#">
                Privacy Policy
              </a>.
            </p>
          </div>
        </div>
      </main>

      {/* Delphi Ambient Bottom Atmosphere with Smooth REVOLVING Orbital Rings */}
      <div 
        aria-hidden="true" 
        className="fixed inset-x-0 bottom-0 h-[380px] sm:h-[460px] pointer-events-none z-0 overflow-hidden flex items-end justify-center"
      >
        {/* Soft breathing radial background aura */}
        <div className="absolute inset-0 delphi-ambient-glow animate-breathe" />

        {/* Dynamic Revolving Orbital Horizon Container (Anchored at Bottom Center) */}
        <div className="relative w-[1800px] h-[900px] -mb-[520px] sm:-mb-[480px] flex items-center justify-center pointer-events-none">
          
          {/* Ring 1 (Outermost Orbit): Clockwise slow revolution */}
          <div className="absolute w-[1600px] h-[1600px] rounded-full animate-spin-orbit-slow">
            <svg className="w-full h-full" viewBox="0 0 1600 1600" fill="none">
              <circle 
                cx="800" 
                cy="800" 
                r="780" 
                stroke="#0284c7" 
                strokeWidth="1.2" 
                strokeOpacity="0.25" 
                strokeDasharray="18 22" 
              />
              {/* Subtle accent dash pulses along the orbit */}
              <circle 
                cx="800" 
                cy="800" 
                r="780" 
                stroke="#38bdf8" 
                strokeWidth="2" 
                strokeOpacity="0.6" 
                strokeDasharray="60 740" 
              />
            </svg>
          </div>

          {/* Ring 2 (Middle Orbit): Counter-clockwise revolution */}
          <div className="absolute w-[1240px] h-[1240px] rounded-full animate-spin-orbit-reverse">
            <svg className="w-full h-full" viewBox="0 0 1240 1240" fill="none">
              <circle 
                cx="620" 
                cy="620" 
                r="600" 
                stroke="#38bdf8" 
                strokeWidth="1.2" 
                strokeOpacity="0.22" 
                strokeDasharray="28 20 8 20" 
              />
              {/* Glowing revolving node on mid ring */}
              <circle 
                cx="620" 
                cy="20" 
                r="3" 
                fill="#38bdf8" 
                className="opacity-75 drop-shadow-[0_0_8px_#38bdf8]" 
              />
              <circle 
                cx="620" 
                cy="1220" 
                r="2.5" 
                fill="#0284c7" 
                className="opacity-60 drop-shadow-[0_0_6px_#0284c7]" 
              />
            </svg>
          </div>

          {/* Ring 3 (Inner Orbit): Faster Clockwise revolution */}
          <div className="absolute w-[880px] h-[880px] rounded-full animate-spin-orbit-fast">
            <svg className="w-full h-full" viewBox="0 0 880 880" fill="none">
              <circle 
                cx="440" 
                cy="440" 
                r="420" 
                stroke="#0284c7" 
                strokeWidth="1" 
                strokeOpacity="0.18" 
                strokeDasharray="12 16" 
              />
              <circle 
                cx="440" 
                cy="20" 
                r="2" 
                fill="#7dd3fc" 
                className="opacity-70" 
              />
            </svg>
          </div>

          {/* Ring 4 (Deep Core Orbit): Continuous streaming dashes */}
          <div className="absolute w-[560px] h-[560px] rounded-full animate-dash-stream">
            <svg className="w-full h-full" viewBox="0 0 560 560" fill="none">
              <circle 
                cx="280" 
                cy="280" 
                r="260" 
                stroke="#0ea5e9" 
                strokeWidth="0.8" 
                strokeOpacity="0.15" 
                strokeDasharray="6 12" 
              />
            </svg>
          </div>

        </div>
      </div>

      {/* Minimal Clean Responsive Footer */}
      <footer 
        className="animate-entrance w-full relative z-10 bg-transparent" 
        style={{ animationDelay: '550ms' }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center w-full px-5 sm:px-8 py-4 sm:py-5 max-w-7xl mx-auto gap-2.5 sm:gap-4 text-xs text-slate-400 text-center sm:text-left">
          <span>© {new Date().getFullYear()} JobMate Inc. All rights reserved.</span>
          <div className="flex items-center gap-5 sm:gap-6">
            <a className="hover:text-slate-600 transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-slate-600 transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-slate-600 transition-colors" href="#">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
