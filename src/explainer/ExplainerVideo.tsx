import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { SCENE_FRAMES } from './config';
import { Scene1Hook } from './scenes/Scene1Hook';
import { Scene2ATS } from './scenes/Scene2ATS';
import { Scene3Pipeline } from './scenes/Scene3Pipeline';
import { Scene4Trust } from './scenes/Scene4Trust';
import { Scene5CTA } from './scenes/Scene5CTA';

export const ExplainerVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#fafcff' }}>
      <Sequence from={0} durationInFrames={SCENE_FRAMES}>
        <Scene1Hook />
      </Sequence>
      <Sequence from={SCENE_FRAMES} durationInFrames={SCENE_FRAMES}>
        <Scene2ATS />
      </Sequence>
      <Sequence from={SCENE_FRAMES * 2} durationInFrames={SCENE_FRAMES}>
        <Scene3Pipeline />
      </Sequence>
      <Sequence from={SCENE_FRAMES * 3} durationInFrames={SCENE_FRAMES}>
        <Scene4Trust />
      </Sequence>
      <Sequence from={SCENE_FRAMES * 4} durationInFrames={SCENE_FRAMES}>
        <Scene5CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
