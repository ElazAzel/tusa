import { loadFont } from "@remotion/fonts";
import iconFontUrl from "material-symbols/material-symbols-rounded.woff2";
import unboundedLatin from "@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2";
import unboundedCyrillic from "@fontsource-variable/unbounded/files/unbounded-cyrillic-wght-normal.woff2";
import interLatin from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2";
import interCyrillic from "@fontsource-variable/inter/files/inter-cyrillic-wght-normal.woff2";

const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const CYRILLIC = "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116";

loadFont({ family: "Unbounded", url: unboundedLatin, weight: "200 900", unicodeRange: LATIN });
loadFont({ family: "Unbounded", url: unboundedCyrillic, weight: "200 900", unicodeRange: CYRILLIC });
loadFont({ family: "Inter", url: interLatin, weight: "100 900", unicodeRange: LATIN });
loadFont({ family: "Inter", url: interCyrillic, weight: "100 900", unicodeRange: CYRILLIC });
loadFont({ family: "Material Symbols Rounded", url: iconFontUrl, weight: "100 700" });

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const font = {
  display: "Unbounded, sans-serif",
  body: "Inter, sans-serif",
  icon: "Material Symbols Rounded",
};

export const color = {
  ink: "#121218",
  bg: "#0f1016",
  bgDeep: "#0b0c11",
  panel: "#161823",
  panel2: "#1c1f2c",
  dark: "#262a38",
  white: "#ffffff",
  cream: "#f6f6ee",
  lime: "#c9ff05",
  limeDeep: "#93bd00",
  blue: "#2d00f7",
  blueBright: "#6a45ff",
  pink: "#ff007f",
  pinkBright: "#ff4d9f",
  red: "#ff5470",
  ok: "#3ecf8e",
  warn: "#ffc247",
  info: "#57c2ff",
  fg: "#f2f3f8",
  muted: "#b3b7c9",
  gray: "#8b90a2",
};

export type Tone = "lime" | "pink" | "blue" | "cream";

export const tone: Record<Tone, { bg: string; fg: string }> = {
  lime: { bg: color.lime, fg: color.ink },
  pink: { bg: color.pink, fg: color.white },
  blue: { bg: color.blueBright, fg: color.white },
  cream: { bg: color.cream, fg: color.ink },
};
