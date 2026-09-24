import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { color, font, tone as toneMap, type Tone } from "./theme";
import { Avatar, Backdrop, Card, ease, Flash, Icon, Kinetic, Logo, LogoIcon, Phone, Pill, Pop, StepLabel, Sticker, Ticker, useSpring } from "./ui";

const T = 12;

const Headline: React.FC<{ index: string; label: string; text: string; highlight: string[]; tone?: Tone; size?: number }> = ({ index, label, text, highlight, tone = "lime", size = 84 }) => (
  <div style={{ position: "absolute", top: 130, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 34 }}>
    <StepLabel index={index} title={label} tone={tone} />
    <Kinetic text={text} delay={6} size={size} highlight={highlight} highlightColor={toneMap[tone].bg === color.cream ? color.lime : toneMap[tone].bg} stagger={3} />
  </div>
);

const Intro: React.FC = () => {
  const s = useSpring(0, { damping: 9, stiffness: 140 });
  return (
    <AbsoluteFill>
      <Backdrop glow="lime" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60, padding: 80 }}>
        <div style={{ transform: `scale(${s}) rotate(${(1 - s) * 25}deg)` }}>
          <LogoIcon size={260} />
        </div>
        <Kinetic text={"Что внутри\nTUSA.game"} delay={10} size={116} align="center" highlight={["TUSA.game"]} />
        <Pop delay={34} from="scale">
          <Pill tone="lime" size={40} style={{ fontFamily: font.display }}>
            7 модулей · 1 ссылка
          </Pill>
        </Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const typed = (text: string, frame: number, start: number, speed = 1.3) => text.slice(0, Math.max(0, Math.floor((frame - start) / speed)));

const Field: React.FC<{ label: string; value: string; active?: boolean; delay: number }> = ({ label, value, active, delay }) => {
  const frame = useCurrentFrame();
  return (
    <Pop delay={delay}>
      <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 24, color: color.gray, marginBottom: 10, textTransform: "uppercase", letterSpacing: 2 }}>{label}</div>
      <div style={{ padding: "22px 24px", borderRadius: 22, background: color.panel, border: `3px solid ${active ? color.lime : "rgba(255,255,255,.12)"}`, fontFamily: font.body, fontWeight: 700, fontSize: 32, color: color.fg, minHeight: 40 }}>
        {value}
        {active && <span style={{ opacity: frame % 16 < 8 ? 1 : 0, color: color.lime }}>|</span>}
      </div>
    </Pop>
  );
};

const Create: React.FC = () => {
  const frame = useCurrentFrame();
  const title = typed("Квартирник у Амира", frame, 20, 1.4);
  const when = typed("Пятница · 21:00", frame, 50, 1.2);
  const vibes = ["Игры", "Музыка", "Шашлык", "Кино"];
  const pressed = frame > 112 && frame < 120;
  const done = ease(frame, 118, 132);
  const seconds = Math.min(28, Math.floor(interpolate(frame, [10, 118], [0, 28], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  return (
    <AbsoluteFill>
      <Backdrop glow="blue" />
      <Headline index="01" label="Создай ивент" text={"30 секунд.\nБез анкеты."} highlight={["30", "секунд"]} />
      <div style={{ position: "absolute", left: 250, top: 600 }}>
        <Phone width={580} height={1260}>
          <div style={{ padding: "96px 30px 30px", display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 40, color: color.fg }}>Новая туса</div>
            <Field label="Название" value={title} active={frame < 50} delay={6} />
            <Field label="Когда" value={when} active={frame >= 50 && frame < 80} delay={12} />
            <Pop delay={18}>
              <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 24, color: color.gray, marginBottom: 12, textTransform: "uppercase", letterSpacing: 2 }}>Вайб</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {vibes.map((v, i) => {
                  const on = frame > 82 + i * 7 && i !== 3;
                  return (
                    <div key={v} style={{ padding: "14px 24px", borderRadius: 999, border: `3px solid ${on ? color.ink : "rgba(255,255,255,.14)"}`, background: on ? color.lime : "transparent", color: on ? color.ink : color.muted, fontFamily: font.body, fontWeight: 800, fontSize: 28, transform: `scale(${on && frame < 88 + i * 7 ? 1.1 : 1})` }}>
                      {v}
                    </div>
                  );
                })}
              </div>
            </Pop>
            <Pop delay={24}>
              <div style={{ marginTop: 16, padding: "28px 0", textAlign: "center", borderRadius: 999, background: color.lime, color: color.ink, border: `4px solid ${color.ink}`, boxShadow: `0 ${pressed ? 2 : 10}px 0 ${color.ink}`, transform: `translateY(${pressed ? 8 : 0}px)`, fontFamily: font.display, fontWeight: 900, fontSize: 36 }}>
                Создать тусу
              </div>
            </Pop>
          </div>
          <AbsoluteFill style={{ background: color.lime, alignItems: "center", justifyContent: "center", gap: 30, clipPath: `circle(${done * 150}% at 50% 72%)` }}>
            <Icon name="celebration" size={170} style={{ color: color.ink }} />
            <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 52, color: color.ink }}>Ивент открыт</div>
            <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 30, color: color.ink }}>Кидай ссылку своим</div>
          </AbsoluteFill>
        </Phone>
      </div>
      <Pop delay={8} from="right" style={{ position: "absolute", right: 40, top: 540 }}>
        <Pill tone="pink" size={36} style={{ fontFamily: font.display }}>
          <Icon name="timer" size={40} /> 00:{String(seconds).padStart(2, "0")}
        </Pill>
      </Pop>
    </AbsoluteFill>
  );
};

const QR: React.FC<{ size: number; seed: string }> = ({ size, seed }) => {
  const n = 21;
  const cell = size / n;
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      if (inBox(ox, oy)) {
        const dx = x - ox;
        const dy = y - oy;
        return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0;
      }
    }
    return -1;
  };
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const f = finder(x, y);
      const on = f === -1 ? random(`${seed}-${x}-${y}`) > 0.52 : f === 1;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell + 0.5} height={cell + 0.5} fill={color.ink} />);
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {cells}
    </svg>
  );
};

const people = ["Дана", "Амир", "Ерлан", "Алия", "Тимур", "Мира", "Саша", "Айдос", "Жанна", "Руслан", "Карина", "Олжас"];

const Invite: React.FC = () => {
  const frame = useCurrentFrame();
  const joined = Math.round(interpolate(frame, [60, 130], [0, 12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const copied = frame > 36;
  return (
    <AbsoluteFill>
      <Backdrop glow="pink" />
      <Headline index="02" label="Позови своих" text={"Кинул ссылку.\nВсе внутри."} highlight={["Все", "внутри"]} tone="pink" />
      <div style={{ position: "absolute", top: 560, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 40 }}>
        <Pop delay={14} from="left" distance={300}>
          <Card style={{ padding: "30px 34px", display: "flex", alignItems: "center", gap: 22 }}>
            <Icon name="link" size={54} style={{ color: color.lime }} />
            <div style={{ flex: 1, fontFamily: font.body, fontWeight: 700, fontSize: 36, color: color.fg }}>tusa.game/join/7F3A9C21BE</div>
            <Pill tone={copied ? "lime" : "panel"} size={26}>
              <Icon name={copied ? "check" : "content_copy"} size={30} />
              {copied ? "Скопировано" : "Копировать"}
            </Pill>
          </Card>
        </Pop>
        <div style={{ display: "flex", gap: 40, alignItems: "stretch" }}>
          <Pop delay={24} from="scale">
            <Card tone="cream" style={{ padding: 26, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <QR size={300} seed="tusa" />
              <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 28 }}>или по QR</div>
            </Card>
          </Pop>
          <Pop delay={34} from="right" style={{ flex: 1 }}>
            <Card tone="lime" style={{ padding: 30, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 130, lineHeight: 1 }}>{joined}</div>
              <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 40 }}>внутри</div>
              <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 26, marginTop: 14 }}>без скачивания и регистрации</div>
            </Card>
          </Pop>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", minHeight: 230 }}>
          {people.map((p, i) => {
            const s = springAt(frame, 60 + i * 6);
            return (
              <div key={p} style={{ transform: `scale(${s}) translateY(${(1 - s) * 200}px)`, opacity: Math.min(1, s * 2) }}>
                <Avatar name={p} index={i} size={100} />
              </div>
            );
          })}
        </div>
        <Pop delay={120} from="up">
          <div style={{ display: "flex", gap: 18, justifyContent: "center" }}>
            <Pill tone="lime" size={30}>Иду · 9</Pill>
            <Pill tone="cream" size={30}>Может · 2</Pill>
            <Pill tone="panel" size={30}>Не смогу · 1</Pill>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

function springAt(frame: number, start: number) {
  const t = Math.max(0, frame - start);
  return Math.min(1, 1 - Math.exp(-t / 2.4) * Math.cos(t / 2.6));
}

const Bubble: React.FC<{ name: string; index: number; mine?: boolean; children: React.ReactNode; delay: number; extra?: React.ReactNode }> = ({ name, index, mine, children, delay, extra }) => (
  <Pop delay={delay} from={mine ? "right" : "left"} distance={200}>
    <div style={{ display: "flex", gap: 18, alignItems: "flex-end", flexDirection: mine ? "row-reverse" : "row" }}>
      <Avatar name={name} index={index} size={72} />
      <div style={{ position: "relative", maxWidth: 720 }}>
        <div style={{ background: mine ? color.blueBright : color.panel2, border: `4px solid ${color.ink}`, borderRadius: 32, padding: "22px 28px", boxShadow: `0 8px 0 ${color.ink}`, color: color.fg }}>
          <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 24, color: mine ? "rgba(255,255,255,.75)" : color.lime, marginBottom: 6 }}>{name}</div>
          {children}
        </div>
        {extra}
      </div>
    </div>
  </Pop>
);

const Chat: React.FC = () => {
  const frame = useCurrentFrame();
  const fire = Math.min(5, Math.max(0, Math.floor((frame - 60) / 6)));
  return (
    <AbsoluteFill>
      <Backdrop glow="blue" />
      <Headline index="03" label="Чат ивента" text={"Треды, реакции\nи голосовые."} highlight={["Треды", "реакции", "голосовые"]} tone="blue" />
      <div style={{ position: "absolute", top: 560, left: 70, right: 70, display: "flex", flexDirection: "column", gap: 40 }}>
        <Pop delay={10} from="down">
          <Card tone="lime" style={{ padding: "24px 30px", display: "flex", alignItems: "center", gap: 20 }} shadow={10}>
            <Icon name="push_pin" size={50} />
            <div style={{ fontFamily: font.body, fontWeight: 800, fontSize: 34 }}>Сбор в 21:00 у подъезда</div>
          </Card>
        </Pop>
        <Bubble
          name="Дана"
          index={1}
          delay={24}
          extra={
            <div style={{ position: "absolute", right: -20, bottom: -34, display: "flex", gap: 10 }}>
              <Pill tone="pink" size={26}>
                <Icon name="local_fire_department" size={30} /> {fire}
              </Pill>
              <Pill tone="cream" size={26}>
                <Icon name="favorite" size={30} /> 3
              </Pill>
            </div>
          }
        >
          <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 38 }}>Беру колонку и гирлянду</div>
        </Bubble>
        <Bubble name="Амир" index={0} mine delay={44}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Icon name="play_circle" size={64} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 60 }}>
              {Array.from({ length: 22 }).map((_, i) => {
                const h = 14 + Math.abs(Math.sin(i * 1.7 + frame / 4)) * 40 * (0.5 + random(`w${i}`) * 0.5);
                return <div key={i} style={{ width: 8, height: h, borderRadius: 4, background: color.white, opacity: frame > 70 && i < (frame - 70) / 2 ? 1 : 0.5 }} />;
              })}
            </div>
            <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 28 }}>0:12</div>
          </div>
        </Bubble>
        <Bubble name="Ерлан" index={2} delay={64}>
          <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 38 }}>Кто за шашлыком?</div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, fontFamily: font.body, fontWeight: 800, fontSize: 28, color: color.lime }}>
            <Icon name="forum" size={32} /> 4 ответа в треде
          </div>
        </Bubble>
        <Bubble name="Алия" index={3} mine delay={84}>
          <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 38 }}>Я с тортом, буду в 21:15</div>
        </Bubble>
      </div>
    </AbsoluteFill>
  );
};

const Shopping: React.FC = () => {
  const frame = useCurrentFrame();
  const items = [
    { name: "Лёд", who: "Дана", at: 20 },
    { name: "Кола", who: "Амир", at: 34 },
    { name: "Угли", who: "Ерлан", at: 60 },
    { name: "Мясо", who: "Алия", at: 76 },
    { name: "Лаваш", who: null, at: 999 },
  ];
  const dupe = ease(frame, 88, 100) * (1 - ease(frame, 132, 142));
  const total = Math.round(interpolate(frame, [110, 150], [0, 24000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const each = Math.round(total / 6);
  const fmt = (n: number) => n.toLocaleString("ru-RU").replace(/ /g, " ");
  return (
    <AbsoluteFill>
      <Backdrop glow="lime" />
      <Headline index="04" label="Покупки и сплит" text={"Кто что берёт.\nБез дублей."} highlight={["Без", "дублей"]} />
      <div style={{ position: "absolute", top: 560, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 34 }}>
        <Pop delay={6}>
          <Card style={{ padding: 32, display: "flex", flexDirection: "column", gap: 18 }}>
            {items.map((it, i) => {
              const done = frame > it.at;
              const pop = done && frame < it.at + 6 ? 1.04 : 1;
              return (
                <Pop key={it.name} delay={8 + i * 4} from="left" distance={100}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 26px", borderRadius: 24, background: done ? "rgba(201,255,5,.12)" : color.panel, border: `3px solid ${done ? color.lime : "rgba(255,255,255,.1)"}`, transform: `scale(${pop})` }}>
                    <Icon name={done ? "check_circle" : "radio_button_unchecked"} size={50} style={{ color: done ? color.lime : color.gray }} />
                    <div style={{ flex: 1, fontFamily: font.body, fontWeight: 800, fontSize: 38, color: color.fg, textDecoration: done ? "line-through" : "none", textDecorationColor: "rgba(201,255,5,.6)" }}>{it.name}</div>
                    {done && it.who ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar name={it.who} index={i + 1} size={54} />
                        <div style={{ fontFamily: font.body, fontWeight: 800, fontSize: 30, color: color.lime }}>{it.who}</div>
                      </div>
                    ) : (
                      <Pill tone="panel" size={24}>
                        + взять
                      </Pill>
                    )}
                  </div>
                </Pop>
              );
            })}
          </Card>
        </Pop>
        <div style={{ height: 120, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, opacity: dupe, transform: `translateY(${(1 - dupe) * 40}px)` }}>
            <Card tone="pink" style={{ padding: "26px 30px", display: "flex", alignItems: "center", gap: 18 }} shadow={10}>
              <Icon name="content_copy" size={46} />
              <div style={{ fontFamily: font.body, fontWeight: 800, fontSize: 32 }}>«Кола» уже в списке. Дубль не добавлен</div>
            </Card>
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: ease(frame, 136, 146) }}>
            <Card tone="lime" style={{ padding: "22px 30px", display: "flex", alignItems: "center", gap: 20 }} shadow={10}>
              <Icon name="call_split" size={54} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: font.body, fontWeight: 800, fontSize: 26 }}>Сплит на 6 человек</div>
                <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 40 }}>
                  {fmt(total)} ₸ → по {fmt(each)} ₸
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const modes: { title: string; icon: string; tone: Tone }[] = [
  { title: "Alias", icon: "record_voice_over", tone: "lime" },
  { title: "Мафия Лайт", icon: "mystery", tone: "pink" },
  { title: "Импостор", icon: "person_off", tone: "cream" },
  { title: "Крокодил", icon: "theater_comedy", tone: "blue" },
  { title: "Бункер", icon: "shield", tone: "cream" },
  { title: "Тривия", icon: "school", tone: "lime" },
  { title: "Бомба", icon: "local_fire_department", tone: "pink" },
  { title: "Панчлайн", icon: "emoji_emotions", tone: "blue" },
  { title: "Фейк-факт", icon: "psychology", tone: "cream" },
  { title: "Что выберешь?", icon: "compare", tone: "lime" },
  { title: "Две правды и ложь", icon: "fact_check", tone: "blue" },
  { title: "Рисуй и угадывай", icon: "draw", tone: "pink" },
  { title: "Кодовые имена", icon: "vpn_key", tone: "lime" },
  { title: "Угадай песню", icon: "music_note", tone: "cream" },
  { title: "Колесо судьбы", icon: "casino", tone: "pink" },
  { title: "Правда или действие", icon: "casino", tone: "blue" },
];

const GamesWall: React.FC = () => {
  const frame = useCurrentFrame();
  const counter = Math.round(interpolate(frame, [10, 60], [0, 32], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const columns = [0, 1, 2].map((c) => modes.filter((_, i) => i % 3 === c));
  return (
    <AbsoluteFill>
      <Backdrop glow="pink" />
      <div style={{ position: "absolute", top: 560, left: -120, right: -120, bottom: -200, display: "flex", gap: 30, transform: "rotate(-8deg)" }}>
        {columns.map((col, c) => {
          const dir = c % 2 ? 1 : -1;
          const offset = dir * (frame * 4) - (c % 2 ? 900 : 0);
          return (
            <div key={c} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 30, transform: `translateY(${offset}px)` }}>
              {[...col, ...col, ...col, ...col].map((m, i) => (
                <Card key={i} tone={m.tone} style={{ padding: "34px 28px", height: 250, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }} shadow={10}>
                  <Icon name={m.icon} size={72} />
                  <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 36, lineHeight: 1.1 }}>{m.title}</div>
                </Card>
              ))}
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${color.bg} 0%, ${color.bg} 27%, rgba(15,16,22,0) 40%, rgba(15,16,22,0) 85%, ${color.bg} 100%)` }} />
      <div style={{ position: "absolute", top: 130, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 34 }}>
        <StepLabel index="05" title="Игры внутри" tone="pink" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 190, color: color.pink, lineHeight: 0.9, letterSpacing: -6 }}>{counter}</div>
          <Kinetic text={"режима\nв бете"} delay={10} size={70} />
        </div>
      </div>
      <Sticker tone="lime" rotate={-6} delay={40} size={40} style={{ bottom: 140, left: 70 }}>
        Без скачивания
      </Sticker>
    </AbsoluteFill>
  );
};

const Controller: React.FC<{ name: string; index: number; delay: number; tapAt: number; label: string; tone: Tone }> = ({ name, index, delay, tapAt, label, tone }) => {
  const frame = useCurrentFrame();
  const tap = frame > tapAt && frame < tapAt + 6;
  return (
    <Pop delay={delay} from="up" distance={300}>
      <Phone width={290} height={560}>
        <div style={{ padding: "76px 18px 18px", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <Avatar name={name} index={index} size={70} />
          <div style={{ fontFamily: font.body, fontWeight: 800, fontSize: 24, color: color.fg }}>{name}</div>
          <div style={{ width: "100%", padding: "24px 0", textAlign: "center", borderRadius: 24, background: toneMap[tone].bg, color: toneMap[tone].fg, border: `4px solid ${color.ink}`, boxShadow: `0 ${tap ? 2 : 8}px 0 ${color.ink}`, transform: `translateY(${tap ? 6 : 0}px)`, fontFamily: font.display, fontWeight: 900, fontSize: 28 }}>{label}</div>
          <div style={{ width: "100%", padding: "20px 0", textAlign: "center", borderRadius: 24, background: color.panel2, color: color.muted, border: `3px solid rgba(255,255,255,.1)`, fontFamily: font.body, fontWeight: 800, fontSize: 24 }}>Пропуск</div>
        </div>
      </Phone>
    </Pop>
  );
};

const StageMode: React.FC = () => {
  const frame = useCurrentFrame();
  const seconds = Math.max(0, 42 - Math.floor(frame / 10));
  const score = frame > 70 ? (frame > 104 ? 7 : 6) : 5;
  return (
    <AbsoluteFill>
      <Backdrop glow="blue" />
      <Headline index="05" label="Игры внутри" text={"Экран ведёт игру.\nТелефоны = пульты."} highlight={["Телефоны", "пульты"]} tone="blue" size={64} />
      <Pop delay={10} from="scale" style={{ position: "absolute", top: 500, left: 60, right: 60 }}>
        <div style={{ background: color.ink, border: "6px solid #2b2e3d", borderRadius: 34, padding: 18, boxShadow: `0 16px 0 #05060a, 0 40px 100px rgba(0,0,0,.6)` }}>
          <div style={{ background: color.blueBright, borderRadius: 20, height: 480, padding: 40, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", color: color.white }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Pill tone="lime" size={28}>Alias · Раунд 2</Pill>
              <Pill tone="cream" size={28}>
                <Icon name="timer" size={32} /> 00:{String(seconds).padStart(2, "0")}
              </Pill>
            </div>
            <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 110, textAlign: "center", letterSpacing: -2 }}>{frame > 70 ? (frame > 104 ? "Гирлянда" : "Самовар") : "Дастархан"}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font.display, fontWeight: 800, fontSize: 40 }}>
              <span>Дана · {score}</span>
              <span style={{ opacity: 0.7 }}>Амир · 4</span>
            </div>
          </div>
        </div>
        <div style={{ margin: "0 auto", width: 160, height: 40, background: "#2b2e3d", borderRadius: "0 0 12px 12px" }} />
      </Pop>
      <div style={{ position: "absolute", top: 1190, left: 40, right: 40, display: "flex", justifyContent: "space-between" }}>
        <Controller name="Дана" index={1} delay={30} tapAt={68} label="Угадал" tone="lime" />
        <Controller name="Ерлан" index={2} delay={38} tapAt={102} label="Угадал" tone="lime" />
        <Controller name="Алия" index={3} delay={46} tapAt={999} label="Голос" tone="pink" />
      </div>
      <Flash at={68} duration={6} tint={color.lime} />
      <Flash at={102} duration={6} tint={color.lime} />
    </AbsoluteFill>
  );
};

const photoTones = [
  `linear-gradient(135deg, ${color.pink}, ${color.blueBright})`,
  `linear-gradient(135deg, ${color.lime}, ${color.ok})`,
  `linear-gradient(135deg, ${color.warn}, ${color.pink})`,
  `linear-gradient(135deg, ${color.info}, ${color.blueBright})`,
  `linear-gradient(135deg, ${color.blueBright}, ${color.pinkBright})`,
  `linear-gradient(135deg, ${color.cream}, ${color.lime})`,
  `linear-gradient(135deg, ${color.ok}, ${color.info})`,
  `linear-gradient(135deg, ${color.pinkBright}, ${color.warn})`,
  `linear-gradient(135deg, ${color.lime}, ${color.info})`,
];
const photoIcons = ["celebration", "outdoor_grill", "music_note", "groups", "cake", "local_pizza", "nightlife", "sports_esports", "photo_camera"];

const Gallery: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.min(18, Math.floor(interpolate(frame, [14, 90], [0, 18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  return (
    <AbsoluteFill>
      <Backdrop glow="pink" />
      <Headline index="06" label="Живая галерея" text={"Фотки летят\nв одну ленту."} highlight={["одну", "ленту"]} tone="pink" />
      <div style={{ position: "absolute", top: 580, left: 80, right: 80, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
        {photoTones.map((bg, i) => {
          const s = springAt(frame, 10 + i * 7);
          const cover = i === 4 && frame > 96;
          return (
            <div key={i} style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 26, background: bg, border: `5px solid ${cover ? color.lime : color.ink}`, boxShadow: `0 10px 0 ${color.ink}`, transform: `scale(${s}) rotate(${(1 - s) * (i % 2 ? 20 : -20)}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={photoIcons[i]} size={110} style={{ color: "rgba(18,18,24,.55)" }} />
              {cover && (
                <div style={{ position: "absolute", top: -26, left: "50%", transform: "translateX(-50%)" }}>
                  <Pill tone="lime" size={22}>Обложка</Pill>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1560, left: 80, right: 80, display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center" }}>
        <Pop delay={60} from="scale">
          <Pill tone="cream" size={30}>#шашлык</Pill>
        </Pop>
        <Pop delay={66} from="scale">
          <Pill tone="blue" size={30}>#alias</Pill>
        </Pop>
        <Pop delay={72} from="scale">
          <Pill tone="panel" size={30}>
            <Icon name="photo_library" size={34} /> {count} фото
          </Pill>
        </Pop>
      </div>
      <Pop delay={100} from="up" style={{ position: "absolute", top: 1700, left: 80, right: 80 }}>
        <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 32, color: color.muted }}>После тусы остаются архив и итоги вечера</div>
      </Pop>
    </AbsoluteFill>
  );
};

const Koins: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ease(frame, 30, 70, [0, 0.6]);
  const b = ease(frame, 30, 70, [0, 0.4]);
  const xp = ease(frame, 80, 130, [0.35, 0.82]);
  return (
    <AbsoluteFill>
      <Backdrop glow="lime" />
      <Headline index="07" label="KOINS и профиль" text={"Пари между своими.\nИстория остаётся."} highlight={["своими", "остаётся"]} size={64} />
      <div style={{ position: "absolute", top: 520, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 56 }}>
        <Pop delay={10} from="left" distance={300}>
          <Card style={{ padding: 34, display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Icon name="toll" size={50} style={{ color: color.lime }} />
              <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 38, color: color.fg }}>Кто выиграет Alias?</div>
            </div>
            {[
              { n: "Команда Дана", v: a, k: 120, t: color.lime },
              { n: "Команда Амир", v: b, k: 80, t: color.pink },
            ].map((o) => (
              <div key={o.n}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font.body, fontWeight: 800, fontSize: 30, color: color.fg, marginBottom: 10 }}>
                  <span>{o.n}</span>
                  <span style={{ color: o.t }}>{Math.round(o.k * (o.v / (o.k === 120 ? 0.6 : 0.4)))} KOINS</span>
                </div>
                <div style={{ height: 34, borderRadius: 999, background: color.panel, border: `3px solid ${color.ink}`, overflow: "hidden" }}>
                  <div style={{ width: `${o.v * 100}%`, height: "100%", background: o.t }} />
                </div>
              </div>
            ))}
            <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 26, color: color.gray }}>KOINS: виртуальная игровая валюта, не деньги</div>
          </Card>
        </Pop>
        <Pop delay={40} from="right" distance={300}>
          <Card tone="cream" style={{ padding: 34, display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <Avatar name="Дана" index={1} size={100} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 42 }}>Дана</div>
                <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 28, opacity: 0.7 }}>Профиль · XP · ачивки</div>
              </div>
              <Pill tone="lime" size={28}>+40 XP</Pill>
            </div>
            <div style={{ height: 34, borderRadius: 999, background: "rgba(18,18,24,.12)", border: `3px solid ${color.ink}`, overflow: "hidden" }}>
              <div style={{ width: `${xp * 100}%`, height: "100%", background: color.blueBright }} />
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {["Ивенты", "Игры", "Фото", "Покупки"].map((x, i) => (
                <Pop key={x} delay={90 + i * 6} from="scale">
                  <Pill tone={(["pink", "blue", "lime", "panel"] as const)[i]} size={24}>
                    {x}
                  </Pill>
                </Pop>
              ))}
            </div>
          </Card>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

const moduleList: { t: string; icon: string; tone: Tone }[] = [
  { t: "Ивент и RSVP", icon: "event", tone: "lime" },
  { t: "Чат", icon: "forum", tone: "blue" },
  { t: "32 режима", icon: "sports_esports", tone: "pink" },
  { t: "Покупки", icon: "shopping_cart", tone: "cream" },
  { t: "Галерея", icon: "photo_library", tone: "pink" },
  { t: "KOINS", icon: "toll", tone: "lime" },
  { t: "Профиль", icon: "person", tone: "blue" },
];

const Outro: React.FC = () => (
  <AbsoluteFill>
    <Backdrop glow="blue" />
    <AbsoluteFill style={{ padding: "0 70px 240px", justifyContent: "center", gap: 64 }}>
      <Kinetic text={"Всё это\nпо одной ссылке."} size={96} highlight={["одной", "ссылке"]} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {moduleList.map((m, i) => (
          <Pop key={m.t} delay={14 + i * 5} from="scale">
            <Pill tone={m.tone} size={36}>
              <Icon name={m.icon} size={42} /> {m.t}
            </Pill>
          </Pop>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40, marginTop: 20 }}>
        <Pop delay={56} from="scale">
          <Logo width={600} />
        </Pop>
        <Pop delay={68}>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 76, color: color.fg, letterSpacing: -1 }}>tusa.game</div>
        </Pop>
        <Pop delay={78}>
          <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 32, color: color.muted, textAlign: "center" }}>Бета бесплатно · RU / EN · работает в браузере</div>
        </Pop>
      </div>
    </AbsoluteFill>
    <Ticker items={["СОЗДАЙ", "ПОЗОВИ", "ИГРАЙ", "СОХРАНИ"]} tone="pink" style={{ bottom: 90 }} rotate={3} />
    <Flash at={0} duration={8} />
  </AbsoluteFill>
);

export const FEATURE_SCENES = [100, 180, 180, 150, 180, 150, 150, 150, 150, 180];
export const FEATURES_DURATION = FEATURE_SCENES.reduce((a, b) => a + b, 0) - (FEATURE_SCENES.length - 1) * T;

const scenes: React.FC[] = [Intro, Create, Invite, Chat, Shopping, GamesWall, StageMode, Gallery, Koins, Outro];
type Kind = "wipe-bottom" | "wipe-corner" | "slide-right" | "slide-bottom" | "fade";
const kinds: Kind[] = ["wipe-bottom", "slide-right", "slide-right", "slide-right", "wipe-corner", "slide-bottom", "slide-right", "slide-right", "fade"];
const timing = linearTiming({ durationInFrames: T });

function transition(kind: Kind, key: string) {
  if (kind === "wipe-bottom") return <TransitionSeries.Transition key={key} presentation={wipe({ direction: "from-bottom" })} timing={timing} />;
  if (kind === "wipe-corner") return <TransitionSeries.Transition key={key} presentation={wipe({ direction: "from-top-left" })} timing={timing} />;
  if (kind === "slide-bottom") return <TransitionSeries.Transition key={key} presentation={slide({ direction: "from-bottom" })} timing={timing} />;
  if (kind === "fade") return <TransitionSeries.Transition key={key} presentation={fade()} timing={timing} />;
  return <TransitionSeries.Transition key={key} presentation={slide({ direction: "from-right" })} timing={timing} />;
}

export const Features: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: color.bg }}>
    <TransitionSeries>
      {scenes.flatMap((Scene, i) => [
        ...(i > 0 ? [transition(kinds[i - 1], `t${i}`)] : []),
        <TransitionSeries.Sequence key={`s${i}`} durationInFrames={FEATURE_SCENES[i]}>
          <Scene />
        </TransitionSeries.Sequence>,
      ])}
    </TransitionSeries>
  </AbsoluteFill>
);
