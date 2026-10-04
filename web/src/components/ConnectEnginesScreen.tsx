import React from 'react';
import { THEME } from '../constants/theme';
import { RevolvingAtmosphere } from './RevolvingAtmosphere';
import { isKeyConnected, removeStoredKey } from '../lib/keys';

interface ConnectEnginesScreenProps {
  onBack?: () => void;
  onOpenGeminiKeyFlow: () => void;
  onOpenGenericKeyFlow?: (engine: 'groq' | 'anthropic' | 'openai' | 'gitlab') => void;
  onContinue?: () => void;
  isGitHubConnected?: boolean;
}

export const ConnectEnginesScreen: React.FC<ConnectEnginesScreenProps> = ({
  onBack,
  onOpenGeminiKeyFlow,
  onOpenGenericKeyFlow,
  onContinue,
  isGitHubConnected = true,
}) => {
  const isGeminiVerified = isKeyConnected('gemini');
  const isGroqConnected = isKeyConnected('groq');
  const isAnthropicConnected = isKeyConnected('anthropic');
  const isOpenAIConnected = isKeyConnected('openai');
  const isGitLabConnected = isKeyConnected('gitlab');

  const handleDisconnectGemini = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeStoredKey('gemini');
    window.location.reload();
  };

  return (
    <div className={`relative min-h-[100dvh] w-full ${THEME.canvasBg} text-slate-900 flex flex-col justify-between overflow-x-hidden selection:bg-sky-100 selection:text-sky-900 font-sans`}>
      
      {/* Pinned Top Progress Bar - Delphi style (50% progress) */}
      <div className="fixed top-0 inset-x-0 h-[2.5px] bg-slate-100 z-50">
        <div className="h-full bg-[#0284c7] w-1/2 transition-all duration-500" />
      </div>

      {/* Top-Left Back Arrow Navigation */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute top-5 left-5 sm:top-7 sm:left-8 z-40 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95 transition-all cursor-pointer"
          aria-label="Go back"
        >
          <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
      )}

      {/* Main Centered Onboarding Stack */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20 pb-12 w-full">
        <div className="w-full max-w-[420px] mx-auto flex flex-col items-center">
          
          {/* Header Typography */}
          <h1 className="animate-entrance text-2xl sm:text-[27px] font-bold text-slate-900 tracking-tight text-center">
            Connect your AI engines
          </h1>
          <p className="animate-entrance text-[14px] sm:text-[15px] text-slate-500 text-center mt-2 mb-7 leading-relaxed max-w-[380px]">
            JobMate runs AI client-side to parse your resume and substantiate codebase proof.
          </p>

          {/* 6 Provider Pill Rows */}
          <div className="w-full flex flex-col gap-2.5">
            
            {/* 1. Google Gemini (Required) */}
            <div
              onClick={onOpenGeminiKeyFlow}
              className={`animate-entrance w-full h-[50px] px-5 rounded-full bg-white border ${
                isGeminiVerified 
                  ? 'border-emerald-200 hover:border-emerald-400' 
                  : 'border-slate-200/90 hover:border-sky-300'
              } shadow-xs flex items-center justify-between transition-all duration-200 hover:shadow-sm cursor-pointer select-none group`}
              style={{ animationDelay: '40ms' }}
            >
              <div className="flex items-center gap-3">
                {/* Gemini Sparkle Icon */}
                <div className="w-6 h-6 flex items-center justify-center text-sky-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path 
                      d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z" 
                      fill="url(#gemini-grad)" 
                    />
                    <defs>
                      <linearGradient id="gemini-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0284c7" />
                        <stop offset="1" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="flex items-center">
                  <span className="text-[15px] font-medium text-slate-800">Google Gemini</span>
                  <span className="text-xs text-slate-400 font-normal ml-2">(Required)</span>
                </div>
              </div>

              {/* Right Side Status */}
              <div>
                {isGeminiVerified ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    <button
                      type="button"
                      onClick={handleDisconnectGemini}
                      title="Disconnect key"
                      className="text-[11px] text-slate-400 hover:text-rose-500 ml-1 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-all">
                    <svg className="w-4 h-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Groq */}
            <div
              onClick={() => onOpenGenericKeyFlow?.('groq')}
              className="animate-entrance w-full h-[50px] px-5 rounded-full bg-white border border-slate-200/90 hover:border-sky-300 shadow-xs flex items-center justify-between transition-all duration-200 hover:shadow-sm cursor-pointer select-none group"
              style={{ animationDelay: '80ms' }}
            >
              <div className="flex items-center gap-3">
                {/* Groq Lightning Icon */}
                <div className="w-6 h-6 flex items-center justify-center text-amber-500">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-[15px] font-medium text-slate-800">Groq</span>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-all">
                {isGroqConnected ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
                ) : (
                  <svg className="w-4 h-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
              </div>
            </div>

            {/* 3. Anthropic */}
            <div
              onClick={() => onOpenGenericKeyFlow?.('anthropic')}
              className="animate-entrance w-full h-[50px] px-5 rounded-full bg-white border border-slate-200/90 hover:border-sky-300 shadow-xs flex items-center justify-between transition-all duration-200 hover:shadow-sm cursor-pointer select-none group"
              style={{ animationDelay: '120ms' }}
            >
              <div className="flex items-center gap-3">
                {/* Anthropic Icon */}
                <div className="w-6 h-6 flex items-center justify-center text-indigo-500">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <span className="text-[15px] font-medium text-slate-800">Anthropic</span>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-all">
                {isAnthropicConnected ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
                ) : (
                  <svg className="w-4 h-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
              </div>
            </div>

            {/* 4. OpenAI / DeepSeek / Custom */}
            <div
              onClick={() => onOpenGenericKeyFlow?.('openai')}
              className="animate-entrance w-full h-[50px] px-5 rounded-full bg-white border border-slate-200/90 hover:border-sky-300 shadow-xs flex items-center justify-between transition-all duration-200 hover:shadow-sm cursor-pointer select-none group"
              style={{ animationDelay: '160ms' }}
            >
              <div className="flex items-center gap-3">
                {/* Neural / Custom API Icon */}
                <div className="w-6 h-6 flex items-center justify-center text-emerald-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="6" r="2.5" />
                    <circle cx="18" cy="6" r="2.5" />
                    <circle cx="12" cy="18" r="2.5" />
                    <path d="M7.8 7.8L10.5 15.5M16.2 7.8L13.5 15.5M8.5 6h7" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[15px] font-medium text-slate-800">OpenAI / DeepSeek / Custom</span>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-all">
                {isOpenAIConnected ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
                ) : (
                  <svg className="w-4 h-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
              </div>
            </div>

            {/* 5. GitHub (Connected) */}
            <div
              className="animate-entrance w-full h-[50px] px-5 rounded-full bg-white border border-slate-200/90 shadow-xs flex items-center justify-between select-none"
              style={{ animationDelay: '200ms' }}
            >
              <div className="flex items-center gap-3">
                {/* GitHub Octocat Icon */}
                <div className="w-6 h-6 flex items-center justify-center text-slate-900">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </div>
                <span className="text-[15px] font-medium text-slate-800">GitHub</span>
              </div>
              <div>
                {isGitHubConnected ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400">
                    <svg className="w-4 h-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* 6. GitLab */}
            <div
              onClick={() => onOpenGenericKeyFlow?.('gitlab')}
              className="animate-entrance w-full h-[50px] px-5 rounded-full bg-white border border-slate-200/90 hover:border-sky-300 shadow-xs flex items-center justify-between transition-all duration-200 hover:shadow-sm cursor-pointer select-none group"
              style={{ animationDelay: '240ms' }}
            >
              <div className="flex items-center gap-3">
                {/* GitLab Tanuki Icon */}
                <div className="w-6 h-6 flex items-center justify-center text-[#e24329]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.65 14.39L20.6 8.07a.9.9 0 00-.31-.44.89.89 0 00-.54-.18.92.92 0 00-.54.18.9.9 0 00-.31.44l-1.9 5.86H6.99L5.09 8.07a.9.9 0 00-.31-.44.89.89 0 00-.54-.18.92.92 0 00-.54.18.9.9 0 00-.31.44L1.35 14.39a.84.84 0 00.31.94l10.05 7.3a.58.58 0 00.58 0l10.05-7.3a.84.84 0 00.31-.94z" />
                  </svg>
                </div>
                <span className="text-[15px] font-medium text-slate-800">GitLab</span>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-all">
                {isGitLabConnected ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
                ) : (
                  <svg className="w-4 h-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
              </div>
            </div>

          </div>

          {/* Large Circular Progression Button */}
          <div 
            className="animate-entrance mt-8 sm:mt-10 flex flex-col items-center gap-3"
            style={{ animationDelay: '280ms' }}
          >
            {isGeminiVerified ? (
              // Unlocked Active State: Vibrant Cerulean Circle with Smooth Forward Arrow
              <button
                type="button"
                onClick={onContinue}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center cursor-pointer shadow-lg shadow-sky-500/25 active:scale-95 transition-all duration-200 group"
                aria-label="Continue to next step"
              >
                <svg className="w-6 h-6 stroke-[2.4] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            ) : (
              // Locked State: Inactive Greyed-out Circle
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 border border-slate-200 text-slate-300 flex items-center justify-center cursor-not-allowed select-none shadow-xs"
                title="Connect and verify Google Gemini to unlock"
                aria-label="Continue locked"
              >
                <svg className="w-6 h-6 stroke-[2.4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            )}

            {/* Helper Caption */}
            <p className="text-[12px] text-slate-400 text-center">
              {isGeminiVerified ? (
                <span className="text-emerald-600 font-medium">Gemini verified · Click to continue</span>
              ) : (
                'Connect and verify Google Gemini to unlock continue'
              )}
            </p>
          </div>

        </div>
      </main>

      {/* Atmospheric Concentric Rings Horizon */}
      <RevolvingAtmosphere />

    </div>
  );
};
