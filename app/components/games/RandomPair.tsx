"use client";

import { useMemo } from "react";
import { useMultiplayerGame } from "@/app/components/useMultiplayerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const challengesEn = [
  "Take a photo together like an album cover.",
  "Come up with a secret handshake in one minute.",
  "Guess 3 facts about each other.",
  "Make a mini playlist of 3 songs together.",
  "Compliment each other for 30 seconds straight.",
  "Do a synchronized dance move on the count of 3.",
  "Teach each other something new in 60 seconds.",
  "Create a short jingle about your pair.",
  "Find 3 things you have in common.",
  "Draw a portrait of each other in 30 seconds.",
  "Plan a dream trip together in 2 minutes.",
  "Swap a skill — teach each other something.",
  "Invent a secret code word only you two know.",
  "Do a trust fall exercise.",
  "Tell each other a life goal and swear to check in.",
  "Create a fictional business together in 60 seconds.",
  "Perform a 10-second skit as a pair.",
  "Compliment each other's best feature.",
  "Find a song you both like in 30 seconds.",
  "Mirror each other's movements for 30 seconds.",
  "Create a superhero duo name and pose.",
  "Guess each other's phone password in 3 tries.",
  "Share your most recent photo and explain it.",
  "Do a blindfolded trust walk across the room.",
  "Debate a silly topic for 30 seconds each side.",
  "Create a 5-second commercial for your pair.",
  "Whisper a secret to each other.",
  "Do a synchronized clap pattern.",
  "Swap shoes and wear them for the next round.",
  "High-five as dramatically as possible.",
  "Share a childhood memory with each other.",
  "Predict 3 things about each other's future.",
  "Come up with a duo catchphrase.",
  "Do a staring contest for 15 seconds.",
  "Take a silly selfie together.",
  "Rate each other's vibe on a scale of 1-10.",
  "Interviews each other for 30 seconds like a talk show.",
  "Try to make each other laugh without touching.",
  "Give each other a genuine compliment.",
  "Create a 30-second TikTok-style video together.",
  "Do a simultaneous dramatic pose.",
  "Share your current phone wallpaper and explain it.",
];

const challengesRu = [
  "Сделайте совместное фото как обложку альбома.", "Придумайте секретное рукопожатие за минуту.", "Угадайте по 3 факта друг о друге.",
  "Соберите общий плейлист из трёх песен.", "Говорите друг другу комплименты 30 секунд.", "Синхронно станцуйте на счёт три.",
  "Научите друг друга чему-то за 60 секунд.", "Сочините короткий джингл о вашей паре.", "Найдите 3 общие вещи.",
  "Нарисуйте портреты друг друга за 30 секунд.", "Спланируйте идеальную поездку за 2 минуты.", "Поменяйтесь навыками и чему-то научите.",
  "Придумайте кодовое слово только для вас двоих.", "Расскажите друг другу цель и договоритесь напомнить о ней.",
  "Создайте вымышленный бизнес за 60 секунд.", "Разыграйте сценку на 10 секунд.", "Найдите песню, которая нравится обоим.",
  "Повторяйте движения друг друга 30 секунд.", "Придумайте название и позу для супергеройского дуэта.", "Снимите смешное селфи вместе.",
  "Поделитесь воспоминанием из детства.", "Придумайте фирменную фразу дуэта.", "Устройте гляделки на 15 секунд.",
  "Рассмешите друг друга, не прикасаясь.", "Сделайте совместную драматичную позу."
];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

type PairState = { players: string[]; pairs: Array<[string, string]>; challenge: string; hasMade: boolean; challengeIndex: number };

export default function RandomPair({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale, t } = useLocale();
  const isHost = role === "stage";
  const { state, setState } = useMultiplayerGame<PairState>(sessionId ?? null, () => ({ players: [""], pairs: [], challenge: challengesEn[0], hasMade: false, challengeIndex: 0 }));
  const shuffledChallenges = useMemo(() => shuffle(locale === "ru" ? challengesRu : challengesEn), [locale]);

  function addPlayer() { if (!isHost) return; setState((prev) => ({ ...prev, players: [...prev.players, ""] })); }
  function updatePlayer(idx: number, name: string) { if (!isHost) return; setState((prev) => { const n = [...prev.players]; n[idx] = name; return { ...prev, players: n }; }); }
  function removePlayer(idx: number) { if (!isHost) return; setState((prev) => ({ ...prev, players: prev.players.filter((_, i) => i !== idx) })); }

  function make() {
    if (!isHost) return;
    const names = shuffle(state.players.map((p) => p.trim()).filter(Boolean));
    const nextPairs: Array<[string, string]> = [];
    for (let i = 0; i < names.length; i += 2) nextPairs.push([names[i], names[i + 1] ?? (locale === "ru" ? "Без пары" : "Free agent")]);
    setState((prev) => ({ ...prev, pairs: nextPairs, challenge: shuffledChallenges[prev.challengeIndex % shuffledChallenges.length], challengeIndex: prev.challengeIndex + 1, hasMade: true }));
  }

  if (!state.hasMade) return <div className="party-game-board game-board-enter"><span className="game-step">{t("pairsTitle")}</span><p>{t("pairsDesc")}</p>{isHost && <><div className="mafia-players">{state.players.map((name, idx) => <div key={idx} className="mafia-player-row"><input value={name} onChange={(e) => updatePlayer(idx, e.target.value)} placeholder={`${locale === "ru" ? "Игрок" : "Player"} ${idx + 1}`} />{state.players.length > 1 && <button onClick={() => removePlayer(idx)} type="button">×</button>}</div>)}</div><div className="game-primary-actions"><button className="demo-action demo-action--white" onClick={addPlayer} type="button">+ {locale === "ru" ? "Игрок" : "Player"}</button><button className="demo-action demo-action--lime" disabled={state.players.filter((p) => p.trim()).length < 2} onClick={make} type="button">{t("pairsMake")} <span className="material-symbols-rounded">shuffle</span></button></div></>}{!isHost && <p style={{ opacity: 0.6 }}>{t("controllerWaiting")}</p>}{sessionId && <span className="multiplayer-badge">LIVE</span>}</div>;

  return <div className="party-game-board game-board-enter"><span className="game-step">{t("pairsTitle")}</span><h3 className="game-prompt-swap" key={state.challenge}>{state.challenge}</h3><div className="pairs-grid">{state.pairs.map(([first, second], idx) => <article key={`${first}-${second}`} className="pair-card-pop" style={{"--pair-delay": `${idx * 70}ms`} as React.CSSProperties}><strong>{first}</strong><span className="material-symbols-rounded">handshake</span><strong>{second}</strong></article>)}</div>{isHost && <div className="game-primary-actions"><button className="demo-action demo-action--lime" onClick={make} type="button"><span className="material-symbols-rounded">shuffle</span> {t("pairsShuffle")}</button><button className="demo-action demo-action--white" onClick={() => onSave(state.pairs.length)} type="button">{t("pairsSave")}</button></div>}{sessionId && <span className="multiplayer-badge">LIVE</span>}</div>;
}
