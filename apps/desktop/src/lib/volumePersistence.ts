import type { VolumeState } from "@starplayer/core";

const STORAGE_KEY = "starplayer:volume";
const DEBOUNCE_MS = 150;

export function loadPersistedVolume(): VolumeState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VolumeState) : null;
  } catch {
    return null;
  }
}

let timeoutId: ReturnType<typeof setTimeout> | null = null;

export function persistVolumeDebounced(volume: VolumeState): void {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(volume));
  }, DEBOUNCE_MS);
}
