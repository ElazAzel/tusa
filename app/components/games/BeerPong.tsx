"use client";

import { useMultiplayerGame } from "@/app/components/useMultiplayerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type BeerState = { scores: [number, number] };

export default function BeerPong({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { t } = useLocale();
  const { state, setState, complete } = useMultiplayerGame<BeerState>(sessionId ?? null, () => ({ scores: [10, 10] as [number, number] }));

  function hit(team: 0 | 1) { setState((prev) => ({ ...prev, scores: team === 0 ? [Math.max(0, prev.scores[0] - 1), prev.scores[1]] as [number, number] : [prev.scores[0], Math.max(0, prev.scores[1] - 1)] as [number, number] })); }
  function ret(team: 0 | 1) { setState((prev) => ({ ...prev, scores: team === 0 ? [Math.min(10, prev.scores[0] + 1), prev.scores[1]] as [number, number] : [prev.scores[0], Math.min(10, prev.scores[1] + 1)] as [number, number] })); }

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("beerRemaining")}</span>
    <div className="beer-teams">
      <div>
        <label>{t("beerTeamA")}</label>
        <strong className="score-bump" key={`a-${state.scores[0]}`}>{state.scores[0]}</strong>
        <div>
          <button className="demo-action demo-action--lime" onClick={() => hit(0)} type="button">{t("beerHit")}</button>
          <button className="demo-action demo-action--white" onClick={() => ret(0)} type="button">{t("beerReturn")}</button>
        </div>
      </div>
      <b>VS</b>
      <div>
        <label>{t("beerTeamB")}</label>
        <strong className="score-bump" key={`b-${state.scores[1]}`}>{state.scores[1]}</strong>
        <div>
          <button className="demo-action demo-action--lime" onClick={() => hit(1)} type="button">{t("beerHit")}</button>
          <button className="demo-action demo-action--white" onClick={() => ret(1)} type="button">{t("beerReturn")}</button>
        </div>
      </div>
    </div>
    <div className="game-primary-actions">
      <button className="demo-action demo-action--lime" onClick={() => { complete(); onSave(20 - state.scores[0] - state.scores[1]); }} type="button">{t("beerSave")}</button>
    </div>
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </div>;
}
