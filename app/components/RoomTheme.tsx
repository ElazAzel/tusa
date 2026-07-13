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

export default function RoomTheme({ currentTheme, onThemeChange, inviteCode, ownedThemes: initialOwned }: { currentTheme?: string; onThemeChange?: (theme: string) => void; inviteCode: string; ownedThemes?: string[] }) {
  const { t } = useLocale();
  const [selected, setSelected] = useState(currentTheme || "lime");
  const [owned, setOwned] = useState<Set<string>>(new Set(initialOwned ?? ["lime"]));
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  const apply = useCallback(async (id: string) => {
    setApplying(true);
    setError("");
    const theme = THEMES.find((th) => th.id === id);
    try {
      const res = await fetch(`/api/parties/${inviteCode}/theme`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: { bg: theme?.bg, accent: theme?.accent, id }, themeId: id }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error"); return; }
      if (data.ownedThemes) setOwned(new Set(data.ownedThemes));
      setSelected(id);
      onThemeChange?.(id);
    } catch { setError("Network error"); }
    setApplying(false);
  }, [inviteCode, onThemeChange]);

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("themeTitle")}</span>
    {error && <p style={{ color: "var(--red)", marginTop: 8 }}>{error}</p>}
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
