import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");
fs.mkdirSync(OUT, { recursive: true });

let seed = 20260930;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const range = (a, b) => a + rand() * (b - a);

function writeWav(name, data, peak = 0.85) {
  let max = 0;
  for (const v of data) max = Math.max(max, Math.abs(v));
  const gain = max > 0 ? peak / max : 1;
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + data.length * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(data[i] * gain * 32767))), 44 + i * 2);
  fs.writeFileSync(path.join(OUT, `${name}.wav`), buf);
}

function bandpass(freq, q) {
  const w = (2 * Math.PI * freq) / SR;
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  const b0 = alpha / a0;
  const b2 = -alpha / a0;
  const a1 = (-2 * Math.cos(w)) / a0;
  const a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

function lowpass(cutoff) {
  const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
  let y = 0;
  return (x) => (y += a * (x - y));
}

const secs = (s) => Math.round(s * SR);
const buffer = (s) => new Float32Array(secs(s));
const add = (dst, src, at, gain = 1) => {
  const o = secs(at);
  for (let i = 0; i < src.length; i++) dst[(o + i) % dst.length] += src[i] * gain;
};

const VOWELS = [
  [800, 1200],
  [500, 900],
  [450, 1900],
  [320, 2300],
  [360, 800],
  [650, 1600],
];

function syllable(f0, dur) {
  const out = new Float32Array(secs(dur));
  const [f1, f2] = VOWELS[Math.floor(rand() * VOWELS.length)];
  const bp1 = bandpass(f1, 4);
  const bp2 = bandpass(f2, 6);
  const glide = range(-0.25, 0.2);
  const consonant = rand() < 0.6 ? secs(range(0.008, 0.02)) : 0;
  const noiseBp = bandpass(range(2500, 5000), 1.5);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / out.length;
    const f = f0 * (1 + glide * t) * (1 + 0.02 * Math.sin(2 * Math.PI * 6 * (i / SR)));
    phase += f / SR;
    let src = 0;
    for (let k = 1; k <= 10; k++) src += Math.sin(2 * Math.PI * k * phase) / k;
    const voiced = bp1(src) * 1.4 + bp2(src) * 0.9 + src * 0.05;
    const env = Math.min(1, i / secs(0.012)) * Math.min(1, (out.length - i) / secs(0.03));
    const noise = i < consonant ? noiseBp(rand() * 2 - 1) * 1.2 : 0;
    out[i] = voiced * env * (i < consonant ? 0.2 : 1) + noise;
  }
  return out;
}

function babble(f0, length) {
  const out = buffer(length);
  let t = 0.05;
  let count = 0;
  while (t < length - 0.3) {
    const dur = range(0.07, 0.15);
    add(out, syllable(f0 * range(0.88, 1.22), dur), t);
    t += dur + range(0.012, 0.045);
    count++;
    if (count % Math.floor(range(4, 8)) === 0) t += range(0.1, 0.22);
  }
  return out;
}

const voices = { amir: 190, dana: 300, erlan: 135, aliya: 350, timur: 230 };
for (const [id, f0] of Object.entries(voices)) writeWav(`voice-${id}`, babble(f0, 12), 0.8);

{
  const len = 12;
  const out = buffer(len);
  for (let v = 0; v < 12; v++) add(out, babble(range(110, 320), len), 0, range(0.3, 0.8));
  const lp = lowpass(1400);
  for (let i = 0; i < out.length; i++) out[i] = lp(out[i]);
  for (let c = 0; c < 7; c++) {
    const at = range(0.3, len - 0.5);
    const clink = buffer(0.5);
    const base = range(2200, 3200);
    for (let i = 0; i < clink.length; i++) {
      const tt = i / SR;
      clink[i] = (Math.sin(2 * Math.PI * base * tt) + 0.6 * Math.sin(2 * Math.PI * base * 1.63 * tt) + 0.4 * Math.sin(2 * Math.PI * base * 2.41 * tt)) * Math.exp(-tt * 9);
    }
    add(out, clink, at, 0.25);
  }
  writeWav("crowd", out, 0.6);
}

function tone(len, fn) {
  const out = buffer(len);
  for (let i = 0; i < out.length; i++) out[i] = fn(i / SR, i);
  return out;
}

{
  let ph = 0;
  writeWav("pop", tone(0.12, (t) => {
    ph += (900 - 5000 * t) / SR;
    return Math.sin(2 * Math.PI * ph) * Math.exp(-t * 30);
  }));
}
{
  let ph = 0;
  writeWav("msg", tone(0.09, (t) => {
    ph += (t < 0.04 ? 1250 : 1660) / SR;
    return Math.sin(2 * Math.PI * ph) * Math.exp(-t * 25);
  }), 0.6);
}
{
  let ph = 0;
  writeWav("boing", tone(0.55, (t) => {
    ph += (190 + 130 * Math.sin(2 * Math.PI * 11 * t) * Math.exp(-t * 5)) / SR;
    return Math.sin(2 * Math.PI * ph) * Math.exp(-t * 5);
  }));
}
{
  const out = buffer(0.5);
  let bp = null;
  for (let i = 0; i < out.length; i++) {
    const t = i / out.length;
    if (i % 64 === 0) bp = bandpass(300 + 2800 * Math.sin(Math.PI * t), 1.2);
    out[i] = bp(rand() * 2 - 1) * Math.sin(Math.PI * t);
  }
  writeWav("whoosh", out, 0.7);
}
writeWav("ding", tone(1.2, (t) => (Math.sin(2 * Math.PI * 1320 * t) + 0.5 * Math.sin(2 * Math.PI * 3643 * t) * Math.exp(-t * 6) + 0.3 * Math.sin(2 * Math.PI * 7128 * t) * Math.exp(-t * 12)) * Math.exp(-t * 3.5)), 0.7);
writeWav("buzz", tone(1.0, (t) => {
  const gate = t % 0.5 < 0.34 ? 1 : 0;
  return Math.tanh(Math.sin(2 * Math.PI * 165 * t) * 3) * gate * (0.6 + 0.4 * Math.sin(2 * Math.PI * 30 * t));
}), 0.55);
writeWav("glint", tone(0.45, (t) => Math.sin(2 * Math.PI * (2200 + 9000 * t) * t) * Math.exp(-t * 8) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 40 * t))), 0.45);
writeWav("tick", tone(0.05, (t) => (rand() * 2 - 1) * Math.exp(-t * 120)), 0.5);
{
  const out = buffer(1.7);
  for (let set = 0; set < 2; set++) {
    for (let p = 0; p < 4; p++) {
      const at = set * 0.8 + p * 0.07;
      add(out, tone(0.05, (t) => Math.sin(2 * Math.PI * 4400 * t) * Math.sin((Math.PI * t) / 0.05)), at);
    }
  }
  writeWav("cricket", out, 0.4);
}
{
  const out = buffer(3);
  let t = 0;
  let rate = 12;
  const bp = bandpass(1800, 0.8);
  while (t < 1.9) {
    const vol = 0.3 + (t / 1.9) * 0.7;
    add(out, tone(0.06, (tt) => bp(rand() * 2 - 1) * Math.exp(-tt * 50)), t, vol);
    t += 1 / rate;
    rate += 0.1;
  }
  add(out, tone(1.0, (tt) => (rand() * 2 - 1) * Math.exp(-tt * 3.5)), 1.95, 0.6);
  add(out, tone(0.5, (tt) => Math.sin(2 * Math.PI * (120 - 60 * tt) * tt) * Math.exp(-tt * 6)), 1.95, 1.2);
  writeWav("drumroll", out, 0.8);
}
{
  const out = buffer(1.8);
  const notes = [110, 164.8, 220, 261.6, 329.6];
  const lp = lowpass(2200);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let v = 0;
    for (const n of notes) v += ((((t * n) % 1) * 2 - 1) + (((t * n * 1.005) % 1) * 2 - 1)) * 0.5;
    out[i] = lp(v) * Math.exp(-t * 2.2) + (t < 0.12 ? (rand() * 2 - 1) * Math.exp(-t * 30) * 2 : 0);
  }
  writeWav("sting", out, 0.85);
}
{
  const out = buffer(1.2);
  [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => {
    add(out, tone(0.6, (t) => (Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1) * 0.5 * Math.exp(-t * 7)), k * 0.09);
  });
  const lp = lowpass(3500);
  for (let i = 0; i < out.length; i++) out[i] = lp(out[i]);
  writeWav("tada", out, 0.6);
}
{
  const out = buffer(1.9);
  [[311, 0], [293, 0.38], [277, 0.76], [262, 1.14]].forEach(([f, at], k) => {
    const len = k === 3 ? 0.75 : 0.36;
    add(out, tone(len, (t) => {
      const vib = k === 3 ? 1 + 0.03 * Math.sin(2 * Math.PI * 6 * t) : 1;
      return ((((t * f * vib) % 1) * 2 - 1)) * Math.min(1, t / 0.03) * Math.min(1, (len - t) / 0.05);
    }), at);
  });
  const lp = lowpass(1200);
  for (let i = 0; i < out.length; i++) out[i] = lp(out[i]);
  writeWav("wahwah", out, 0.7);
}

{
  const bpm = 104;
  const beat = 60 / bpm;
  const bars = 8;
  const len = beat * 4 * bars;
  const out = buffer(len);
  const chords = [
    [220, 261.6, 329.6],
    [174.6, 220, 261.6],
    [261.6, 329.6, 392],
    [196, 246.9, 293.7],
  ];
  const roots = [110, 87.3, 130.8, 98];
  for (let b = 0; b < bars * 4; b++) {
    const t0 = b * beat;
    const bar = Math.floor(b / 4) % 4;
    if (b % 4 === 0 || b % 4 === 2) add(out, tone(0.3, (t) => Math.sin(2 * Math.PI * (48 + 90 * Math.exp(-t * 25)) * t) * Math.exp(-t * 9)), t0, 0.9);
    if (b % 4 === 1 || b % 4 === 3) {
      const bp = bandpass(1900, 0.9);
      add(out, tone(0.18, (t) => bp(rand() * 2 - 1) * Math.exp(-t * 22) * 1.6 + Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 30) * 0.4), t0, 0.45);
    }
    for (let h = 0; h < 2; h++) {
      let prev = 0;
      add(out, tone(0.05, (t) => {
        const n = rand() * 2 - 1;
        const hp = n - prev;
        prev = n;
        return hp * Math.exp(-t * 70);
      }), t0 + h * beat * 0.5, h ? 0.12 : 0.18);
    }
    for (let e = 0; e < 2; e++) {
      const f = roots[bar] * (e === 1 && b % 2 === 1 ? 2 : 1);
      add(out, tone(beat * 0.45, (t) => (2 * Math.abs(2 * ((t * f) % 1) - 1) - 1) * Math.exp(-t * 5)), t0 + e * beat * 0.5, 0.55);
    }
    for (let s = 0; s < 2; s++) {
      const f = chords[bar][(b * 2 + s) % 3] * 2;
      const lp = lowpass(2600);
      add(out, tone(0.22, (t) => lp(Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1) * Math.exp(-t * 11)), t0 + s * beat * 0.5, 0.16);
    }
  }
  writeWav("music", out, 0.7);
}

console.log(`sfx written to ${OUT}`);
