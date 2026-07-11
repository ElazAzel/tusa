"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlatform } from "../PlatformContext";
import { Icon } from "./Icon";
import { useLocale } from "@/app/components/LocaleProvider";

type GameId = "alias" | "mafia" | "truth" | "never" | "beer" | "quiz" | "pairs" | "uno";

const aliasWords = ["Шашлык", "Караоке", "Краш", "Будильник", "Алматы", "Мем", "Пятница", "Домофон", "Плейлист"];
const truths = ["Кого из этой компании ты позвал бы в путешествие первым?", "Какой самый нелепый повод ты использовал, чтобы уйти с тусы?", "Какая песня у тебя guilty pleasure?", "Кому здесь ты доверишь пароль от телефона?"];
const dares = ["Сделай трейлер этой тусы голосом кинодиктора.", "Станцуй 15 секунд без музыки.", "Отправь последнему собеседнику стикер без контекста.", "Придумай каждому в комнате сценическое имя."];
const neverPrompts = ["Я никогда не засыпал на тусе.", "Я никогда не писал бывшим после полуночи.", "Я никогда не пел караоке трезвым.", "Я никогда не забывал имя человека сразу после знакомства."];
const pairChallenges = ["Сделайте общее фото как обложку альбома.", "За минуту придумайте секретное рукопожатие.", "Угадайте по три факта друг о друге.", "Соберите мини-плейлист из трёх треков."];
const quizQuestions = [
  { question: "Столица Казахстана?", options: ["Алматы", "Астана", "Шымкент", "Караганда"], answer: "Астана" },
  { question: "Сколько минут в полутора часах?", options: ["75", "80", "90", "100"], answer: "90" },
  { question: "Какой цвет получается из синего и жёлтого?", options: ["Фиолетовый", "Оранжевый", "Зелёный", "Розовый"], answer: "Зелёный" },
  { question: "В каком году появился первый iPhone?", options: ["2005", "2007", "2009", "2011"], answer: "2007" },
];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function GamesHub() {
  const { event, updateEvent, gainXp, notify } = usePlatform();
  const { t } = useLocale();
  const games: Array<{ id: GameId; title: string; description: string; icon: string; players: string; tone: string }> = [
    { id: "alias", title: "Alias", description: t("gamesAliasDesc"), icon: "record_voice_over", players: "4+", tone: "lime" },
    { id: "mafia", title: "Mafia Lite", description: t("gamesMafiaDesc"), icon: "mystery", players: "5+", tone: "pink" },
    { id: "truth", title: "Truth or Dare", description: t("gamesTruthDesc"), icon: "casino", players: "2+", tone: "blue" },
    { id: "never", title: "Never Have I Ever", description: t("gamesNeverDesc"), icon: "front_hand", players: "3+", tone: "cream" },
    { id: "beer", title: "Beer Pong", description: t("gamesBeerDesc"), icon: "sports_bar", players: "2+", tone: "pink" },
    { id: "quiz", title: "Quiz Battle", description: t("gamesQuizDesc"), icon: "quiz", players: "2+", tone: "lime" },
    { id: "pairs", title: "Random Pair", description: t("gamesPairsDesc"), icon: "shuffle", players: "4+", tone: "blue" },
    { id: "uno", title: "Uno Tracker", description: t("gamesUnoDesc"), icon: "style", players: "2+", tone: "cream" },
  ];
  const [selected, setSelected] = useState<GameId | null>(null);
  const [aliasRunning, setAliasRunning] = useState(false);
  const [aliasSeconds, setAliasSeconds] = useState(60);
  const [aliasWord, setAliasWord] = useState(0);
  const [aliasScore, setAliasScore] = useState(0);
  const [mafiaRoles, setMafiaRoles] = useState<Array<{ name: string; role: string }>>([]);
  const [mafiaIndex, setMafiaIndex] = useState(0);
  const [mafiaReveal, setMafiaReveal] = useState(false);
  const [truthMode, setTruthMode] = useState<"truth" | "dare">("truth");
  const [truthIndex, setTruthIndex] = useState(0);
  const [neverIndex, setNeverIndex] = useState(0);
  const [neverCount, setNeverCount] = useState(0);
  const [beerScore, setBeerScore] = useState<[number, number]>([10, 10]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [pairs, setPairs] = useState<Array<[string, string]>>([]);
  const [pairChallenge, setPairChallenge] = useState(pairChallenges[0]);
  const [unoScores, setUnoScores] = useState<Record<string, number>>(() => Object.fromEntries(event.participants.slice(0, 6).map((person) => [person.id, 0])));

  useEffect(() => {
    if (!aliasRunning) return;
    const timer = setTimeout(() => {
      if (aliasSeconds <= 1) {
        setAliasRunning(false);
        setAliasSeconds(60);
        notify(t("aliasTime"));
      } else {
        setAliasSeconds(aliasSeconds - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [aliasRunning, aliasSeconds, notify]);

  const leaderboard = useMemo(() => {
    const totals = new Map<string, number>();
    event.gameHistory.forEach((record) => totals.set(record.game, (totals.get(record.game) ?? 0) + record.score));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [event.gameHistory]);

  function saveResult(game: string, score: number, summary: string) {
    updateEvent((current) => ({
      ...current,
      gameHistory: [{ id: `game_${Date.now()}`, game, score, summary, createdAt: new Date().toISOString() }, ...current.gameHistory].slice(0, 30),
    }));
    gainXp(Math.max(5, score * 2), `${game}: результат сохранён`);
  }

  function aliasAnswer(guessed: boolean) {
    if (!aliasRunning) return;
    if (guessed) setAliasScore((score) => score + 1);
    setAliasWord((word) => (word + 1) % aliasWords.length);
  }

  function startMafia() {
    const players = event.participants.filter((person) => person.rsvp !== "pass");
    if (players.length < 5) {
      notify(t("mafiaNeedPlayers"));
      return;
    }
    const roles = shuffle(["Мафия", "Доктор", "Шериф", ...Array(Math.max(0, players.length - 3)).fill("Мирный")]);
    setMafiaRoles(shuffle(players).map((person, index) => ({ name: person.name, role: roles[index] })));
    setMafiaIndex(0);
    setMafiaReveal(false);
  }

  function nextMafiaPlayer() {
    if (mafiaIndex >= mafiaRoles.length - 1) {
      saveResult("Mafia Lite", mafiaRoles.length, `${mafiaRoles.length} ${t("mafiaRolesDealt")}`);
      setMafiaIndex(0);
      setMafiaReveal(false);
      notify(t("mafiaRolesDone"));
      return;
    }
    setMafiaIndex((index) => index + 1);
    setMafiaReveal(false);
  }

  function makePairs() {
    const names = shuffle(event.participants.filter((person) => person.rsvp !== "pass").map((person) => person.name));
    const nextPairs: Array<[string, string]> = [];
    for (let index = 0; index < names.length; index += 2) nextPairs.push([names[index], names[index + 1] ?? "Свободный игрок"]);
    setPairs(nextPairs);
    setPairChallenge(pairChallenges[Math.floor(Math.random() * pairChallenges.length)]);
  }

  function resetUnoPlayers() {
    setUnoScores(Object.fromEntries(event.participants.filter((person) => person.rsvp !== "pass").slice(0, 8).map((person) => [person.id, 0])));
    notify(t("unoTableReset"));
  }

  if (!selected) {
    return (
      <section className="demo-tab-panel games-catalogue-panel game-screen-enter">
        <div className="demo-panel-title"><div><span>{t("gamesCatalogue")}</span><h2>{t("gamesTitle")}</h2></div><span className="demo-chip">{event.gameHistory.length}{t("gamesSessions")}</span></div>
        <div className="game-catalogue-grid">
          {games.map((game) => (
            <button className={`game-launch-card ${game.tone} game-card-enter`} key={game.id} onClick={() => setSelected(game.id)} style={{ "--game-delay": `${games.indexOf(game) * 55}ms` } as React.CSSProperties} type="button">
              <Icon name={game.icon} /><span className="game-player-count">{game.players}</span><h3>{game.title}</h3><p>{game.description}</p><strong>{t("gamesLaunch")} <Icon name="arrow_forward" /></strong>
            </button>
          ))}
        </div>
        <section className="game-history-card">
          <div><span>{t("gamesLeaderboard")}</span><h3>{t("gamesLeaderboardSub")}</h3></div>
          {leaderboard.length ? <ol>{leaderboard.map(([game, score]) => <li key={game}><span>{game}</span><strong>{score}</strong></li>)}</ol> : <p>{t("gamesEmpty")}</p>}
        </section>
      </section>
    );
  }

  const game = games.find((item) => item.id === selected)!;

  return (
    <section className="demo-tab-panel game-active-panel game-screen-enter">
      <div className="active-game-head"><button onClick={() => setSelected(null)} type="button"><Icon name="arrow_back" /> {t("gamesBack")}</button><div><span>{t("gamesMode")}</span><h2>{game.title}</h2></div><span className="demo-chip">{game.players}{t("gamesPlayers")}</span></div>

      {selected === "alias" && (
        <div className={`alias-board ${aliasRunning ? "is-running" : ""}`}>
          <div className="alias-timer" aria-label={`${aliasSeconds} секунд`}>{aliasSeconds}<small>сек</small></div>
          <p>{t("aliasExplain")}</p><strong className="game-word-pop" key={`word-${aliasWord}`}>{aliasWords[aliasWord]}</strong>
          <div className="alias-score" key={`score-${aliasScore}`}>{t("aliasScore")}{aliasScore}</div>
          <div className="alias-actions"><button disabled={!aliasRunning} onClick={() => aliasAnswer(false)} type="button"><Icon name="close" /> {t("aliasSkip")}</button><button disabled={!aliasRunning} onClick={() => aliasAnswer(true)} type="button"><Icon name="check" /> {t("aliasGuessed")}</button></div>
          <div className="game-primary-actions"><button className="demo-action demo-action--lime" onClick={() => setAliasRunning((running) => !running)} type="button"><Icon name={aliasRunning ? "pause" : "play_arrow"} /> {aliasRunning ? t("aliasPause") : aliasScore ? t("aliasContinue") : t("aliasStart")}</button><button className="demo-action demo-action--white" disabled={!aliasScore} onClick={() => saveResult("Alias", aliasScore, `${aliasScore} ${t("aliasWordsGuessed")}`)} type="button"><Icon name="save" /> {t("aliasSave")}</button></div>
        </div>
      )}

      {selected === "mafia" && (
        <div className="party-game-board mafia-board game-board-enter">
          {!mafiaRoles.length ? <><Icon name="mystery" /><h3>{t("mafiaTitle")}</h3><p>{t("mafiaDesc")}</p><button className="demo-action demo-action--lime" onClick={startMafia} type="button">{t("mafiaDeal")}</button></> : <><span className="game-step">{t("mafiaPlayer")}{mafiaIndex + 1}/{mafiaRoles.length}</span><h3>{mafiaRoles[mafiaIndex].name}</h3>{mafiaReveal ? <div className="secret-role">{mafiaRoles[mafiaIndex].role}</div> : <button className="secret-cover" onClick={() => setMafiaReveal(true)} type="button"><Icon name="visibility" /> {t("mafiaShowRole")}</button>}<button className="demo-action demo-action--lime" disabled={!mafiaReveal} onClick={nextMafiaPlayer} type="button">{t("mafiaHidePass")} <Icon name="arrow_forward" /></button></>}
        </div>
      )}

      {selected === "truth" && (
        <div className="party-game-board truth-board game-board-enter">
          <div className="mode-switch"><button className={truthMode === "truth" ? "active" : ""} onClick={() => setTruthMode("truth")} type="button">{t("truthTitle")}</button><button className={truthMode === "dare" ? "active" : ""} onClick={() => setTruthMode("dare")} type="button">{t("truthDare")}</button></div>
          <span className="game-step">{truthMode === "truth" ? t("truthHonest") : t("truthNoBail")}</span><h3 className="game-prompt-swap" key={`${truthMode}-${truthIndex}`}>{(truthMode === "truth" ? truths : dares)[truthIndex % (truthMode === "truth" ? truths.length : dares.length)]}</h3>
          <div className="game-primary-actions"><button className="demo-action demo-action--lime" onClick={() => setTruthIndex((index) => index + 1)} type="button">{t("truthNext")} <Icon name="refresh" /></button><button className="demo-action demo-action--white" onClick={() => saveResult("Truth or Dare", truthIndex + 1, `${truthIndex + 1} ${t("truthCardsPlayed")}`)} type="button">{t("truthFinish")}</button></div>
        </div>
      )}

      {selected === "never" && (
        <div className="party-game-board never-board game-board-enter">
          <span className="game-step">{t("neverHeader")}</span><h3 className="game-prompt-swap" key={`prompt-${neverIndex}`}>{neverPrompts[neverIndex % neverPrompts.length]}</h3><strong className="confession-count" key={`confessions-${neverCount}`}>{neverCount}{t("neverConfessions")}</strong>
          <div className="game-primary-actions"><button className="demo-action demo-action--white" onClick={() => setNeverIndex((index) => index + 1)} type="button">{t("neverSkip")}</button><button className="demo-action demo-action--lime" onClick={() => { setNeverCount((count) => count + 1); setNeverIndex((index) => index + 1); }} type="button">{t("neverMe")}</button><button className="demo-action demo-action--dark" onClick={() => saveResult("Never Have I Ever", neverCount, `${neverCount} ${t("neverConfessions")}`)} type="button">{t("neverSave")}</button></div>
        </div>
      )}

      {selected === "beer" && (
        <div className="party-game-board beer-board game-board-enter">
          <span className="game-step">{t("beerRemaining")}</span><div className="beer-teams"><div><label>{t("beerTeamA")}</label><strong className="score-bump" key={`team-a-${beerScore[0]}`}>{beerScore[0]}</strong><div><button onClick={() => setBeerScore(([a, b]) => [Math.max(0, a - 1), b])} type="button">{t("beerHit")}</button><button onClick={() => setBeerScore(([a, b]) => [Math.min(10, a + 1), b])} type="button">{t("beerReturn")}</button></div></div><b>VS</b><div><label>{t("beerTeamB")}</label><strong className="score-bump" key={`team-b-${beerScore[1]}`}>{beerScore[1]}</strong><div><button onClick={() => setBeerScore(([a, b]) => [a, Math.max(0, b - 1)])} type="button">{t("beerHit")}</button><button onClick={() => setBeerScore(([a, b]) => [a, Math.min(10, b + 1)])} type="button">{t("beerReturn")}</button></div></div></div>
          <button className="demo-action demo-action--lime" onClick={() => saveResult("Beer Pong", 20 - beerScore[0] - beerScore[1], `${t("beerFinal")}${beerScore[0]}:${beerScore[1]}`)} type="button">{t("beerSave")}</button>
        </div>
      )}

      {selected === "quiz" && (
        <div className="party-game-board quiz-board game-board-enter">
          <span className="game-step">{t("quizQuestion")}{quizIndex + 1}/{quizQuestions.length}</span><h3>{quizQuestions[quizIndex].question}</h3><div className="quiz-options">{quizQuestions[quizIndex].options.map((option) => <button className={quizAnswer === option ? (option === quizQuestions[quizIndex].answer ? "correct" : "wrong") : ""} disabled={Boolean(quizAnswer)} key={option} onClick={() => { setQuizAnswer(option); if (option === quizQuestions[quizIndex].answer) setQuizScore((score) => score + 1); }} type="button">{option}</button>)}</div>{quizAnswer && <p className="quiz-feedback">{quizAnswer === quizQuestions[quizIndex].answer ? t("quizCorrect") : `${t("quizWrong")}${quizQuestions[quizIndex].answer}`}</p>}<button className="demo-action demo-action--lime" disabled={!quizAnswer} onClick={() => { if (quizIndex === quizQuestions.length - 1) { saveResult("Quiz Battle", quizScore, `${quizScore}/${quizQuestions.length}`); setQuizIndex(0); } else setQuizIndex((index) => index + 1); setQuizAnswer(""); }} type="button">{quizIndex === quizQuestions.length - 1 ? t("quizFinish") : t("quizNext")}</button>
        </div>
      )}

      {selected === "pairs" && (
        <div className="party-game-board pairs-board game-board-enter">
          <span className="game-step">{t("pairsTitle")}</span><h3 className="game-prompt-swap" key={pairChallenge}>{pairChallenge}</h3>{pairs.length ? <div className="pairs-grid">{pairs.map(([first, second], index) => <article className="pair-card-pop" key={`${first}-${second}`} style={{ "--pair-delay": `${index * 70}ms` } as React.CSSProperties}><strong>{first}</strong><Icon name="handshake" /><strong>{second}</strong></article>)}</div> : <p>{t("pairsDesc")}</p>}<div className="game-primary-actions"><button className="demo-action demo-action--lime" onClick={makePairs} type="button"><Icon name="shuffle" /> {pairs.length ? t("pairsShuffle") : t("pairsMake")}</button><button className="demo-action demo-action--white" disabled={!pairs.length} onClick={() => saveResult("Random Pair", pairs.length, pairChallenge)} type="button">{t("pairsSave")}</button></div>
        </div>
      )}

      {selected === "uno" && (
        <div className="party-game-board uno-board game-board-enter">
          <span className="game-step">{t("unoTitle")}</span><h3>{t("unoSub")}</h3><div className="uno-list">{Object.entries(unoScores).map(([id, score]) => { const person = event.participants.find((item) => item.id === id); return <article key={id}><strong>{person?.name ?? id}</strong><div><button onClick={() => setUnoScores((current) => ({ ...current, [id]: Math.max(0, score - 10) }))} type="button">−10</button><span className="score-bump" key={`uno-${id}-${score}`}>{score}</span><button onClick={() => setUnoScores((current) => ({ ...current, [id]: score + 10 }))} type="button">+10</button><button onClick={() => setUnoScores((current) => ({ ...current, [id]: score + 50 }))} type="button">+50</button></div></article>; })}</div><div className="game-primary-actions"><button className="demo-action demo-action--white" onClick={resetUnoPlayers} type="button">{t("unoReset")}</button><button className="demo-action demo-action--lime" onClick={() => { const winner = Object.entries(unoScores).sort((a, b) => a[1] - b[1])[0]; saveResult("Uno Tracker", winner?.[1] ?? 0, `${t("unoLeader")}${event.participants.find((person) => person.id === winner?.[0])?.name ?? "—"}`); }} type="button">{t("unoSave")}</button></div>
        </div>
      )}
    </section>
  );
}
