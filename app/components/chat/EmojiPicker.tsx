"use client";

import { quickReactions } from "./stickers";

type Props = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export default function EmojiPicker({ onSelect, onClose }: Props) {
  return <div className="emoji-picker" role="dialog" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="emoji-picker-grid">
      {quickReactions.map((emoji) => (
        <button aria-label={`React ${emoji}`} key={emoji} className="emoji-picker-item" onClick={() => { onSelect(emoji); onClose(); }} type="button">
          {emoji}
        </button>
      ))}
    </div>
  </div>;
}
