import React from 'react';
import { THEME } from '../constants/theme';
import type { AuthUser } from '../types/auth';

interface AuthenticatedScreenProps {
  user: AuthUser;
  onLogout: () => void;
}

export const AuthenticatedScreen: React.FC<AuthenticatedScreenProps> = ({ user, onLogout }) => {
  return (
    <div className={THEME.layout.centerContainer}>
      
      {/* User Avatar with Glowing Status Ring */}
      <div 
        className="animate-entrance relative cursor-default"
        style={{ animationDelay: '0ms' }}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-tr from-sky-400 to-indigo-500 shadow-md">
          <div className="w-full h-full rounded-full overflow-hidden bg-white">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sky-50 text-sky-700 font-bold text-xl sm:text-2xl">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200" />
      </div>

      {/* Greeting Title & Subtitle */}
      <h1 
        className={`animate-entrance mt-5 sm:mt-6 ${THEME.typography.heading}`}
        style={{ animationDelay: '80ms' }}
      >
        Welcome back, {user.displayName?.split(' ')[0] || 'User'}
      </h1>
      <p 
        className={`animate-entrance mt-1.5 sm:mt-2 ${THEME.typography.subtitle}`}
        style={{ animationDelay: '140ms' }}
      >
        {user.email}
      </p>

      {/* Provider Pill Status */}
      <div 
        className="animate-entrance mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50/80 border border-sky-200/60 text-xs font-medium text-sky-800"
        style={{ animationDelay: '200ms' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
        <span>Connected via {user.providerId.replace('.com', '')}</span>
      </div>

      {/* Sign Out Pill Action */}
      <div 
        className="animate-entrance w-full mt-7 sm:mt-8 flex flex-col gap-3"
        style={{ animationDelay: '280ms' }}
      >
        <button
          type="button"
          onClick={onLogout}
          className={`pill-bloom ${THEME.buttons.base} ${THEME.buttons.lightPill}`}
        >
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
};
