"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { CosmeticsItem, ProfileCosmetics, PromoBenefitType } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";
import { soundTap, soundSuccess } from "@/lib/audio";

const TYPE_TO_FIELD: Record<string, keyof ProfileCosmetics> = {
  cover: "cover",
  avatarFrame: "avatarFrame",
  chatEffect: "chatEffect",
  chatBackground: "chatBackground",
  nameColor: "nameColor",
  badge: "badge",
};

const TYPE_TO_UNLOCK: Record<string, PromoBenefitType> = {
  cover: "profile_cover",
  avatarFrame: "avatar_frame",
  chatEffect: "chat_effect",
  chatBackground: "chat_background",
  nameColor: "name_color",
  badge: "badge",
};

const CATEGORY_TABS = ["cover", "avatarFrame", "chatEffect", "chatBackground", "nameColor", "badge"] as const;

const DEFAULT_VALUES: Record<(typeof CATEGORY_TABS)[number], string> = {
  cover: "lime",
  avatarFrame: "none",
  chatEffect: "none",
  chatBackground: "paper",
  nameColor: "#000000",
  badge: "newcomer",
};

const TYPE_ICONS: Record<(typeof CATEGORY_TABS)[number], string> = {
  cover: "wallpaper",
  avatarFrame: "frame_person",
  chatEffect: "auto_awesome",
  chatBackground: "format_color_fill",
  nameColor: "palette",
  badge: "workspace_premium",
};

const categoryLabels: Record<string, { ru: string; en: string }> = {
  cover: { ru: "Обложка", en: "Cover" },
  avatarFrame: { ru: "Рамка", en: "Frame" },
  chatEffect: { ru: "Эффект чата", en: "Chat Effect" },
  chatBackground: { ru: "Фон чата", en: "Chat Background" },
  nameColor: { ru: "Цвет имени", en: "Name Color" },
  badge: { ru: "Ачивка", en: "Badge" },
};

export default function CosmeticsCustomizer({
  profileCosmetics,
  onSave,
  onClose,
}: {
  profileCosmetics: ProfileCosmetics;
  onSave: (cosmetics: Record<string, string>) => Promise<void>;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();
  const [catalogue, setCatalogue] = useState<CosmeticsItem[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof CATEGORY_TABS)[number]>("cover");
  const [preview, setPreview] = useState<ProfileCosmetics>(profileCosmetics);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cosmetics")
      .then((r) => r.json())
      .then((d) => { if (d.items) setCatalogue(d.items); })
      .catch(() => undefined);
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, CosmeticsItem[]> = {};
    for (const item of catalogue) {
      if (!item.active) continue;
      if (!map[item.type]) map[item.type] = [];
      map[item.type].push(item);
    }
    return map;
  }, [catalogue]);

  const field = activeTab;
  const items = grouped[activeTab] || [];
  const unlockType = TYPE_TO_UNLOCK[activeTab];
  const unlocked = profileCosmetics.unlocked.includes(unlockType);

  const handleSelect = useCallback((item: CosmeticsItem) => {
    soundTap();
    const fieldKey = TYPE_TO_FIELD[item.type] || item.type;
    setPreview((prev) => ({ ...prev, [fieldKey as keyof ProfileCosmetics]: item.value }));
  }, []);

  const handleSave = useCallback(async () => {
    soundTap();
    setSaving(true);
    setError("");
    const changed: Record<string, string> = {};
    for (const key of CATEGORY_TABS) {
      const unlock = TYPE_TO_UNLOCK[key];
      const isUnlocked = profileCosmetics.unlocked.includes(unlock);
      if (isUnlocked || preview[key] === DEFAULT_VALUES[key]) {
        changed[key] = preview[key] as string;
      }
    }
    try {
      await onSave(changed);
      soundSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to save cosmetics.");
    } finally {
      setSaving(false);
    }
  }, [preview, profileCosmetics.unlocked, onSave]);

  const hasSaveableChanges = CATEGORY_TABS.some((key) => {
    const canSave = profileCosmetics.unlocked.includes(TYPE_TO_UNLOCK[key]) || preview[key] === DEFAULT_VALUES[key];
    return canSave && preview[key] !== profileCosmetics[key];
  });

  return (
    <div className="cosmetics-customizer-overlay">
      <div className="cosmetics-customizer">
        <div className="cosmetics-customizer-header">
          <h2>{t("profileCosmetics")}</h2>
          <button className="cosmetics-close-btn" onClick={onClose} aria-label="Close">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="cosmetics-customizer-body">
          <div className="cosmetics-preview-panel">
            <div className={`cosmetics-preview-card cosmetics-cover-${preview.cover} chat-background-${preview.chatBackground}`}>
              <div className="cosmetics-preview-avatar" style={preview.avatarFrame !== "none" ? { borderColor: preview.avatarFrame === "lime" ? "var(--lime)" : preview.avatarFrame === "pink" ? "var(--pink)" : preview.avatarFrame === "blue" ? "var(--blue)" : preview.avatarFrame === "neon" ? "#b829ff" : preview.avatarFrame === "gold" ? "#ffd700" : preview.avatarFrame === "crystal" ? "#80deea" : preview.avatarFrame === "inferno" ? "#ff6f00" : preview.avatarFrame === "frost" ? "#e0f7fa" : preview.avatarFrame === "rainbow" ? "#ff9800" : preview.avatarFrame === "animated_pulse" ? "var(--lime)" : preview.avatarFrame === "animated_glow" ? "#ff1791" : preview.avatarFrame === "animated_rotate" ? "#ff0000" : preview.avatarFrame === "animated_chrome" ? "#b0bec5" : preview.avatarFrame === "animated_neon_pulse" ? "#b829ff" : undefined} : undefined}>
                <span>{profileCosmetics.cover?.slice(0, 2).toUpperCase() || "TU"}</span>
              </div>
              <div className="cosmetics-preview-info">
                <span className="cosmetics-preview-name" style={preview.nameColor !== "#000000" ? { color: preview.nameColor } : undefined}>
                  {preview.badge !== "newcomer" && <span className="material-symbols-rounded" style={{ fontSize: 16, color: "var(--lime)", verticalAlign: "middle", marginRight: 3 }}>verified</span>}
                  Preview
                </span>
                <span className="cosmetics-preview-label">{t("profilePreview")}</span>
              </div>
              {preview.avatarFrame !== "none" && preview.avatarFrame.startsWith("animated_") && (
                <span className="cosmetics-animated-badge material-symbols-rounded">play_circle</span>
              )}
            </div>
          </div>

          <div className="cosmetics-main-panel">
            <div className="cosmetics-tabs">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab}
                  className={`cosmetics-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => { soundTap(); setActiveTab(tab); }}
                >
                  {categoryLabels[tab]?.[locale] || tab}
                  {profileCosmetics.unlocked.includes(TYPE_TO_UNLOCK[tab]) && (
                    <span className="cosmetics-tab-unlocked-dot" />
                  )}
                </button>
              ))}
            </div>

            <div className="cosmetics-items-grid">
              {items.length === 0 && <p className="cosmetics-empty">{t("cosmeticsEmpty")}</p>}
              {items.map((item) => {
                const isEquipped = preview[field] === item.value;
                const isLocked = !unlocked && item.value !== DEFAULT_VALUES[activeTab];
                return (
                  <button
                    key={item.id}
                    className={`cosmetics-item ${isEquipped ? "equipped" : ""} ${isLocked ? "locked" : ""}`}
                    onClick={() => handleSelect(item)}
                  >
                    <span className={`cosmetics-item-img cosmetics-item-img--${item.type} cosmetics-item-value-${item.slug}`} aria-hidden="true">
                      <span className="material-symbols-rounded">{TYPE_ICONS[item.type]}</span>
                    </span>
                    <span className="cosmetics-item-name">
                      {locale === "ru" ? item.nameRu : item.nameEn}
                    </span>
                    <span className="cosmetics-item-status">
                      {isEquipped && !isLocked && <span className="material-symbols-rounded" style={{ fontSize: 16, color: "var(--lime)" }}>check_circle</span>}
                      {isLocked && <span className="material-symbols-rounded" style={{ fontSize: 16, color: "var(--gray)" }}>lock</span>}
                      {!isEquipped && !isLocked && <span className="material-symbols-rounded" style={{ fontSize: 16, color: "var(--blue)" }}>touch_app</span>}
                      {isEquipped && isLocked && <span className="material-symbols-rounded" style={{ fontSize: 16, color: "var(--pink)" }}>visibility</span>}
                    </span>
                    {item.slug.startsWith("animated_") && <span className="cosmetics-anim-indicator material-symbols-rounded">auto_awesome</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="cosmetics-customizer-footer">
          {error && <p className="feature-error" role="alert">{error}</p>}
          <p className="cosmetics-hint">
            <span className="material-symbols-rounded" style={{ fontSize: 14, verticalAlign: "middle" }}>lock</span>
            {" "}{t("cosmeticsLockedHint")}
          </p>
          <div className="cosmetics-footer-actions">
            <button className="admin-text-button" onClick={onClose}>{t("cancel")}</button>
            <button className="admin-button" onClick={handleSave} disabled={!hasSaveableChanges || saving}>
              {saving ? t("saving") : t("profileSave")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
