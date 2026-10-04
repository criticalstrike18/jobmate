import React from 'react';
import { Player } from '@remotion/player';
import { ExplainerVideo } from './ExplainerVideo';
import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from './config';

export const ExplainerPreview: React.FC = () => {
  return (
    <div className="min-h-[100dvh] bg-[#fafcff] flex flex-col items-center px-4 py-8 font-sans">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-bold tracking-widest text-sky-600">JOBMATE EXPLAINER — 30 SEC</div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Preview &amp; Export</h1>
            <p className="text-sm text-slate-500 mt-1">
              Play below. To get an MP4 for free, run{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[13px]">npm run video:render</code> in{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[13px]">/web</code>.
            </p>
          </div>
          <a href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            ← Back home
          </a>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-black">
          <Player
            component={ExplainerVideo}
            durationInFrames={DURATION_IN_FRAMES}
            compositionWidth={WIDTH}
            compositionHeight={HEIGHT}
            fps={FPS}
            controls
            autoPlay
            loop
            style={{ width: '100%', aspectRatio: '16/9' }}
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-6 text-left">
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <div className="text-sm font-bold">1. Free MP4 (best)</div>
            <div className="text-xs text-slate-500 mt-1 leading-relaxed">
              <code className="bg-slate-100 px-1 rounded">npm run video:render</code> → <code className="bg-slate-100 px-1 rounded">out/jobmate-explainer.mp4</code>. No watermark, no cost.
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <div className="text-sm font-bold">2. No-install record</div>
            <div className="text-xs text-slate-500 mt-1 leading-relaxed">
              Fullscreen this page, record with OBS / Clipchamp (Win+G) → trim to 30s.
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <div className="text-sm font-bold">3. Edit script</div>
            <div className="text-xs text-slate-500 mt-1 leading-relaxed">
              Copy lives in <code className="bg-slate-100 px-1 rounded">src/explainer/scenes/</code>. Same Tailwind look as your site.
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-sky-50 border border-sky-200/70 text-xs text-sky-900 leading-relaxed">
          Storyboard: 0–6s Hook (Proof not Keywords) → 6–12s Verified ATS → 12–18s Pipeline → 18–24s BYOK Trust → 24–30s CTA. 1280×720 @30fps.
        </div>
      </div>
    </div>
  );
};
