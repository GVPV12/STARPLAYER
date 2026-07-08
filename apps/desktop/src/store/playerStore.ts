import { createPlayerStore } from "@starplayer/core";

/** Singleton player store for the desktop app; the audio backend is attached once in App.tsx. */
export const usePlayerStore = createPlayerStore();
