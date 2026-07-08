import { ProgressBar } from "@starplayer/ui";
import { usePlayerStore } from "../store/playerStore.js";

/**
 * Subscribes to `currentTime`/`duration` itself so the frequent 'timeupdate'
 * ticks only re-render this small component, not the whole PlayerScreen
 * (rating stars, playlist carousel, etc. don't need to re-run on every tick).
 */
export function ConnectedProgressBar() {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);

  return (
    <ProgressBar currentTime={currentTime} duration={duration} onSeek={(seconds) => usePlayerStore.getState().seek(seconds)} />
  );
}
