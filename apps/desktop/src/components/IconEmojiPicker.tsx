import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSkin } from "@starplayer/ui";
import styles from "./IconEmojiPicker.module.css";

/** Plain monochrome symbols — shown first, before the colorful emoji grid. */
const ICONS = [
  "♪", "♫", "♬", "★", "☆", "✦", "✧", "✶", "●", "○",
  "■", "□", "▲", "△", "♥", "♡", "✓", "✗", "⚑", "⚐",
  "⚙", "⏵", "⏸", "⏹", "♦", "♣", "♠", "※", "¤", "☾",
  "☀", "☁", "☂", "❄", "⚡", "✈", "⌘", "⏳", "⚔", "⚖",
];

const EMOJIS = [
  "🎵", "🎶", "🎧", "🎤", "🎸", "🥁", "🎷", "🎹", "🎻", "🎺",
  "🌟", "💖", "🔥", "⚡", "✨", "🌈", "💫", "🎆", "🎇", "🪩",
  "🍕", "🍩", "☕", "🧋", "🍺", "🍷", "🍓", "🍉", "🍫", "🍪",
  "🐱", "🐶", "🦊", "🐰", "🦄", "🐼", "🐸", "🦋", "🐙", "🦉",
  "🌙", "☀️", "🌸", "🍀", "🌊", "🌴", "❄️", "🌵", "🌻", "🍄",
  "🏋️", "📚", "💤", "🎮", "🚗", "✈️", "🏖️", "⚽", "🏀", "🎯",
  "🎂", "🎉", "🎃", "👻", "🎄", "🎁", "🧧", "🎊", "🪅", "🎗️",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💗",
  "😀", "😎", "🥳", "🤩", "🥰", "😴", "🤔", "😭", "🤯", "👽",
  "📸", "🎬", "🎨", "📝", "🔮", "💎", "🚀", "🛸", "🧿", "🕹️",
];

export interface IconEmojiPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconEmojiPicker({ value, onChange }: IconEmojiPickerProps) {
  const { t } = useTranslation();
  const skin = useSkin();
  const [open, setOpen] = useState(false);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        data-skin={skin.id}
        onClick={() => setOpen(true)}
        aria-label={t("playlists.emoji")}
        aria-expanded={open}
      >
        {value}
      </button>
      {open ? (
        <div className={styles.backdrop} role="presentation" onClick={() => setOpen(false)}>
          <div
            className={styles.panel}
            data-skin={skin.id}
            role="dialog"
            aria-modal="true"
            aria-label={t("playlists.emoji")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle} data-skin={skin.id}>
                {t("playlists.emoji")}
              </span>
              <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label={t("playlists.cancel")}>
                ×
              </button>
            </div>
            <div className={styles.panelBody}>
              <span className={styles.sectionLabel}>{t("playlists.iconsSection")}</span>
              <div className={styles.grid}>
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={styles.option}
                    data-skin={skin.id}
                    data-active={value === icon}
                    onClick={() => pick(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <span className={styles.sectionLabel}>{t("playlists.emojisSection")}</span>
              <div className={styles.grid}>
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={styles.option}
                    data-skin={skin.id}
                    data-active={value === emoji}
                    onClick={() => pick(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
