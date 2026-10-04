import React from 'react';
import { THEME } from '../constants/theme';
import { Footer } from './Footer';
import { RevolvingAtmosphere } from './RevolvingAtmosphere';

interface HomeScreenProps {
  onNavigateToLogin: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToLogin }) => {
  return (
    <div className={`${THEME.canvasBg} ${THEME.canvasText} ${THEME.layout.pageContainer}`}>
      
      {/* Top Header with Sign In CTA */}
      <header className={THEME.layout.headerContainer}>
        <div className="flex items-center gap-6">
          <a 
            href="/" 
            className="text-xs sm:text-[13px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors flex items-center gap-1.5"
          >
            <span>jobmate.io</span>
          </a>
          <div className={`hidden sm:flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-neutral-50/80 border border-neutral-100 ${THEME.typography.badge}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Verified ATS Network</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-xs sm:text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer px-3 py-1.5"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="pill-bloom px-4 sm:px-5 h-[36px] sm:h-[40px] rounded-full bg-[#18181b] hover:bg-black text-white text-xs sm:text-[13px] font-medium transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <span className="text-slate-400">→</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16 w-full max-w-5xl mx-auto text-center">
        
        {/* Category Pill Tag */}
        <div 
          className="animate-entrance inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/70 text-[12px] font-medium text-sky-800 mb-6 sm:mb-8"
          style={{ animationDelay: '0ms' }}
        >
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span>Multimodal AI & Verified Codebase Job Discovery</span>
        </div>

        {/* Hero Title */}
        <h1 
          className="animate-entrance text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 max-w-3xl leading-[1.12]"
          style={{ animationDelay: '100ms' }}
        >
          The Developer Career Engine Built for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
            Proof
          </span>
          , Not Keywords.
        </h1>

        {/* Hero Subtitle */}
        <p 
          className="animate-entrance mt-5 sm:mt-6 text-base sm:text-lg md:text-xl font-normal text-slate-500 max-w-2xl leading-relaxed"
          style={{ animationDelay: '180ms' }}
        >
          JobMate connects your GitHub repositories, parses your verified experience via client-side multimodal AI, and matches you directly with authentic listings across Lever, Greenhouse, and Ashby.
        </p>

        {/* CTA Button Group */}
        <div 
          className="animate-entrance mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-md justify-center"
          style={{ animationDelay: '260ms' }}
        >
          <button
            type="button"
            onClick={onNavigateToLogin}
            className={`pill-bloom ${THEME.buttons.base} ${THEME.buttons.githubPill} justify-center w-full sm:w-auto px-7`}
          >
            <span>Start with Google or GitHub</span>
            <span className="text-slate-400">→</span>
          </button>
        </div>

        {/* 3 Core Architecture Pillars (Seamless, Zero Box-in-a-Box) */}
        <div 
          className="animate-entrance grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-16 sm:mt-20 w-full text-left"
          style={{ animationDelay: '340ms' }}
        >
          <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white/40 border border-slate-200/60 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-lg bg-sky-100/80 flex items-center justify-center text-sky-700 font-bold text-sm mb-1">
              01
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Direct ATS Provenance</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Filtered exclusively from verified Greenhouse, Lever, and Ashby postings. No ghost scrapers or unverified aggregators.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white/40 border border-slate-200/60 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-100/80 flex items-center justify-center text-indigo-700 font-bold text-sm mb-1">
              02
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Automated Codebase Proof</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Synthesizes real repository architectures and commit track records to prove your technical stack objectively.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white/40 border border-slate-200/60 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 flex items-center justify-center text-emerald-700 font-bold text-sm mb-1">
              03
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Zero-Retention BYOK AI</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bring your own Gemini, Groq, or OpenAI keys. Client-side encrypted execution with zero server data retention.
            </p>
          </div>
        </div>

      </main>

      {/* Delphi Ambient Bottom Atmosphere */}
      <RevolvingAtmosphere />

      {/* Shared Footer */}
      <Footer />

    </div>
  );
};
