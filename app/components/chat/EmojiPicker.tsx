"use client";

import { useEffect, useRef } from "react";
import { quickReactions } from "./stickers";

type Props = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  label: string;
  closeLabel: string;
};

export default function EmojiPicker({ onSelect, onClose, label, closeLabel }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? [])];
      if (!focusable.length) return;
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && currentIndex <= 0) {
        event.preventDefault();
        focusable.at(-1)?.focus();
      } else if (!event.shiftKey && currentIndex === focusable.length - 1) {
        event.preventDefault();
        focusable[0]?.focus();
      }
    };
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return <div className="emoji-picker-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div aria-label={label} aria-modal="true" className="emoji-picker" ref={dialogRef} role="dialog">
      <div className="emoji-picker-header">
        <span>{label}</span>
        <button aria-label={closeLabel} className="emoji-picker-close" onClick={onClose} type="button"><span aria-hidden="true" className="material-symbols-rounded">close</span></button>
      </div>
      <div className="emoji-picker-grid">
      {quickReactions.map((emoji) => (
        <button aria-label={`${label}: ${emoji}`} key={emoji} className="emoji-picker-item" onClick={() => { onSelect(emoji); onClose(); }} type="button">
          {emoji}
        </button>
      ))}
      </div>
    </div>
  </div>;
}
