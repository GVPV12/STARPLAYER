import { create } from "zustand";

export interface FavoritesModeState {
  active: boolean;
  setActive: (active: boolean) => void;
}

/**
 * Whether the currently-playing queue came from Favorites mode. Distinct from
 * "is the favorites picker screen currently open" — the heart in the top bar
 * should stay highlighted while a favorites queue is playing even after you
 * navigate away from the picker, and turn off once a different queue (library,
 * a playlist) starts playing.
 */
export const useFavoritesModeStore = create<FavoritesModeState>((set) => ({
  active: false,
  setActive: (active) => set({ active }),
}));
