import { convertFileSrc } from "@tauri-apps/api/core";
import type { PlayerBackend, Track } from "@starplayer/core";
import { connectAnalyser, resumeAudioContext } from "./audioAnalyser.js";

/** HTML5 `<audio>` implementation of the shared `PlayerBackend` contract. */
export function createHtmlAudioBackend(): PlayerBackend {
  const audio = new Audio();
  audio.preload = "auto";
  // Without this, the media element loads via Tauri's asset:// protocol in
  // "no-cors" mode: playback works fine, but the browser treats the element
  // as cross-origin-tainted, so the AnalyserNode below silently reads all
  // zeros forever (real audio data never arrives, visualizer stays on its
  // simulated fallback pattern regardless of what's actually playing).
  // "anonymous" makes the fetch honor the asset protocol's CORS headers.
  audio.crossOrigin = "anonymous";
  connectAnalyser(audio);

  return {
    load(track: Track) {
      audio.src = convertFileSrc(track.path);
      audio.load();
    },
    play() {
      resumeAudioContext();
      return audio.play();
    },
    pause() {
      audio.pause();
    },
    seek(seconds) {
      audio.currentTime = seconds;
    },
    setGain(gain) {
      audio.volume = gain;
    },
    subscribeTimeUpdate(cb) {
      const handler = () => cb(audio.currentTime, Number.isFinite(audio.duration) ? audio.duration : 0);
      audio.addEventListener("timeupdate", handler);
      audio.addEventListener("loadedmetadata", handler);
      return () => {
        audio.removeEventListener("timeupdate", handler);
        audio.removeEventListener("loadedmetadata", handler);
      };
    },
    subscribeEnded(cb) {
      audio.addEventListener("ended", cb);
      return () => audio.removeEventListener("ended", cb);
    },
  };
}
