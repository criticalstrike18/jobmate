import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const enter = (frame: number, delay = 0) => {
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(frame, [delay, delay + 15], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return { opacity, transform: `translateY(${y}px)` };
};

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#fafcff',
      fontFamily: 'Inter, Plus Jakarta Sans, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      color: '#0f172a',
    }}
  >
    {/* ambient glow, matches HomeScreen */}
    <div
      style={{
        position: 'absolute',
        bottom: -180,
        left: '17.5%',
        right: '17.5%',
        height: 360,
        background:
          'radial-gradient(ellipse 65% 55% at 50% 100%, rgba(56,189,248,0.24), rgba(14,165,233,0.10) 50%, transparent 75%)',
      }}
    />
    {children}
  </div>
);

export const TopBar: React.FC = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '28px 56px 0 56px',
      zIndex: 2,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ fontSize: 20, fontWeight: 600, color: '#0f172a' }}>jobmate.io</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#64748b',
          background: 'rgba(248,250,252,0.8)',
          border: '1px solid #f1f5f9',
          borderRadius: 999,
          padding: '5px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: 999, background: '#10b981' }} />
        Verified ATS Network
      </span>
    </div>
    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, letterSpacing: 1 }}>
      WHAT IS JOBMATE? — 30 SEC
    </span>
  </div>
);

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = Math.min(1, frame / 900);
  return (
    <div style={{ padding: '0 56px 32px 56px', zIndex: 2 }}>
      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: '#0ea5e9', borderRadius: 999 }} />
      </div>
    </div>
  );
};

export const Pill: React.FC<{ children: React.ReactNode; tone?: 'sky' | 'slate' }> = ({
  children,
  tone = 'sky',
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 15,
      fontWeight: 600,
      padding: '8px 18px',
      borderRadius: 999,
      background: tone === 'sky' ? '#f0f9ff' : '#f8fafc',
      border: tone === 'sky' ? '1px solid #bae6fd' : '1px solid #e2e8f0',
      color: tone === 'sky' ? '#075985' : '#475569',
    }}
  >
    {children}
  </span>
);
