import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { ExplainerVideo } from '../explainer/ExplainerVideo';
import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from '../explainer/config';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="JobMateExplainer"
      component={ExplainerVideo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

registerRoot(RemotionRoot);
