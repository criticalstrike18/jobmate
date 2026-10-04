import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Pill, Shell, TopBar, ProgressBar, enter } from '../components/Shared';

// Scene 1 (0-6s): Hook — same hero copy as HomeScreen
export const Scene1Hook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Shell>
      <TopBar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 120px',
          zIndex: 1,
        }}
      >
        <div style={enter(f, 0)}>
          <Pill>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#0ea5e9' }} />
            Multimodal AI &amp; Verified Job Discovery
          </Pill>
        </div>
        <h1
          style={{
            ...enter(f, 12),
            fontSize: 64,
            lineHeight: 1.08,
            fontWeight: 800,
            letterSpacing: -2,
            margin: '28px 0 0 0',
            maxWidth: 900,
          }}
        >
          Built for{' '}
          <span
            style={{
              background: 'linear-gradient(90deg,#0284c7,#4f46e5)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Proof
          </span>
          , Not Keywords.
        </h1>
        <p style={{ ...enter(f, 26), fontSize: 22, color: '#64748b', maxWidth: 720, marginTop: 20 }}>
          JobMate proves what you can build — then matches you to real jobs.
        </p>
        <div style={{ ...enter(f, 40), display: 'flex', gap: 12, marginTop: 32 }}>
          <div
            style={{
              background: '#18181b',
              color: '#fff',
              borderRadius: 999,
              padding: '14px 32px',
              fontSize: 17,
              fontWeight: 600,
            }}
          >
            Start with Google or GitHub →
          </div>
        </div>
      </div>
      <ProgressBar />
    </Shell>
  );
};
