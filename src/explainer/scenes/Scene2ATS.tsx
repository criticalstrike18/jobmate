import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { Shell, TopBar, ProgressBar, enter } from '../components/Shared';

const BOARDS = [
  { name: 'Greenhouse', color: '#059669', bg: '#ecfdf5' },
  { name: 'Lever', color: '#0284c7', bg: '#f0f9ff' },
  { name: 'Ashby', color: '#4f46e5', bg: '#eef2ff' },
];

// Scene 2 (6-12s): Direct ATS provenance
export const Scene2ATS: React.FC = () => {
  const f = useCurrentFrame();
  const strike = interpolate(f, [70, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Shell>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', padding: '20px 80px', gap: 48, alignItems: 'center', zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...enter(f, 0), fontSize: 15, fontWeight: 700, color: '#0ea5e9', letterSpacing: 2 }}>
            01 — DIRECT ATS PROVENANCE
          </div>
          <h2 style={{ ...enter(f, 10), fontSize: 52, fontWeight: 800, letterSpacing: -1.5, margin: '12px 0' }}>
            Real jobs.
            <br />
            No ghost listings.
          </h2>
          <p style={{ ...enter(f, 22), fontSize: 20, color: '#64748b', maxWidth: 480 }}>
            Only verified postings pulled straight from company boards. No scrapers, no aggregator spam.
          </p>
          <div style={{ ...enter(f, 36), marginTop: 24, fontSize: 18, color: '#94a3b8', textDecoration: 'line-through', position: 'relative', display: 'inline-block' }}>
            <span style={{ position: 'absolute', left: 0, top: '50%', height: 3, background: '#f43f5e', width: `${strike * 100}%` }} />
            LinkedIn / Indeed scrapes ✕
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {BOARDS.map((b, i) => (
            <div
              key={b.name}
              style={{
                ...enter(f, 20 + i * 14),
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 20,
                padding: '22px 28px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 8px 30px rgba(2,132,199,0.08)',
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: b.color, fontSize: 22 }}>
                {b.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{b.name}</div>
                <div style={{ fontSize: 15, color: '#10b981', fontWeight: 600 }}>● Verified live board</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ProgressBar />
    </Shell>
  );
};
