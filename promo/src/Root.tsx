import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { Sales, SALES_DURATION } from "./Sales";
import { Features, FEATURES_DURATION } from "./Features";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TusaSales" component={Sales} durationInFrames={SALES_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="TusaFeatures" component={Features} durationInFrames={FEATURES_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
