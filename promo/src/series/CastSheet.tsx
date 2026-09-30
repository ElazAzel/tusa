import React from "react";
import { AbsoluteFill } from "remotion";
import { Character, type Emotion, type Pose } from "./Character";
import { CAST, CAST_ORDER } from "./cast";

const looks: { emotion: Emotion; pose: Pose }[] = [
  { emotion: "happy", pose: "wave" },
  { emotion: "smug", pose: "hips" },
  { emotion: "dreamy", pose: "hold" },
  { emotion: "panic", pose: "shrug" },
  { emotion: "smug", pose: "glasses" },
];

export const CastSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#1a1030", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignContent: "center", gap: 20, padding: 40 }}>
    <div style={{ width: "100%", textAlign: "center", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 84, color: "#f2f3f8", marginBottom: 40 }}>
      Знакомьтесь:
      <br />
      <span style={{ color: "#c9ff05" }}>тусовка TUSA</span>
    </div>
    {CAST_ORDER.map((id, i) => (
      <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 320 }}>
        <Character id={id} emotion={looks[i].emotion} pose={looks[i].pose} prop={id === "erlan" ? "coals" : null} width={320} />
        <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 44, color: CAST[id].tag, marginTop: -10 }}>{CAST[id].name}</div>
      </div>
    ))}
  </AbsoluteFill>
);
