import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { Sales, SALES_DURATION } from "./Sales";
import { Features, FEATURES_DURATION } from "./Features";
import { CastSheet } from "./series/CastSheet";
import { EPISODES } from "./series/episodes";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TusaSales" component={Sales} durationInFrames={SALES_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="TusaFeatures" component={Features} durationInFrames={FEATURES_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    {EPISODES.map((e) => (
      <Composition key={e.id} id={e.id} component={e.Component} durationInFrames={e.duration} fps={FPS} width={WIDTH} height={HEIGHT} />
    ))}
    <Composition id="TusaCastSheet" component={CastSheet} durationInFrames={90} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
