import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const usage = "usage: node scripts/qa-stills.mjs <CompositionId> [--every 150 | frame frame ...]";
const [id, ...rest] = process.argv.slice(2);
if (!id) {
  console.error(usage);
  process.exit(1);
}

const browserExecutable = process.env.REMOTION_BROWSER || ["/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"].find((p) => fs.existsSync(p)) || null;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id, browserExecutable });

let frames = rest.filter((a) => /^\d+$/.test(a)).map(Number);
const everyIdx = rest.indexOf("--every");
if (everyIdx >= 0 || frames.length === 0) {
  const step = everyIdx >= 0 ? Number(rest[everyIdx + 1]) : 150;
  frames = [];
  for (let f = 30; f < composition.durationInFrames; f += step) frames.push(f);
}

const outDir = path.resolve("out/qa", id);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const files = [];
for (const f of frames) {
  const file = path.join(outDir, `${String(f).padStart(5, "0")}.jpg`);
  await renderStill({ serveUrl, composition, frame: f, output: file, imageFormat: "jpeg", jpegQuality: 70, scale: 0.4, browserExecutable });
  files.push(file);
}

if (!browserExecutable) {
  console.log(`stills in ${outDir}; set REMOTION_BROWSER to also build contact sheets`);
  process.exit(0);
}

const perSheet = 8;
for (let s = 0; s * perSheet < files.length; s++) {
  const chunk = files.slice(s * perSheet, (s + 1) * perSheet);
  const rows = Math.ceil(chunk.length / 4);
  const html = path.join(outDir, `sheet-${s + 1}.html`);
  const cells = chunk
    .map((f) => `<div style="position:relative"><img src="file://${f}" style="width:432px;height:768px;display:block"><span style="position:absolute;top:4px;left:6px;color:#0f0;font:bold 22px monospace;background:#000">${path.basename(f, ".jpg")}</span></div>`)
    .join("");
  fs.writeFileSync(html, `<html><body style="margin:0;background:#000;display:flex;flex-wrap:wrap;width:1728px">${cells}</body></html>`);
  const png = path.join(outDir, `sheet-${s + 1}.png`);
  execFileSync(browserExecutable, ["--no-sandbox", "--hide-scrollbars", "--allow-file-access-from-files", `--screenshot=${png}`, `--window-size=1728,${rows * 768}`, `file://${html}`], { stdio: "ignore" });
  fs.rmSync(html);
  console.log(png);
}
