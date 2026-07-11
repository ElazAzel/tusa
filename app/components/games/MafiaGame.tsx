"use client";

import { useMultiplayerGame } from "@/app/components/useMultiplayerGame";
import { useLocale } from "@/app/components/LocaleProvider";

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

type MafiaState = { players: string[]; roles: Array<{ name: string; role: string }>; index: number; reveal: boolean };

export default function MafiaGame({ partyId, sessionId, onSave }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void }) {
  const { locale, t } = useLocale();
  const { state, setState } = useMultiplayerGame<MafiaState>(sessionId ?? null, () => ({ players: [""], roles: [], index: 0, reveal: false }));

  function addPlayer() { setState((prev) => ({ ...prev, players: [...prev.players, ""] })); }
  function updatePlayer(idx: number, name: string) { setState((prev) => { const n = [...prev.players]; n[idx] = name; return { ...prev, players: n }; }); }
  function removePlayer(idx: number) { setState((prev) => ({ ...prev, players: prev.players.filter((_, i) => i !== idx) })); }

  function deal() {
    const names = state.players.map((p) => p.trim()).filter(Boolean);
    if (names.length < 5) return;
    const roleNames = locale === "ru" ? ["Мафия", "Доктор", "Шериф", "Мирный житель"] : ["Mafia", "Doctor", "Sheriff", "Civilian"];
    const assigned = shuffle([roleNames[0], roleNames[1], roleNames[2], ...Array(Math.max(0, names.length - 3)).fill(roleNames[3])]);
    setState((prev) => ({ ...prev, roles: shuffle(names).map((n, i) => ({ name: n, role: assigned[i] })), index: 0, reveal: false }));
  }

  function next() {
    if (state.index >= state.roles.length - 1) { onSave(state.roles.length); setState((prev) => ({ ...prev, roles: [], players: [""] })); return; }
    setState((prev) => ({ ...prev, index: prev.index + 1, reveal: false }));
  }

  if (!state.roles.length) return <div className="party-game-board game-board-enter"><span className="game-step">{t("mafiaTitle")}</span><p>{t("mafiaDesc")}</p><p className="confession-count">{t("mafiaNeedPlayers")}</p><div className="mafia-players">{state.players.map((name, idx) => <div key={idx} className="mafia-player-row"><input value={name} onChange={(e) => updatePlayer(idx, e.target.value)} placeholder={`${locale === "ru" ? "Игрок" : "Player"} ${idx + 1}`} />{state.players.length > 1 && <button onClick={() => removePlayer(idx)} type="button">×</button>}</div>)}</div><div className="game-primary-actions"><button className="demo-action demo-action--white" onClick={addPlayer} type="button">+ {locale === "ru" ? "Игрок" : "Player"}</button><button className="demo-action demo-action--lime" disabled={state.players.filter((p) => p.trim()).length < 5} onClick={deal} type="button">{t("mafiaDeal")}</button></div>{sessionId && <span className="multiplayer-badge">LIVE</span>}</div>;

  return <div className="party-game-board game-board-enter"><span className="game-step">{t("mafiaPlayer")}{state.index + 1}/{state.roles.length}</span><h3>{state.roles[state.index].name}</h3>{state.reveal ? <div className="secret-role">{state.roles[state.index].role}</div> : <button className="secret-cover" onClick={() => setState((prev) => ({ ...prev, reveal: true }))} type="button"><span className="material-symbols-rounded">visibility</span> {t("mafiaShowRole")}</button>}<div className="game-primary-actions"><button className="demo-action demo-action--lime" disabled={!state.reveal} onClick={next} type="button">{t("mafiaHidePass")} <span className="material-symbols-rounded">arrow_forward</span></button></div>{sessionId && <span className="multiplayer-badge">LIVE</span>}</div>;
}
