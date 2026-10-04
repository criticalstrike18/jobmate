/**
 * Standardized Theme Tokens for JobMate Authentication Flow
 * Aligned precisely with the Delphi Mobbin reference & Stitch Design System "Luminous Clarity"
 */

export const THEME = {
  // Canvas Colors
  canvasBg: 'bg-[#fafcff]',
  canvasText: 'text-slate-900',

  // Typography Classes
  typography: {
    fontSans: 'font-sans',
    heading: 'text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900',
    subtitle: 'text-[15px] sm:text-[17px] font-normal text-slate-500 tracking-normal',
    pillLabel: 'text-[14px] sm:text-[15px] font-medium tracking-tight',
    pillLabelSmall: 'text-[13px] font-medium tracking-tight',
    badge: 'text-[11px] sm:text-[12px] font-medium text-neutral-500',
    caption: 'text-center text-[12px] text-slate-400 font-normal leading-relaxed',
    scopeName: 'text-[12px] font-mono font-medium text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-md',
    scopeDesc: 'text-[12px] text-slate-500 font-normal',
    footerLink: 'hover:text-slate-600 transition-colors',
    returnLink: 'inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer',
  },

  // Sizing & Spacing Tokens
  layout: {
    pageContainer: 'min-h-[100dvh] flex flex-col justify-between selection:bg-sky-100 selection:text-sky-900 relative overflow-x-hidden font-sans',
    centerContainer: 'w-full max-w-[380px] mx-auto flex flex-col items-center text-center',
    headerContainer: 'w-full max-w-7xl mx-auto px-5 sm:px-8 pt-5 sm:pt-6 flex items-center justify-between z-10',
    mainContainer: 'relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 w-full',
    footerContainer: 'flex flex-col sm:flex-row justify-between items-center w-full px-5 sm:px-8 py-4 sm:py-5 max-w-7xl mx-auto gap-2.5 sm:gap-4 text-xs text-slate-400 text-center sm:text-left',
  },

  // Standard 50px Pill Buttons
  buttons: {
    base: 'w-full h-[48px] sm:h-[50px] px-5 sm:px-6 rounded-full shadow-sm flex items-center justify-center gap-3 text-[14px] sm:text-[15px] font-medium transition-all cursor-pointer disabled:opacity-60',
    lightPill: 'border border-slate-200/90 bg-white/90 text-slate-800 hover:bg-white hover:border-sky-300 hover:-translate-y-[1.5px] hover:scale-[1.01] active:scale-[0.985] active:translate-y-0',
    githubPill: 'border border-transparent bg-[#18181b] text-white hover:bg-black hover:-translate-y-[1.5px] hover:scale-[1.01] active:scale-[0.985] active:translate-y-0',
    gitlabPill: 'border border-transparent bg-[#1f75cb] text-white hover:bg-[#1068bf] hover:-translate-y-[1.5px] hover:scale-[1.01] active:scale-[0.985] active:translate-y-0',
  },
} as const;
