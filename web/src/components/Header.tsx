import React from 'react';
import { THEME } from '../constants/theme';

interface HeaderProps {
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className={THEME.layout.headerContainer}>
      <button 
        type="button"
        onClick={onLogoClick}
        className="text-xs sm:text-[13px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0"
      >
        <span>jobmate.io</span>
      </button>
      
      <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-neutral-50/80 border border-neutral-100 ${THEME.typography.badge}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Verified ATS Network</span>
      </div>
    </header>
  );
};
