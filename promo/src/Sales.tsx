import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { color, font } from "./theme";
import { Avatar, Backdrop, Card, ease, Flash, Icon, Kinetic, Logo, LogoIcon, Phone, Pill, Pop, Sticker, Ticker, useSpring } from "./ui";

const T = 12;

const chat = [
  { name: "Дана", text: "кто идёт в пятницу?", x: -40, r: -3 },
  { name: "Амир", text: "скиньте адрес ещё раз", x: 60, r: 2 },
  { name: "Ерлан", text: "а в каком чате была ссылка??", x: -10, r: -1 },
  { name: "Алия", text: "я подумаю", x: 90, r: 4 },
  { name: "Тимур", text: "кто берёт лёд?", x: -60, r: -4 },
  { name: "Дана", text: "кто берёт лёд???", x: 30, r: 3 },
  { name: "Амир", text: "фотки с прошлого раза где", x: -30, r: -2 },
  { name: "Мира", text: "голосовалка улетела вверх", x: 70, r: 2 },
  { name: "Ерлан", text: "так во сколько?", x: -50, r: -3 },
];

const ChatChaos: React.FC = () => {
  const frame = useCurrentFrame();
  const shake = frame > 40 ? Math.sin(frame * 1.7) * Math.min(10, (frame - 40) / 4) : 0;
  const dim = ease(frame, 62, 76, [0, 0.9]);
  const unread = Math.min(99, Math.floor(interpolate(frame, [0, 60], [3, 99], { extrapolateRight: "clamp" })));
  return (
    <AbsoluteFill>
      <Backdrop glow="pink" />
      <AbsoluteFill style={{ padding: "150px 90px", transform: `translateX(${shake}px)` }}>
        <Card style={{ padding: "30px 36px", display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ display: "flex" }}>
            {["Дана", "Амир", "Ерлан"].map((n, i) => (
              <Avatar key={n} name={n} index={i} size={76} style={{ marginLeft: i ? -22 : 0 }} />
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 40, color: color.fg }}>Туса в пятницу?</div>
            <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 28, color: color.gray }}>печатают: 6 человек…</div>
          </div>
          <Pill tone="pink" size={32}>
            +{unread}
          </Pill>
        </Card>
        <div style={{ position: "relative", flex: 1, marginTop: 40 }}>
          {chat.map((m, i) => {
            const start = 4 + i * 6;
            const s = bubbleIn(frame, start);
            const y = 60 + i * 132 - Math.max(0, frame - 40) * 2.2;
            return (
              <div key={i} style={{ position: "absolute", top: y, left: 0, right: 0, display: "flex", justifyContent: i % 2 ? "flex-end" : "flex-start", transform: `translateX(${m.x}px) rotate(${m.r}deg) scale(${s})`, opacity: s }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexDirection: i % 2 ? "row-reverse" : "row" }}>
                  <Avatar name={m.name} index={i} size={70} />
                  <div style={{ background: i % 2 ? color.blueBright : color.panel2, color: color.fg, border: `4px solid ${color.ink}`, borderRadius: 34, padding: "22px 30px", boxShadow: `0 8px 0 ${color.ink}`, maxWidth: 680 }}>
                    <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 24, color: i % 2 ? "rgba(255,255,255,.75)" : color.lime, marginBottom: 4 }}>{m.name}</div>
                    <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 40 }}>{m.text}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(11,12,17,${dim})` }} />
      <AbsoluteFill style={{ justifyContent: "center", padding: 90 }}>
        {frame > 62 && <Kinetic text={"Пять чатов.\nНоль плана."} delay={64} size={132} highlight={["Ноль", "плана"]} highlightColor={color.pink} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function bubbleIn(frame: number, start: number) {
  const t = Math.max(0, frame - start);
  return Math.min(1, 1 - Math.exp(-t / 2.2) * Math.cos(t / 2.5));
}

const pains = [
  { icon: "link_off", title: "Ссылка потерялась", copy: "Половина компании всё ещё «подумает»" },
  { icon: "shopping_cart", title: "Кто что купил?", copy: "Лёд, угли и переводы живут в разных заметках" },
  { icon: "photo_library", title: "Фотки разъехались", copy: "Часть в WhatsApp, часть в сторис, часть пропала" },
];

const Pains: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop glow="pink" />
      <AbsoluteFill style={{ padding: "0 80px", gap: 56, justifyContent: "center" }}>
        <Kinetic text="Знакомо?" size={120} />
        {pains.map((p, i) => {
          const d = 10 + i * 16;
          const strike = ease(frame, d + 14, d + 22);
          return (
            <Pop key={p.title} delay={d} from="right" distance={500}>
              <Card style={{ padding: "40px 40px", display: "flex", gap: 32, alignItems: "center", position: "relative", transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}>
                <div style={{ width: 110, height: 110, borderRadius: 28, background: color.pink, border: `4px solid ${color.ink}`, display: "flex", alignItems: "center", justifyContent: "center", color: color.white, flexShrink: 0 }}>
                  <Icon name={p.icon} size={64} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 44, color: color.fg, lineHeight: 1.1, whiteSpace: "nowrap" }}>{p.title}</div>
                    <div style={{ position: "absolute", left: -8, right: -8, top: "48%", height: 10, background: color.pink, borderRadius: 6, transformOrigin: "left", transform: `scaleX(${strike}) rotate(-2deg)`, boxShadow: `0 3px 0 ${color.ink}` }} />
                  </div>
                  <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 32, color: color.muted, marginTop: 12, lineHeight: 1.25 }}>{p.copy}</div>
                </div>
              </Card>
            </Pop>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useSpring(4, { damping: 9, stiffness: 140 });
  const ring = (delay: number) => ease(frame, delay, delay + 30);
  return (
    <AbsoluteFill>
      <Backdrop glow="lime" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {[0, 8, 16].map((d) => (
          <div key={d} style={{ position: "absolute", width: 1400, height: 1400, borderRadius: "50%", border: `8px solid ${color.lime}`, transform: `scale(${ring(d)})`, opacity: 1 - ring(d), top: 260 }} />
        ))}
        <div style={{ transform: `scale(${s}) rotate(${(1 - s) * -20}deg)`, marginTop: -260 }}>
          <LogoIcon size={300} />
        </div>
        <Pop delay={14} from="scale" style={{ marginTop: 60 }}>
          <Logo width={640} />
        </Pop>
        <div style={{ marginTop: 110, padding: "0 80px" }}>
          <Kinetic text={"Одна ссылка.\nВся туса внутри."} delay={24} size={96} align="center" highlight={["Вся", "туса", "внутри"]} />
        </div>
      </AbsoluteFill>
      <Flash at={0} duration={10} />
    </AbsoluteFill>
  );
};

const EventScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const inside = Math.round(interpolate(frame, [20, 90], [1, 12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const claimed = frame > 110;
  const seconds = Math.max(0, 180 - Math.floor(frame / 30));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const row = (label: string, who: string | null, done: boolean, delay: number) => (
    <Pop delay={delay} from="left" distance={60}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 22px", borderRadius: 22, background: done ? "rgba(201,255,5,.12)" : color.panel, border: `3px solid ${done ? color.lime : "rgba(255,255,255,.1)"}` }}>
        <Icon name={done ? "check_circle" : "add_circle"} size={40} style={{ color: done ? color.lime : color.gray }} />
        <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 30, color: color.fg, flex: 1 }}>{label}</div>
        <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 26, color: who ? color.lime : color.gray }}>{who ?? "взять"}</div>
      </div>
    </Pop>
  );
  return (
    <div style={{ padding: "92px 30px 30px", display: "flex", flexDirection: "column", gap: 22 }}>
      <Pop delay={4}>
        <Pill tone="lime" size={24}>
          <span style={{ width: 14, height: 14, borderRadius: 8, background: color.ink, opacity: frame % 20 < 10 ? 1 : 0.3 }} /> ИВЕНТ ОТКРЫТ
        </Pill>
      </Pop>
      <Pop delay={8}>
        <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 44, color: color.fg, lineHeight: 1.08 }}>Квартирник у Амира</div>
        <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 30, color: color.muted, marginTop: 10 }}>Пятница · 21:00</div>
      </Pop>
      <Pop delay={14}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex" }}>
            {["Амир", "Дана", "Ерлан", "Алия"].map((n, i) => (
              <div key={n} style={{ marginLeft: i ? -20 : 0, transform: `scale(${inside > i * 2 ? 1 : 0})` }}>
                <Avatar name={n} index={i} size={66} />
              </div>
            ))}
          </div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 30, color: color.lime, whiteSpace: "nowrap" }}>{inside} внутри</div>
        </div>
      </Pop>
      <Pop delay={30}>
        <Card style={{ padding: 26, display: "flex", flexDirection: "column", gap: 14 }} shadow={8} radius={28}>
          <div style={{ fontFamily: font.body, fontWeight: 800, fontSize: 22, color: color.pink, letterSpacing: 2 }}>СЕЙЧАС</div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 32, color: color.fg }}>Кто берёт лёд, колу и угли?</div>
          {row("Лёд", "Дана", true, 40)}
          {row("Кола", "Амир", true, 46)}
          {row("Угли", claimed ? "Ерлан" : null, claimed, 52)}
        </Card>
      </Pop>
      <Pop delay={66}>
        <Card tone="blue" style={{ padding: "22px 24px", display: "flex", alignItems: "center", gap: 18 }} shadow={8} radius={28}>
          <Icon name="record_voice_over" size={52} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.body, fontWeight: 800, fontSize: 22, letterSpacing: 2, opacity: 0.8 }}>ДАЛЬШЕ</div>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 28, whiteSpace: "nowrap" }}>Alias через {mm}:{ss}</div>
          </div>
        </Card>
      </Pop>
      <div style={{ display: "flex", gap: 16 }}>
        <Pop delay={80} style={{ flex: 1 }}>
          <Card tone="pink" style={{ padding: "20px 18px", display: "flex", alignItems: "center", gap: 10 }} shadow={8} radius={28}>
            <Icon name="photo_library" size={40} />
            <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 26, whiteSpace: "nowrap" }}>18 фото</div>
          </Card>
        </Pop>
        <Pop delay={88} style={{ flex: 1 }}>
          <Card tone="cream" style={{ padding: "20px 18px", display: "flex", alignItems: "center", gap: 10 }} shadow={8} radius={28}>
            <Icon name="forum" size={40} />
            <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 26, whiteSpace: "nowrap" }}>7 новых</div>
          </Card>
        </Pop>
      </div>
    </div>
  );
};

const PhoneDemo: React.FC = () => {
  const rise = useSpring(0, { damping: 16, stiffness: 90 });
  return (
    <AbsoluteFill>
      <Backdrop glow="blue" />
      <div style={{ position: "absolute", top: 110, left: 80, right: 80 }}>
        <Kinetic text={"Люди, покупки, игры\nи фотки. Всё здесь."} size={58} highlight={["Всё", "здесь"]} stagger={2} />
      </div>
      <div style={{ position: "absolute", left: 250, top: 390 + (1 - rise) * 1400, transform: "rotate(-2deg)" }}>
        <Phone width={580} height={1300}>
          <EventScreen />
        </Phone>
      </div>
      <Sticker tone="pink" rotate={-8} delay={30} size={30} style={{ top: 360, left: 30 }}>
        Без скачивания
      </Sticker>
      <Sticker tone="lime" rotate={7} delay={70} size={30} style={{ top: 1600, right: 30 }}>
        32 режима внутри
      </Sticker>
      <Sticker tone="cream" rotate={-6} delay={110} size={30} style={{ top: 1740, left: 40 }}>
        QR уже внутри
      </Sticker>
      <Sticker tone="blue" rotate={5} delay={150} size={30} style={{ top: 300, right: 40 }}>
        Live галерея
      </Sticker>
    </AbsoluteFill>
  );
};

const Numbers: React.FC = () => {
  const frame = useCurrentFrame();
  const stats = [
    { value: 30, suffix: " сек", label: "до готового ивента", tone: "lime" as const },
    { value: 32, suffix: " режима", label: "игр прямо во встрече", tone: "pink" as const },
    { value: 0, suffix: " установок", label: "друзья заходят по ссылке", tone: "blue" as const },
  ];
  return (
    <AbsoluteFill>
      <Backdrop glow="lime" />
      <AbsoluteFill style={{ padding: "180px 80px", gap: 56, justifyContent: "center" }}>
        {stats.map((s, i) => {
          const d = 6 + i * 14;
          const v = Math.round(interpolate(frame, [d, d + 26], [s.value === 0 ? 9 : 0, s.value], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
          return (
            <Pop key={s.label} delay={d} from={i % 2 ? "right" : "left"} distance={400}>
              <Card tone={s.tone} style={{ padding: "46px 54px", transform: `rotate(${i % 2 ? 2 : -2}deg)` }} shadow={16}>
                <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 132, lineHeight: 1, letterSpacing: -3 }}>
                  {v}
                  <span style={{ fontSize: 72 }}>{s.suffix}</span>
                </div>
                <div style={{ fontFamily: font.body, fontWeight: 800, fontSize: 40, marginTop: 14 }}>{s.label}</div>
              </Card>
            </Pop>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const press = frame > 118 && frame < 128 ? 8 : 0;
  const cursor = ease(frame, 96, 116);
  return (
    <AbsoluteFill>
      <Backdrop glow="blue" />
      <AbsoluteFill style={{ padding: "0 80px 260px", justifyContent: "center", gap: 70 }}>
        <Kinetic text={"Твоя туса.\nВ один клик.\nБез душноты."} size={100} highlight={["один", "клик"]} stagger={4} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 64 }}>
          <Pop delay={60} from="scale" style={{ position: "relative" }}>
            <Logo width={560} />
            <Sticker tone="pink" rotate={8} delay={100} size={32} style={{ bottom: -40, right: -130 }}>
              Бета бесплатно
            </Sticker>
          </Pop>
          <Pop delay={76} from="up" style={{ position: "relative" }}>
            <div
              style={{
                background: color.lime,
                color: color.ink,
                border: `6px solid ${color.ink}`,
                borderRadius: 999,
                padding: "40px 76px",
                boxShadow: `0 ${16 - press}px 0 ${color.ink}`,
                transform: `translateY(${press}px)`,
                fontFamily: font.display,
                fontWeight: 900,
                fontSize: 60,
                display: "flex",
                alignItems: "center",
                gap: 26,
              }}
            >
              Собрать тусу
              <Icon name="arrow_forward" size={66} />
            </div>
            <div style={{ position: "absolute", right: -40 + (1 - cursor) * 200, bottom: -90 + (1 - cursor) * 300, opacity: cursor, transform: `scale(${press ? 0.85 : 1})` }}>
              <Icon name="touch_app" size={130} style={{ color: color.white, filter: "drop-shadow(0 6px 0 #121218)" }} />
            </div>
          </Pop>
          <Pop delay={90}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 70, color: color.fg, letterSpacing: -1 }}>tusa.game</div>
          </Pop>
        </div>
      </AbsoluteFill>
      <Ticker items={["ОДНА ССЫЛКА", "ВСЯ ТУСА ВНУТРИ", "БЕЗ СКАЧИВАНИЯ", "СДЕЛАНО В KZ"]} style={{ bottom: 90 }} rotate={-3} />
      <Flash at={118} duration={10} tint={color.white} />
    </AbsoluteFill>
  );
};

export const SALES_SCENES = [120, 120, 105, 240, 150, 195];
export const SALES_DURATION = SALES_SCENES.reduce((a, b) => a + b, 0) - (SALES_SCENES.length - 1) * T;

export const Sales: React.FC = () => {
  const [a, b, c, d, e, f] = SALES_SCENES;
  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={a}>
          <ChatChaos />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={b}>
          <Pains />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-top-left" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={c}>
          <Reveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={d}>
          <PhoneDemo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={e}>
          <Numbers />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={f}>
          <Cta />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
