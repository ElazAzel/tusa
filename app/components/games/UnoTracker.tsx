"use client";

import { useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";
import { useMultiplayerGame } from "@/app/components/useMultiplayerGame";

type UnoColor = "red" | "yellow" | "green" | "blue";
type UnoKind = "number" | "skip" | "reverse" | "draw2" | "wild" | "wild4";
type UnoCard = {
  id: string;
  color: UnoColor | null;
  kind: UnoKind;
  value?: number;
};

const COLORS: UnoColor[] = ["red", "yellow", "green", "blue"];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function createDeck(): UnoCard[] {
  let serial = 0;
  const deck: UnoCard[] = [];
  for (const color of COLORS) {
    deck.push({
      id: `${color}-0-${serial++}`,
      color,
      kind: "number",
      value: 0,
    });
    for (let value = 1; value <= 9; value += 1) {
      for (let copy = 0; copy < 2; copy += 1)
        deck.push({
          id: `${color}-${value}-${serial++}`,
          color,
          kind: "number",
          value,
        });
    }
    for (const kind of ["skip", "reverse", "draw2"] as const) {
      for (let copy = 0; copy < 2; copy += 1)
        deck.push({ id: `${color}-${kind}-${serial++}`, color, kind });
    }
  }
  for (let copy = 0; copy < 4; copy += 1) {
    deck.push({ id: `wild-${serial++}`, color: null, kind: "wild" });
    deck.push({ id: `wild4-${serial++}`, color: null, kind: "wild4" });
  }
  return shuffle(deck);
}

function cardLabel(card: UnoCard) {
  if (card.kind === "number") return String(card.value);
  if (card.kind === "skip") return "⊘";
  if (card.kind === "reverse") return "↺";
  if (card.kind === "draw2") return "+2";
  if (card.kind === "wild4") return "+4";
  return "W";
}

function cardScore(card: UnoCard) {
  if (card.kind === "number") return card.value ?? 0;
  if (card.kind === "wild" || card.kind === "wild4") return 50;
  return 20;
}

function canPlay(
  card: UnoCard,
  top: UnoCard,
  activeColor: UnoColor,
  hand: UnoCard[] = [],
) {
  if (card.kind === "wild4" && hand.some((item) => item.color === activeColor))
    return false;
  if (!card.color) return true;
  if (card.color === activeColor) return true;
  if (card.kind === top.kind && card.kind !== "number") return true;
  return (
    card.kind === "number" && top.kind === "number" && card.value === top.value
  );
}

function nextPlayer(from: number, direction: 1 | -1, count: number, steps = 1) {
  return (((from + direction * steps) % count) + count) % count;
}

function takeCards(count: number, pile: UnoCard[], discarded: UnoCard[]) {
  const drawPile = [...pile];
  let discard = [...discarded];
  const cards: UnoCard[] = [];
  while (cards.length < count) {
    if (!drawPile.length && discard.length > 1) {
      const top = discard[discard.length - 1];
      drawPile.push(...shuffle(discard.slice(0, -1)));
      discard = [top];
    }
    const card = drawPile.pop();
    if (!card) break;
    cards.push(card);
  }
  return { cards, drawPile, discard };
}

export default function UnoTracker({
  onSave,
  sessionId,
}: {
  partyId: string;
  sessionId?: string | null;
  onSave: (score: number) => void;
}) {
  const { locale, t } = useLocale();
  const ru = locale === "ru";
  const copy = {
    player: ru ? "Игрок" : "Player",
    add: ru ? "Добавить игрока" : "Add player",
    start: ru ? "Раздать карты" : "Deal cards",
    turn: ru ? "Ход" : "Turn",
    cards: ru ? "карт" : "cards",
    show: ru ? "Показать мою руку" : "Show my hand",
    hideHint: ru
      ? "Передай устройство игроку и открой карты."
      : "Pass the device to the player, then reveal the cards.",
    draw: ru ? "Взять карту" : "Draw a card",
    pass: ru ? "Передать ход" : "Pass turn",
    color: ru ? "Выбери цвет" : "Choose a color",
    winner: ru ? "Победитель" : "Winner",
    points: ru ? "очков за раунд" : "round points",
    again: ru ? "Новый раунд" : "New round",
    finish: ru ? "Завершить игру" : "Finish game",
    uno: "UNO!",
    red: ru ? "Красный" : "Red",
    yellow: ru ? "Жёлтый" : "Yellow",
    green: ru ? "Зелёный" : "Green",
    blue: ru ? "Синий" : "Blue",
  };

  const [names, setNames] = useState<string[]>(["", ""]);
  const [players, setPlayers] = useState<string[]>([]);
  const [hands, setHands] = useState<UnoCard[][]>([]);
  const [drawPile, setDrawPile] = useState<UnoCard[]>([]);
  const [discard, setDiscard] = useState<UnoCard[]>([]);
  const [activeColor, setActiveColor] = useState<UnoColor>("red");
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [revealed, setRevealed] = useState(false);
  const [drawnCardId, setDrawnCardId] = useState<string | null>(null);
  const [pendingWild, setPendingWild] = useState<UnoCard | null>(null);
  const [winner, setWinner] = useState<{ name: string; points: number } | null>(
    null,
  );

  function addPlayer() {
    if (names.length < 6) setNames((value) => [...value, ""]);
  }

  function updatePlayer(index: number, name: string) {
    setNames((value) =>
      value.map((item, itemIndex) => (itemIndex === index ? name : item)),
    );
  }

  function removePlayer(index: number) {
    if (names.length > 2)
      setNames((value) => value.filter((_, itemIndex) => itemIndex !== index));
  }

  function startRound() {
    const nextPlayers = names.map(
      (name, index) => name.trim() || `${copy.player} ${index + 1}`,
    );
    const deck = createDeck();
    const nextHands = nextPlayers.map(() => [] as UnoCard[]);
    for (let round = 0; round < 7; round += 1) {
      nextHands.forEach((hand) => {
        const card = deck.pop();
        if (card) hand.push(card);
      });
    }
    const starterIndex = deck.findIndex((card) => card.kind === "number");
    const starter = deck.splice(starterIndex >= 0 ? starterIndex : 0, 1)[0];
    setPlayers(nextPlayers);
    setHands(nextHands);
    setDrawPile(deck);
    setDiscard([starter]);
    setActiveColor(starter.color ?? "red");
    setCurrent(0);
    setDirection(1);
    setRevealed(false);
    setDrawnCardId(null);
    setPendingWild(null);
    setWinner(null);
  }

  function advance(steps = 1, nextDirection = direction) {
    setCurrent((value) =>
      nextPlayer(value, nextDirection, players.length, steps),
    );
    setRevealed(false);
    setDrawnCardId(null);
  }

  function commitCard(card: UnoCard, chosenColor: UnoColor) {
    const nextHands = hands.map((hand) => [...hand]);
    nextHands[current] = nextHands[current].filter(
      (item) => item.id !== card.id,
    );
    let nextPile = [...drawPile];
    let nextDiscard = [...discard, card];
    let nextDirection = direction;
    let steps = 1;

    if (card.kind === "reverse") {
      nextDirection = direction === 1 ? -1 : 1;
      steps = players.length === 2 ? 2 : 1;
    } else if (card.kind === "skip") {
      steps = 2;
    } else if (card.kind === "draw2" || card.kind === "wild4") {
      const target = nextPlayer(current, direction, players.length);
      const taken = takeCards(
        card.kind === "draw2" ? 2 : 4,
        nextPile,
        nextDiscard,
      );
      nextHands[target].push(...taken.cards);
      nextPile = taken.drawPile;
      nextDiscard = taken.discard;
      steps = 2;
    }

    setHands(nextHands);
    setDrawPile(nextPile);
    setDiscard(nextDiscard);
    setActiveColor(chosenColor);
    setDirection(nextDirection);
    setPendingWild(null);
    setDrawnCardId(null);

    if (!nextHands[current].length) {
      const points = nextHands.reduce(
        (sum, hand, index) =>
          index === current
            ? sum
            : sum + hand.reduce((total, item) => total + cardScore(item), 0),
        0,
      );
      setWinner({ name: players[current], points });
      onSave(points);
      setRevealed(true);
      return;
    }

    setCurrent(nextPlayer(current, nextDirection, players.length, steps));
    setRevealed(false);
  }

  function play(card: UnoCard) {
    const top = discard[discard.length - 1];
    if (!top || !canPlay(card, top, activeColor, hand)) return;
    if (drawnCardId && card.id !== drawnCardId) return;
    if (!card.color) {
      setPendingWild(card);
      return;
    }
    commitCard(card, card.color);
  }

  function draw() {
    const taken = takeCards(1, drawPile, discard);
    if (!taken.cards.length) return advance();
    const card = taken.cards[0];
    const nextHands = hands.map((hand) => [...hand]);
    nextHands[current].push(card);
    setHands(nextHands);
    setDrawPile(taken.drawPile);
    setDiscard(taken.discard);
    if (
      canPlay(
        card,
        taken.discard[taken.discard.length - 1],
        activeColor,
        nextHands[current],
      )
    ) {
      setDrawnCardId(card.id);
    } else {
      advance();
    }
  }

  function finish() {
    setPlayers([]);
    setHands([]);
    setDiscard([]);
    setWinner(null);
  }

  if (!players.length) {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("unoTitle")}</span>
        <h3>{t("unoSub")}</h3>
        <div className="mafia-players">
          {names.map((name, index) => (
            <div key={index} className="mafia-player-row">
              <input
                value={name}
                onChange={(event) => updatePlayer(index, event.target.value)}
                placeholder={`${copy.player} ${index + 1}`}
                maxLength={28}
              />
              {names.length > 2 && (
                <button
                  aria-label={ru ? "Удалить игрока" : "Remove player"}
                  onClick={() => removePlayer(index)}
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="game-primary-actions">
          <button
            className="demo-action demo-action--white"
            disabled={names.length >= 6}
            onClick={addPlayer}
            type="button"
          >
            + {copy.add}
          </button>
          <button
            className="demo-action demo-action--lime"
            onClick={startRound}
            type="button"
          >
            {copy.start}
          </button>
        </div>
      </div>
    );
  }

  const top = discard[discard.length - 1];
  const hand = hands[current] ?? [];

  if (winner) {
    return (
      <div className="party-game-board uno-game game-board-enter">
        <span className="game-step">{copy.uno}</span>
        <h3>
          {copy.winner}: {winner.name}
        </h3>
        <strong className="confession-count">
          {winner.points} {copy.points}
        </strong>
        <div className="game-primary-actions">
          <button
            className="demo-action demo-action--white"
            onClick={startRound}
            type="button"
          >
            {copy.again}
          </button>
          <button
            className="demo-action demo-action--lime"
            onClick={finish}
            type="button"
          >
            {copy.finish}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="party-game-board uno-game game-board-enter">
      <div className="uno-scoreboard">
        {players.map((player, index) => (
          <span className={index === current ? "active" : ""} key={player}>
            <b>{player}</b>
            <small>
              {hands[index]?.length ?? 0} {copy.cards}
            </small>
          </span>
        ))}
      </div>

      <div className="uno-table">
        <button
          className="uno-pile uno-pile--draw"
          onClick={draw}
          disabled={!revealed || Boolean(drawnCardId)}
          type="button"
          aria-label={copy.draw}
        >
          <span>TUSA</span>
          <b>UNO</b>
        </button>
        {top && (
          <div
            className={`uno-card uno-card--${top.color ?? "wild"} uno-card--top`}
            aria-label={cardLabel(top)}
          >
            <small>{cardLabel(top)}</small>
            <strong>{cardLabel(top)}</strong>
            <small>{cardLabel(top)}</small>
          </div>
        )}
        <div className={`uno-active-color uno-active-color--${activeColor}`}>
          <span />
          {copy[activeColor]}
        </div>
      </div>

      <div className="uno-turn">
        <span>{copy.turn}</span>
        <h3>{players[current]}</h3>
        {hand.length === 1 && (
          <strong className="uno-callout">{copy.uno}</strong>
        )}
      </div>

      {!revealed ? (
        <button
          className="uno-reveal"
          onClick={() => setRevealed(true)}
          type="button"
        >
          <span className="material-symbols-rounded">visibility</span>
          <b>{copy.show}</b>
          <small>{copy.hideHint}</small>
        </button>
      ) : (
        <>
          <div
            className="uno-hand"
            aria-label={`${players[current]}: ${hand.length} ${copy.cards}`}
          >
            {hand.map((card) => {
              const playable =
                canPlay(card, top, activeColor, hand) &&
                (!drawnCardId || drawnCardId === card.id);
              return (
                <button
                  aria-label={`${copy[card.color ?? activeColor]} ${cardLabel(card)}`}
                  className={`uno-card uno-card--${card.color ?? "wild"} ${playable ? "is-playable" : ""}`}
                  disabled={!playable}
                  key={card.id}
                  onClick={() => play(card)}
                  type="button"
                >
                  <small>{cardLabel(card)}</small>
                  <strong>{cardLabel(card)}</strong>
                  <small>{cardLabel(card)}</small>
                </button>
              );
            })}
          </div>
          <div className="game-primary-actions">
            {!drawnCardId && (
              <button
                className="demo-action demo-action--white"
                onClick={draw}
                type="button"
              >
                {copy.draw}
              </button>
            )}
            {drawnCardId && (
              <button
                className="demo-action demo-action--white"
                onClick={() => advance()}
                type="button"
              >
                {copy.pass}
              </button>
            )}
          </div>
        </>
      )}

      {pendingWild && (
        <div
          className="uno-color-picker"
          role="dialog"
          aria-modal="true"
          aria-label={copy.color}
        >
          <strong>{copy.color}</strong>
          <div>
            {COLORS.map((color) => (
              <button
                aria-label={copy[color]}
                className={`uno-color uno-color--${color}`}
                key={color}
                onClick={() => commitCard(pendingWild, color)}
                type="button"
              >
                <span />
              </button>
            ))}
          </div>
        </div>
      )}
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}
