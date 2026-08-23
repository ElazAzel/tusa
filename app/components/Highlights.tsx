"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

type Highlight = { id: string; partyId: string; sessionId: string | null; userId: string; displayName: string; type: string; data: Record<string, unknown>; thumbnail: string; createdAt: string };

export default function Highlights({ partyId }: { partyId: string }) {
  const { t } = useLocale();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch(`/api/highlights?partyId=${partyId}`).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Could not load highlights.");
      setHighlights(Array.isArray(data.highlights) ? data.highlights : []);
      setError("");
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load highlights.")).finally(() => setLoading(false));
  }, [partyId]);

  useEffect(() => { load(); }, [load]);

  const remove = useCallback(async (id: string) => {
    const response = await fetch(`/api/highlights?id=${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const typeLabel: Record<string, string> = { score: t("highlightScore"), achievement: t("highlightAchievement"), funny: t("highlightFunny"), quote: t("highlightQuote"), photo: t("highlightPhoto") };
  const typeIcon: Record<string, string> = { score: "emoji_events", achievement: "stars", funny: "mood", quote: "format_quote", photo: "photo_camera" };

  if (loading) return <div className="party-game-board"><p style={{ color: "var(--gray)" }}>Loading...</p></div>;

  return <div className="party-feature-surface game-board-enter">
    <span className="game-step">{t("highlightTitle")}</span>
    {error && <p className="feature-error" role="alert">{error}</p>}
    <div className="party-feature-list">
      {!error && highlights.length === 0 && <div className="party-feature-empty"><span className="material-symbols-rounded">photo_library</span><strong>{t("highlightEmpty")}</strong></div>}
      {highlights.map((h) => <div className="party-feature-item" key={h.id}>
        <span className="material-symbols-rounded" style={{ color: "var(--lime)", fontSize: 28 }}>{typeIcon[h.type] || "emoji_events"}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700 }}>{h.displayName || h.userId.slice(0, 8)}</p>
          <p style={{ color: "var(--gray)", fontSize: 12 }}>{typeLabel[h.type] || h.type} · {new Date(h.createdAt).toLocaleDateString()}</p>
          {typeof h.data.score === "number" && <p style={{ color: "var(--lime)", fontWeight: 700, fontSize: 18 }}>{h.data.score}</p>}
        </div>
        <button className="demo-action demo-action--white" onClick={() => remove(h.id)} type="button" style={{ padding: "4px 8px", fontSize: 12 }}>×</button>
      </div>)}
    </div>
  </div>;
}
