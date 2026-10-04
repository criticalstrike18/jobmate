import React, { useState } from 'react';
import { THEME } from '../constants/theme';
import { RevolvingAtmosphere } from './RevolvingAtmosphere';
import { verifyGeminiApiKey, getStoredKey } from '../lib/keys';

interface GeminiKeyFlowScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const GeminiKeyFlowScreen: React.FC<GeminiKeyFlowScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const existingKey = getStoredKey('gemini') || '';
  const [apiKey, setApiKey] = useState<string>(existingKey);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ latencyMs: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setErrorMsg('Please enter your Gemini API key');
      return;
    }

    setErrorMsg(null);
    setIsVerifying(true);
    setSuccessInfo(null);

    const result = await verifyGeminiApiKey(apiKey);
    setIsVerifying(false);

    if (result.success) {
      setSuccessInfo({ latencyMs: result.latencyMs || 150 });
      setTimeout(() => {
        onSuccess();
      }, 750);
    } else {
      setErrorMsg(result.error || 'Failed to verify API key with Google Gemini.');
    }
  };

  return (
    <div className={`relative min-h-[100dvh] w-full ${THEME.canvasBg} text-slate-900 flex flex-col justify-between overflow-x-hidden selection:bg-sky-100 selection:text-sky-900 font-sans`}>
      
      {/* Pinned Top Progress Bar - Delphi style (65% progress) */}
      <div className="fixed top-0 inset-x-0 h-[2.5px] bg-slate-100 z-50">
        <div className="h-full bg-[#0284c7] w-[65%] transition-all duration-500" />
      </div>

      {/* Top-Left Back Arrow Navigation */}
      <button
        type="button"
        onClick={onBack}
        className="absolute top-5 left-5 sm:top-7 sm:left-8 z-40 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95 transition-all cursor-pointer"
        aria-label="Back to engines"
      >
        <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </button>

      {/* Main Centered Verification Stack */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20 pb-12 w-full">
        <div className="w-full max-w-[400px] sm:max-w-[420px] mx-auto flex flex-col items-center">
          
          {/* Header Typography */}
          <h1 className="animate-entrance text-2xl sm:text-[27px] font-bold text-slate-900 tracking-tight text-center">
            Verify your Gemini key
          </h1>
          <p className="animate-entrance text-[14px] sm:text-[15px] text-slate-500 text-center mt-2 mb-8 leading-relaxed">
            Enter your API key from Google AI Studio so we can verify the routing to Gemini 3.5.
          </p>

          {/* Key Entry Form */}
          <form 
            onSubmit={handleSubmit}
            className="animate-entrance w-full flex flex-col text-left"
            style={{ animationDelay: '60ms' }}
          >
            {/* Input Label & Get Key Link */}
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="gemini-key-input" className="text-sm font-medium text-slate-700">
                Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1 hover:underline transition-colors"
              >
                <span>Get free key</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Monospace Pill Input */}
            <div className="relative w-full">
              <input
                id="gemini-key-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="AIzaSy••••••••••••••••••••••••••••••••"
                autoComplete="off"
                spellCheck="false"
                className="w-full h-[50px] rounded-full border border-slate-300 bg-white px-5 pr-12 text-slate-900 placeholder:text-slate-400 font-mono text-sm focus:outline-none focus:border-[#0284c7] focus:ring-3 focus:ring-sky-100 shadow-xs transition-all"
              />

              {/* Eye Toggle Inside Pill */}
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? (
                  // Eye slash icon
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs leading-relaxed flex items-start gap-2 animate-entrance">
                <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message Box */}
            {successInfo && (
              <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed flex items-center gap-2 animate-entrance">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>Key verified and routed in {successInfo.latencyMs}ms! Saving...</span>
              </div>
            )}

            {/* Verify & Continue Primary Pill Button */}
            <button
              type="submit"
              disabled={isVerifying || !apiKey.trim()}
              className="mt-4 w-full h-[50px] rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {isVerifying ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Testing route to gemini-3.5-flash-lite...</span>
                </>
              ) : successInfo ? (
                <>
                  <span>✓ Verified</span>
                </>
              ) : (
                <span>Verify & Continue</span>
              )}
            </button>

            {/* Sub-text Helper Information */}
            <p className="text-[12px] text-slate-400 text-center mt-3">
              We perform a quick ping to gemini-3.5-flash-lite to verify your key works.
            </p>

            <p className="text-[11px] text-slate-400 text-center mt-1.5 flex items-center justify-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Encrypted in browser session. Never sent to our servers.</span>
            </p>

          </form>

        </div>
      </main>

      {/* Atmospheric Concentric Rings Horizon */}
      <RevolvingAtmosphere />

    </div>
  );
};
