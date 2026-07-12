"use client";

import { useCallback, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

const THEMES = [
  { id: "lime", name: "Lime", bg: "#C9FF05", accent: "#2D00F7", cost: 0 },
  { id: "pink", name: "Pink", bg: "#FF007F", accent: "#000", cost: 50 },
  { id: "blue", name: "Blue", bg: "#2D00F7", accent: "#C9FF05", cost: 50 },
  { id: "dark", name: "Dark", bg: "#171717", accent: "#C9FF05", cost: 100 },
  { id: "cream", name: "Cream", bg: "#F7F7F2", accent: "#2D00F7", cost: 100 },
  { id: "red", name: "Red", bg: "#f87171", accent: "#000", cost: 200 },
];

export default function RoomTheme({ partyId, currentTheme, onThemeChange }: { partyId: string; currentTheme?: string; onThemeChange?: (theme: string) => void }) {
  const { locale, t } = useLocale();
  const [selected, setSelected] = useState(currentTheme || "lime");
  const [owned, setOwned] = useState<Set<string>>(new Set(["lime"]));
  const [applying, setApplying] = useState(false);

  const apply = useCallback(async (id: string) => {
    setApplying(true);
    await fetch(`/api/parties/${partyId}/theme`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: { bg: THEMES.find((t) => t.id === id)?.bg, accent: THEMES.find((t) => t.id === id)?.accent } }) });
    setSelected(id);
    setOwned((prev) => new Set(prev).add(id));
    onThemeChange?.(id);
    setApplying(false);
  }, [partyId, onThemeChange]);

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("themeTitle")}</span>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 8 }}>
      {THEMES.map((th) => {
        const isOwned = owned.has(th.id);
        const isSelected = selected === th.id;
        return <button key={th.id} onClick={() => isOwned ? apply(th.id) : null} disabled={applying} type="button" style={{ background: th.bg, color: th.accent, borderRadius: 8, padding: 16, border: isSelected ? "3px solid var(--lime)" : "3px solid transparent", cursor: isOwned ? "pointer" : "default", opacity: isOwned ? 1 : 0.5 }}>
          <p style={{ fontWeight: 700 }}>{th.name}</p>
          <p style={{ fontSize: 12 }}>{isOwned ? t("themeOwned") : `${t("themeUnlock")} ${th.cost} KOINS`}</p>
        </button>;
      })}
    </div>
  </div>;
}
