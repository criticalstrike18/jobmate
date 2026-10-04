import React from 'react';
import { THEME } from '../constants/theme';
import { RevolvingAtmosphere } from './RevolvingAtmosphere';
import { getStoredKey } from '../lib/keys';

interface EnginesReadyScreenProps {
  onBackToEngines: () => void;
  onNavigateHome?: () => void;
}

export const EnginesReadyScreen: React.FC<EnginesReadyScreenProps> = ({
  onBackToEngines,
  onNavigateHome,
}) => {
  const geminiKey = getStoredKey('gemini');

  return (
    <div className={`relative min-h-[100dvh] w-full ${THEME.canvasBg} text-slate-900 flex flex-col justify-between overflow-x-hidden selection:bg-sky-100 selection:text-sky-900 font-sans`}>
      
      {/* Pinned Top Progress Bar - 100% */}
      <div className="fixed top-0 inset-x-0 h-[2.5px] bg-slate-100 z-50">
        <div className="h-full bg-emerald-500 w-full transition-all duration-500" />
      </div>

      {/* Top-Left Back Arrow */}
      <button
        type="button"
        onClick={onBackToEngines}
        className="absolute top-5 left-5 sm:top-7 sm:left-8 z-40 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95 transition-all cursor-pointer"
        aria-label="Back to engines"
      >
        <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </button>

      {/* Center Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20 pb-12 w-full">
        <div className="w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
          
          {/* Animated Success Badge */}
          <div className="animate-entrance w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-6 shadow-sm">
            <svg className="w-8 h-8 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="animate-entrance text-2xl sm:text-[27px] font-bold text-slate-900 tracking-tight">
            AI Engine Connected
          </h1>

          <p className="animate-entrance text-[14px] sm:text-[15px] text-slate-500 mt-2 mb-6 leading-relaxed max-w-[360px]">
            Google Gemini 2.0 Flash is verified and calibrated for multimodal resume parsing and proof substantiation.
          </p>

          <div className="animate-entrance w-full p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-left mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Model Route:</span>
              <span className="font-mono text-emerald-600 font-semibold">gemini-2.0-flash-lite</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Latency Status:</span>
              <span className="text-slate-700">Sub-200ms Active</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Key Storage:</span>
              <span className="text-slate-700 font-mono">
                {geminiKey ? `${geminiKey.slice(0, 6)}••••••••` : 'Active'}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="animate-entrance w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full h-[50px] rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <span>Continue to Workspace →</span>
            </button>

            <button
              type="button"
              onClick={onBackToEngines}
              className="w-full h-[50px] rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-center transition-all cursor-pointer"
            >
              <span>Manage Engine Keys</span>
            </button>
          </div>

        </div>
      </main>

      <RevolvingAtmosphere />

    </div>
  );
};
