"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { CosmeticsItem, ProfileCosmetics } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";
import { soundTap, soundSuccess } from "@/lib/audio";
import InlineSvg from "@/app/components/InlineSvg";

const TYPE_TO_FIELD: Record<string, keyof ProfileCosmetics> = {
  cover: "cover",
  avatarFrame: "avatarFrame",
  chatEffect: "chatEffect",
  nameColor: "nameColor",
  badge: "badge",
};

const CATEGORY_TABS = ["cover", "avatarFrame", "chatEffect", "nameColor", "badge"] as const;

const categoryLabels: Record<string, { ru: string; en: string }> = {
  cover: { ru: "Обложка", en: "Cover" },
  avatarFrame: { ru: "Рамка", en: "Frame" },
  chatEffect: { ru: "Эффект чата", en: "Chat Effect" },
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
  const [activeTab, setActiveTab] = useState<keyof ProfileCosmetics>("cover");
  const [preview, setPreview] = useState<ProfileCosmetics>(profileCosmetics);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

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
  const handleSelect = useCallback((item: CosmeticsItem) => {
    soundTap();
    const fieldKey = TYPE_TO_FIELD[item.type] || item.type;
    setPreview((prev) => ({ ...prev, [fieldKey as keyof ProfileCosmetics]: item.value }));
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    soundTap();
    setSaving(true);
    const changed: Record<string, string> = {};
    for (const key of CATEGORY_TABS) {
      changed[key] = preview[key] as string;
    }
    await onSave(changed);
    soundSuccess();
    setSaving(false);
    setDirty(false);
  }, [preview, onSave]);

  const hasChanges = dirty || CATEGORY_TABS.some((key) => preview[key] !== profileCosmetics[key]);

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
            <div className={`cosmetics-preview-card cosmetic-cover-${preview.cover.replace(/[^a-z0-9_-]/gi, "")}`}>
              <div className={`cosmetics-preview-avatar frame-${preview.avatarFrame.replace(/[^a-z0-9_-]/gi, "")}`}>
                <span>{profileCosmetics.cover?.slice(0, 2).toUpperCase() || "TU"}</span>
              </div>
              <div className="cosmetics-preview-info">
                <span className={`cosmetics-preview-name ${preview.nameColor.startsWith("animated_") ? `cosmetic-name-${preview.nameColor}` : ""}`} style={preview.nameColor !== "#000000" && !preview.nameColor.startsWith("animated_") ? { color: preview.nameColor } : undefined}>
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
                </button>
              ))}
            </div>

            <div className="cosmetics-items-grid">
              {items.length === 0 && <p className="cosmetics-empty">{t("cosmeticsEmpty")}</p>}
              {items.map((item) => {
                const isEquipped = preview[field] === item.value;
                return (
                  <button
                    key={item.id}
                    className={`cosmetics-item ${isEquipped ? "equipped" : ""}`}
                    onClick={() => handleSelect(item)}
                  >
                    <InlineSvg
                      url={item.imageUrl}
                      className="cosmetics-item-img"
                    />
                    <span className="cosmetics-item-name">
                      {locale === "ru" ? item.nameRu : item.nameEn}
                    </span>
                    <span className="cosmetics-item-status">
                      {isEquipped && <span className="material-symbols-rounded" style={{ fontSize: 16, color: "var(--lime)" }}>check_circle</span>}
                      {!isEquipped && <span className="material-symbols-rounded" style={{ fontSize: 16, color: "var(--blue)" }}>touch_app</span>}
                    </span>
                    {item.slug.startsWith("animated_") && <span className="cosmetics-anim-indicator material-symbols-rounded">auto_awesome</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="cosmetics-customizer-footer">
          <p className="cosmetics-hint">
            {t("profilePreview")}
          </p>
          <div className="cosmetics-footer-actions">
            <button className="admin-text-button" onClick={onClose}>{t("cancel")}</button>
            <button className="admin-button" onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? t("saving") : t("profileSave")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
