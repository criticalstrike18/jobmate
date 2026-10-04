import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Shell, TopBar, ProgressBar, enter } from '../components/Shared';

// Scene 4 (18-24s): Code proof + BYOK zero-retention
export const Scene4Trust: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Shell>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', padding: '20px 80px', gap: 40, alignItems: 'center', zIndex: 1 }}>
        <div style={{ flex: 1.1, background: '#0f172a', color: '#e2e8f0', borderRadius: 24, padding: 32, fontFamily: 'ui-monospace, monospace', ...enter(f, 10) }}>
          <div style={{ fontSize: 13, color: '#7dd3fc', marginBottom: 12 }}>● AUTOMATED CODEBASE PROOF</div>
          <div style={{ fontSize: 17, lineHeight: 1.7 }}>
            <div><span style={{ color: '#7dd3fc' }}>repos:</span> 24 analyzed ✓</div>
            <div><span style={{ color: '#7dd3fc' }}>stack:</span> React · Node · Postgres</div>
            <div><span style={{ color: '#7dd3fc' }}>commits:</span> 1,204 verified ✓</div>
            <div style={{ marginTop: 12, background: 'rgba(16,185,129,0.15)', borderRadius: 12, padding: '10px 14px', color: '#6ee7b7' }}>
              match: 94 — Senior Frontend @ Acme
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...enter(f, 0), fontSize: 15, fontWeight: 700, color: '#059669', letterSpacing: 2 }}>
            03 — ZERO-RETENTION BYOK AI
          </div>
          <h2 style={{ ...enter(f, 8), fontSize: 46, fontWeight: 800, letterSpacing: -1.2, margin: '10px 0' }}>
            Your keys.
            <br />
            Your data stays yours.
          </h2>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            {['Gemini', 'Groq', 'OpenAI'].map((k, i) => (
              <div key={k} style={{ ...enter(f, 25 + i * 12), background: '#fff', border: '1px solid #e2e8f0', borderRadius: 999, padding: '10px 20px', fontSize: 16, fontWeight: 700 }}>
                🔑 {k}
              </div>
            ))}
          </div>
          <p style={{ ...enter(f, 60), fontSize: 18, color: '#64748b', marginTop: 16 }}>
            Client-side encrypted. Zero server retention. No training on your resume.
          </p>
        </div>
      </div>
      <ProgressBar />
    </Shell>
  );
};
