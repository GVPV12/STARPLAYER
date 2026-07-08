import type { WheelEvent } from "react";
import { speakerIconLevel, VOLUME_STEP } from "@starplayer/core";
import { useSkin } from "../SkinProvider.js";
import { SpeakerIcon } from "../icons/Icons.js";
import styles from "./VolumeSlider.module.css";

export interface VolumeSliderProps {
  value: number;
  muted: boolean;
  onChange: (value: number) => void;
  onToggleMute: () => void;
}

/**
 * First-class volume control: speaker icon (click = mute toggle, icon shape
 * reacts to level) + a slider styled natively per-skin. Scroll wheel over the
 * track nudges by `VOLUME_STEP`; arrow keys nudge natively via `step` when the
 * slider has focus. Global ↑/↓/M shortcuts are wired at the app level.
 */
export function VolumeSlider({ value, muted, onChange, onToggleMute }: VolumeSliderProps) {
  const skin = useSkin();
  const level = speakerIconLevel(value, muted);
  const displayValue = muted ? 0 : Math.round(value);

  function handleWheel(event: WheelEvent<HTMLInputElement>) {
    event.preventDefault();
    const delta = event.deltaY < 0 ? VOLUME_STEP : -VOLUME_STEP;
    onChange(value + delta);
  }

  return (
    <div className={styles.row} data-skin={skin.id}>
      <button
        type="button"
        className={styles.speakerButton}
        data-skin={skin.id}
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={muted}
      >
        <SpeakerIcon level={level} size={20} />
      </button>
      <input
        type="range"
        className={styles.slider}
        data-skin={skin.id}
        min={0}
        max={100}
        step={1}
        value={displayValue}
        onChange={(event) => onChange(Number(event.target.value))}
        onWheel={handleWheel}
        aria-label="Volume"
        aria-valuetext={`${displayValue}%`}
        style={{ ["--fill-percent" as string]: `${displayValue}%` }}
      />
      <span className={styles.value} data-skin={skin.id} aria-hidden="true">
        {displayValue}
      </span>
    </div>
  );
}
