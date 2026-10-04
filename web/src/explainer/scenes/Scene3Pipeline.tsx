import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { Shell, TopBar, ProgressBar, enter } from '../components/Shared';

const STEPS = ['GitHub + Resume', 'Profile', 'ATS Match', 'Ranked list'];

// Scene 3 (12-18s): How it works pipeline
export const Scene3Pipeline: React.FC = () => {
  const f = useCurrentFrame();
  const dotX = interpolate(f, [30, 150], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Shell>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: '0 80px' }}>
        <div style={{ ...enter(f, 0), fontSize: 15, fontWeight: 700, color: '#4f46e5', letterSpacing: 2 }}>
          02 — HOW IT WORKS
        </div>
        <h2 style={{ ...enter(f, 8), fontSize: 50, fontWeight: 800, letterSpacing: -1.5, margin: '10px 0 32px 0' }}>
          Proof → Match → Apply
        </h2>
        <div style={{ width: '100%', maxWidth: 980, position: 'relative' }}>
          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999 }} />
          <div style={{ height: 6, background: '#0ea5e9', borderRadius: 999, width: `${dotX}%`, position: 'absolute', top: 0, left: 0 }} />
          <div style={{ position: 'absolute', top: -8, left: `${dotX}%`, width: 22, height: 22, borderRadius: 999, background: '#0ea5e9', border: '4px solid #fff', boxShadow: '0 2px 12px rgba(14,165,233,0.5)', marginLeft: -11 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            {STEPS.map((s, i) => {
              const active = dotX >= (i / (STEPS.length - 1)) * 100 - 5;
              return (
                <div key={s} style={{ ...enter(f, 15 + i * 12), background: active ? '#0f172a' : '#fff', color: active ? '#fff' : '#0f172a', border: '1px solid #e2e8f0', borderRadius: 999, padding: '12px 24px', fontSize: 17, fontWeight: 700 }}>
                  {i + 1}. {s}
                </div>
              );
            })}
          </div>
        </div>
        <p style={{ ...enter(f, 60), fontSize: 19, color: '#64748b', marginTop: 28 }}>
          Connect repos → AI builds your verified profile → Stage 1–3 ranks only real fits.
        </p>
      </div>
      <ProgressBar />
    </Shell>
  );
};
