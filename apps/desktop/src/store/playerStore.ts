import { createPlayerStore, SHUFFLEABLE_MIN_RATING, SHUFFLEABLE_MIN_RATING_LOW } from "@starplayer/core";
import { useSettingsStore } from "./settingsStore.js";

/** Singleton player store for the desktop app; the audio backend is attached once in App.tsx. */
export const usePlayerStore = createPlayerStore(undefined, () =>
  useSettingsStore.getState().shuffleIncludeLowRated ? SHUFFLEABLE_MIN_RATING_LOW : SHUFFLEABLE_MIN_RATING,
);
