#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("usage: node check_episode.mjs promo/src/series/episodes/E0N.tsx");
  process.exit(2);
}

const episodePath = path.resolve(file);
const seriesDir = path.resolve(path.dirname(episodePath), "..");
const promoDir = path.resolve(seriesDir, "..", "..");
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "");

const src = read(episodePath);
if (!src) {
  console.error(`не найден файл ${episodePath}`);
  process.exit(2);
}
const castSrc = read(path.join(seriesDir, "cast.ts"));
const themeSrc = read(path.join(promoDir, "src", "theme.ts"));
const canon = read(path.join(seriesDir, "CANON.md"));
const registry = read(path.join(seriesDir, "episodes", "index.ts"));

const lines = src.split("\n");
const findings = [];
const add = (level, msg, index) => {
  const line = index === undefined ? "" : `:${src.slice(0, index).split("\n").length}`;
  findings.push(`${level} ${path.relative(process.cwd(), episodePath)}${line} ${msg}`);
};

const castIds = (castSrc.match(/export type CastId = ([^;]+);/)?.[1] ?? "").match(/"(\w+)"/g)?.map((s) => s.slice(1, -1)) ?? [];
const castNames = Object.fromEntries([...castSrc.matchAll(/id: "(\w+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [m[2], m[1]]));
const consts = Object.fromEntries([...src.matchAll(/const (\w+) = "(\w+)"(?: as const)?;/g)].map((m) => [m[1], m[2]]));
const resolve = (quoted, ident) => quoted ?? consts[ident] ?? `<${ident}>`;

if (!/makeEpisode\(/.test(src)) add("ERROR", "серия не собрана через makeEpisode: пропадут общий титр, анонс и музыка");
for (const field of ["title", "explainer", "next", "cta"]) if (!new RegExp(`\\b${field}:`).test(src)) add("ERROR", `в makeEpisode нет поля ${field}`);
if (!/chatBeat\(/.test(src)) add("WARN", "нет chatBeat: серия должна открываться групповым чатом");
if (!/timedRules\(/.test(src)) add("WARN", "нет timedRules: правила идут без секундомера");

for (const m of src.matchAll(/TODO/g)) add("ERROR", "остался TODO из шаблона", m.index);
for (const m of src.matchAll(/[—–]/g)) add("ERROR", "длинное тире запрещено правилами humanizer-ru", m.index);
const banned = ["не просто", "является", "являются", "данный", "данная", "данное", "стоит отметить", "комплексн", "в рамках"];
for (const word of banned) for (const m of src.matchAll(new RegExp(word, "gi"))) add("WARN", `канцелярит «${word}»`, m.index);

for (const m of src.matchAll(/text:\s*"([^"]*)"/g)) if (m[1].length > 70) add("WARN", `субтитр ${m[1].length} знаков, лучше до 70: «${m[1].slice(0, 40)}…»`, m.index);
for (const m of src.matchAll(/chip:\s*"([^"]*)"/g)) {
  if (/\s/.test(m[1].trim())) add("WARN", `подсказка «${m[1]}» должна быть одним словом`, m.index);
  if (m[1] !== m[1].toUpperCase()) add("WARN", `подсказка «${m[1]}» пишется заглавными`, m.index);
}

const used = [];
for (const m of src.matchAll(/\b(who|on|a|b|explainer):\s*(?:"(\w+)"|([A-Z_]+)\b)/g)) used.push([resolve(m[2], m[3]), m.index]);
for (const m of src.matchAll(/\b(who|owner|impostor|accused)="(\w+)"/g)) used.push([m[2], m.index]);
for (const m of src.matchAll(/\b(emo|pose|look|props):\s*\{([^}]*)\}/g)) {
  for (const k of m[2].matchAll(/(?:\[(\w+)\]|(\w+))\s*:/g)) used.push([k[2] ?? consts[k[1]] ?? `<${k[1]}>`, m.index]);
  if (m[1] === "look") for (const v of m[2].matchAll(/:\s*"(\w+)"/g)) if (v[1] !== "cam") used.push([v[1], m.index]);
}
for (const m of src.matchAll(/\b(present|arrive):\s*\[([^\]]*)\]/g)) for (const v of m[2].matchAll(/"(\w+)"/g)) used.push([v[1], m.index]);
for (const [id, index] of used) if (castIds.length && !castIds.includes(id)) add("ERROR", `неизвестный герой «${id}», есть только ${castIds.join(", ")}`, index);

const palette = new Set([...(themeSrc + castSrc).matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase()));
["#fffdf4", "#1a1030", "#ffffff", "#000000", "#000", "#fff"].forEach((c) => palette.add(c));
for (const m of src.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) if (!palette.has(m[0].toLowerCase())) add("WARN", `цвет ${m[0]} не из палитры theme.ts и cast.ts`, m.index);

const explainer = resolve(src.match(/explainer:\s*(?:"(\w+)"|([A-Z_]+)\b)/)?.[1], src.match(/explainer:\s*(?:"(\w+)"|([A-Z_]+)\b)/)?.[2]);
const voice = new Set();
lines.forEach((line, i) => {
  if (!/screen:/.test(line)) return;
  const m = line.match(/who:\s*(?:"(\w+)"|([A-Z_]+)\b)/);
  if (m) voice.add(resolve(m[1], m[2]));
  else if (i > 0) {
    const prev = lines.slice(Math.max(0, i - 3), i).join(" ").match(/who:\s*(?:"(\w+)"|([A-Z_]+)\b)/);
    if (prev && !/\}/.test(lines.slice(Math.max(0, i - 3), i).join(" ").split(/who:/).pop())) voice.add(resolve(prev[1], prev[2]));
  }
});
if (voice.size > 1) add("WARN", `правила за кадром читают несколько героев (${[...voice].join(", ")}), по канону объясняет один`);
if (explainer && voice.size && !voice.has(explainer)) add("WARN", `explainer «${explainer}», а за кадром говорит ${[...voice].join(", ")}`);

const timer = src.match(/timedRules\([^,]+,\s*(?:"(\w+)"|([A-Z_]+))\s*\)/);
if (timer && resolve(timer[1], timer[2]) === explainer) add("WARN", "секундомер держит сам объясняющий, по канону время засекает другой герой");

const epNum = Number(src.match(/episode:\s*(\d+)/)?.[1]);
const rotation = [...canon.matchAll(/^\|\s*E(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm)].map((m) => ({ ep: Number(m[1]), who: castNames[m[2]] ?? m[2], game: m[3], status: m[4] }));
const row = rotation.find((r) => r.ep === epNum);
if (!canon) add("WARN", "не найден CANON.md рядом с сериалом");
else if (!row) add("WARN", `в ротации канона нет строки E${String(epNum).padStart(2, "0")}, добавь её`);
else if (row.who !== explainer) add(row.status.includes("обещана") ? "ERROR" : "WARN", `по канону E${String(epNum).padStart(2, "0")} объясняет ${row.who} (${row.status}), а в серии ${explainer}. Если так решил пользователь, обнови канон`);
const nextWho = resolve(src.match(/next:\s*\{\s*who:\s*(?:"(\w+)"|([A-Z_]+))/)?.[1], src.match(/next:\s*\{\s*who:\s*(?:"(\w+)"|([A-Z_]+))/)?.[2]);
const nextRow = rotation.find((r) => r.ep === epNum + 1);
if (nextRow && nextWho && nextRow.who !== nextWho) add("INFO", `анонс обещает ${nextWho}, в ротации следующей серии стоит ${nextRow.who}. После рендера обнови канон`);
if (explainer && rotation.some((r) => r.ep === epNum - 1 && r.who === explainer)) add("WARN", "тот же объясняющий, что в прошлой серии");

const base = path.basename(episodePath, ".tsx");
if (!new RegExp(`from "\\./${base}"`).test(registry)) add("WARN", `серия не добавлена в episodes/index.ts`);

const order = { ERROR: 0, WARN: 1, INFO: 2 };
findings.sort((a, b) => order[a.split(" ")[0]] - order[b.split(" ")[0]]);
findings.forEach((f) => console.log(f));
const errors = findings.filter((f) => f.startsWith("ERROR")).length;
const warns = findings.filter((f) => f.startsWith("WARN")).length;
console.log(`\n${errors} ошибок, ${warns} предупреждений`);
process.exit(errors ? 1 : 0);
