import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { Shell, TopBar, enter } from '../components/Shared';

// Scene 5 (24-30s): CTA
export const Scene5CTA: React.FC = () => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [20, 50], [0.9, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Shell>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', zIndex: 1 }}>
        <h2 style={{ ...enter(f, 0), fontSize: 56, fontWeight: 800, letterSpacing: -2, margin: 0 }}>
          Stop applying blind.
        </h2>
        <p style={{ ...enter(f, 12), fontSize: 22, color: '#64748b', marginTop: 12 }}>
          Get matched on proof in under 2 minutes.
        </p>
        <div style={{ ...enter(f, 24), transform: `scale(${scale})`, marginTop: 32, background: '#18181b', color: '#fff', borderRadius: 999, padding: '18px 48px', fontSize: 20, fontWeight: 700, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
          Try JobMate free →
        </div>
        <div style={{ ...enter(f, 38), marginTop: 20, fontSize: 18, color: '#94a3b8', fontWeight: 600 }}>
          jobmate.io — Proof, Not Keywords.
        </div>
      </div>
      <div style={{ padding: '0 56px 32px 56px', zIndex: 2 }}>
        <div style={{ height: 4, background: '#0ea5e9', borderRadius: 999 }} />
      </div>
    </Shell>
  );
};
