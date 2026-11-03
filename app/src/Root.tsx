import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/short1/Bridge";

// Etapa 1: composição de teste com os valores do template. A Etapa 4 troca BRIDGE_FRAMES pelo TOTAL da nova história.
export const Root: React.FC = () => (
  <Composition id="Short1" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
);
