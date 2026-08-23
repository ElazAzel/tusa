"use client";

import { useEffect } from "react";
import { tusaStickers } from "./stickers";

type Props = {
  onSelect: (stickerId: string) => void;
  onClose: () => void;
};

export default function StickerPicker({ onSelect, onClose }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return <div className="sticker-picker" role="dialog" aria-label="Stickers" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sticker-picker-grid">
      {tusaStickers.map((sticker) => (
        <button key={sticker.id} className="sticker-picker-item" onClick={() => { onSelect(sticker.id); onClose(); }} type="button" title={sticker.label} aria-label={sticker.label}>
          <span dangerouslySetInnerHTML={{ __html: sticker.svg }} />
        </button>
      ))}
    </div>
  </div>;
}
