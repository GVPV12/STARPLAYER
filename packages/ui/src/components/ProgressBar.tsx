import { useSkin } from "../SkinProvider.js";
import styles from "./ProgressBar.module.css";

export interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const skin = useSkin();
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.wrap} data-skin={skin.id}>
      <span className={styles.time} data-skin={skin.id}>
        {formatTime(currentTime)}
      </span>
      <input
        type="range"
        className={styles.slider}
        data-skin={skin.id}
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-label="Seek"
        style={{ ["--fill-percent" as string]: `${percent}%` }}
      />
      <span className={styles.time} data-skin={skin.id}>
        {formatTime(duration)}
      </span>
    </div>
  );
}
