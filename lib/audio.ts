let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) { try { ctx = new AudioContext(); } catch { return null; } }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

function playNotes(notes: { freq: number; dur: number; delay: number }[], type: OscillatorType = "sine", volume = 0.12) {
  const c = getCtx();
  if (!c) return;
  for (const n of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = n.freq;
    gain.gain.setValueAtTime(0, c.currentTime + n.delay);
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + n.delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + n.delay + n.dur);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + n.delay);
    osc.stop(c.currentTime + n.delay + n.dur);
  }
}

export function soundClick() {
  playTone(800, 0.06, "square", 0.08);
}

export function soundTap() {
  playTone(600, 0.04, "sine", 0.06);
}

export function soundSuccess() {
  playNotes([
    { freq: 523, dur: 0.12, delay: 0 },
    { freq: 659, dur: 0.12, delay: 0.08 },
    { freq: 784, dur: 0.18, delay: 0.16 },
  ], "sine", 0.12);
}

export function soundReward() {
  playNotes([
    { freq: 784, dur: 0.1, delay: 0 },
    { freq: 988, dur: 0.1, delay: 0.06 },
    { freq: 1175, dur: 0.15, delay: 0.12 },
    { freq: 1319, dur: 0.25, delay: 0.18 },
  ], "triangle", 0.15);
}

export function soundCorrect() {
  playNotes([
    { freq: 880, dur: 0.08, delay: 0 },
    { freq: 1109, dur: 0.15, delay: 0.06 },
  ], "sine", 0.12);
}

export function soundWrong() {
  playTone(220, 0.25, "sawtooth", 0.08);
  playTone(180, 0.3, "sawtooth", 0.06);
}

export function soundWin() {
  playNotes([
    { freq: 523, dur: 0.12, delay: 0 },
    { freq: 659, dur: 0.12, delay: 0.1 },
    { freq: 784, dur: 0.12, delay: 0.2 },
    { freq: 1047, dur: 0.3, delay: 0.3 },
  ], "triangle", 0.14);
}

export function soundPass() {
  playTone(440, 0.1, "sine", 0.06);
  playTone(330, 0.15, "sine", 0.05);
}

export function soundChat() {
  playNotes([
    { freq: 1200, dur: 0.05, delay: 0 },
    { freq: 1600, dur: 0.05, delay: 0.04 },
  ], "sine", 0.08);
}

export function soundNotification() {
  playNotes([
    { freq: 880, dur: 0.08, delay: 0 },
    { freq: 1175, dur: 0.08, delay: 0.1 },
    { freq: 880, dur: 0.08, delay: 0.2 },
    { freq: 1175, dur: 0.12, delay: 0.3 },
  ], "triangle", 0.1);
}

export function soundCountdown() {
  playTone(880, 0.08, "square", 0.09);
}

export function soundFanfare() {
  playNotes([
    { freq: 440, dur: 0.1, delay: 0 },
    { freq: 554, dur: 0.1, delay: 0.1 },
    { freq: 659, dur: 0.1, delay: 0.2 },
    { freq: 880, dur: 0.35, delay: 0.3 },
  ], "triangle", 0.16);
}

export function unlockAudio() {
  if (typeof window === "undefined") return;
  const unlock = () => {
    getCtx();
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("keydown", unlock);
  };
  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });
}
