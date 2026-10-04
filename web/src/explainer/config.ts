export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;

// 5 scenes x 6s = 30s total. Clean explainer length.
export const SCENE_FRAMES = 180;
export const DURATION_IN_FRAMES = SCENE_FRAMES * 5; // 900

export const SCENES = [
  { id: 'hook', label: 'Hook', start: 0 },
  { id: 'ats', label: 'Verified ATS', start: SCENE_FRAMES },
  { id: 'pipeline', label: 'How it works', start: SCENE_FRAMES * 2 },
  { id: 'trust', label: 'Trust + BYOK', start: SCENE_FRAMES * 3 },
  { id: 'cta', label: 'CTA', start: SCENE_FRAMES * 4 },
] as const;
