const COLORS = ["#C9FF05", "#2D00F7", "#FF007F", "#fff", "#FFD600"];

interface Particle {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; color: string; rotation: number; rotSpeed: number; life: number;
}

let animId: number | null = null;
let particles: Particle[] = [];

function spawn(canvas: HTMLCanvasElement, count = 60) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.4,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      w: Math.random() * 8 + 4,
      h: Math.random() * 4 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      life: 1,
    });
  }
}

function tick(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.life > 0);
  for (const p of particles) {
    p.x += p.vx;
    p.vy += 0.35;
    p.y += p.vy;
    p.rotation += p.rotSpeed;
    p.life -= 0.012;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
  if (particles.length > 0) {
    animId = requestAnimationFrame(() => tick(ctx, canvas));
  } else {
    canvas.remove();
    animId = null;
  }
}

export function confetti() {
  if (typeof window === "undefined") return;
  if (animId) cancelAnimationFrame(animId);

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }

  spawn(canvas, 80);
  tick(ctx, canvas);
}
