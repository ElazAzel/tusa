import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { Sales, SALES_DURATION } from "./Sales";
import { Features, FEATURES_DURATION } from "./Features";
import { CastSheet } from "./series/CastSheet";
import { Episode01, E01_DURATION } from "./series/episodes/E01";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TusaSales" component={Sales} durationInFrames={SALES_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="TusaFeatures" component={Features} durationInFrames={FEATURES_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="TusaS01E01" component={Episode01} durationInFrames={E01_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="TusaCastSheet" component={CastSheet} durationInFrames={90} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
