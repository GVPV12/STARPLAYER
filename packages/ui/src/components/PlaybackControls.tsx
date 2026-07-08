import { useState } from "react";
import type { RepeatMode } from "@starplayer/core";
import { useSkin } from "../SkinProvider.js";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatIcon, ShuffleIcon } from "../icons/Icons.js";
import styles from "./PlaybackControls.module.css";

export interface RepeatLabels {
  off: string;
  all: string;
  one: string;
}

export interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  shuffle: boolean;
  onToggleShuffle: () => void;
  repeat: RepeatMode;
  onSetRepeat: (mode: RepeatMode) => void;
  repeatLabels: RepeatLabels;
}

const REPEAT_OPTIONS: RepeatMode[] = ["off", "all", "one"];

export function PlaybackControls({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  shuffle,
  onToggleShuffle,
  repeat,
  onSetRepeat,
  repeatLabels,
}: PlaybackControlsProps) {
  const skin = useSkin();
  const [repeatMenuOpen, setRepeatMenuOpen] = useState(false);

  return (
    <div className={styles.row} data-skin={skin.id}>
      <button
        type="button"
        className={styles.button}
        data-skin={skin.id}
        data-active={shuffle}
        onClick={onToggleShuffle}
        aria-label="Shuffle (3-5 star tracks only)"
        aria-pressed={shuffle}
      >
        <ShuffleIcon size={16} />
      </button>
      <button type="button" className={styles.button} data-skin={skin.id} onClick={onPrev} aria-label="Previous track">
        <PrevIcon size={18} />
      </button>
      <button
        type="button"
        className={styles.playButton}
        data-skin={skin.id}
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
      </button>
      <button type="button" className={styles.button} data-skin={skin.id} onClick={onNext} aria-label="Next track">
        <NextIcon size={18} />
      </button>
      <div className={styles.repeatWrap}>
        <button
          type="button"
          className={styles.button}
          data-skin={skin.id}
          data-active={repeat !== "off"}
          onClick={() => setRepeatMenuOpen((open) => !open)}
          aria-label={`Repeat: ${repeatLabels[repeat]}`}
          aria-pressed={repeat !== "off"}
          aria-expanded={repeatMenuOpen}
        >
          <RepeatIcon mode={repeat} size={16} />
        </button>
        {repeatMenuOpen ? (
          <>
            <div className={styles.menuBackdrop} onClick={() => setRepeatMenuOpen(false)} />
            <div className={styles.repeatMenu} data-skin={skin.id} role="menu">
              {REPEAT_OPTIONS.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="menuitemradio"
                  aria-checked={repeat === mode}
                  className={styles.repeatOption}
                  data-skin={skin.id}
                  data-active={repeat === mode}
                  onClick={() => {
                    onSetRepeat(mode);
                    setRepeatMenuOpen(false);
                  }}
                >
                  {repeatLabels[mode]}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
