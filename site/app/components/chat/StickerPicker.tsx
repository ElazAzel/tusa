"use client";

import { tusaStickers } from "./stickers";

type Props = {
  onSelect: (stickerId: string) => void;
  onClose: () => void;
};

export default function StickerPicker({ onSelect, onClose }: Props) {
  return <div className="sticker-picker" role="dialog" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sticker-picker-grid">
      {tusaStickers.map((sticker) => (
        <button key={sticker.id} className="sticker-picker-item" onClick={() => { onSelect(sticker.id); onClose(); }} type="button" title={sticker.label}>
          <span dangerouslySetInnerHTML={{ __html: sticker.svg }} />
        </button>
      ))}
    </div>
  </div>;
}
