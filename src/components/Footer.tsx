import React from 'react';
import { THEME } from '../constants/theme';

export const Footer: React.FC = () => {
  return (
    <footer className="animate-entrance w-full relative z-10 bg-transparent" style={{ animationDelay: '550ms' }}>
      <div className={THEME.layout.footerContainer}>
        <span>© {new Date().getFullYear()} JobMate Inc. All rights reserved.</span>
        <div className="flex items-center gap-5 sm:gap-6">
          <a className={THEME.typography.footerLink} href="#privacy">Privacy Policy</a>
          <a className={THEME.typography.footerLink} href="#terms">Terms of Service</a>
          <a className={THEME.typography.footerLink} href="#security">Security</a>
        </div>
      </div>
    </footer>
  );
};
