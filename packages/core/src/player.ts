import { create } from "zustand";
import type { RepeatMode, Track } from "./types.js";
import { shuffleTracks } from "./rating.js";
import {
  createVolumeState,
  nudgeVolume as nudgeVolumeState,
  setVolume as setVolumeState,
  sliderToGain,
  toggleMute as toggleMuteState,
  type VolumeState,
} from "./volume.js";

/**
 * Playback backend contract. Desktop implements this over an `HTMLAudioElement`;
 * mobile will implement it over `react-native-track-player`. The store below
 * never touches either directly, so `packages/ui` components stay agnostic of
 * which platform they're running on.
 */
export interface PlayerBackend {
  load(track: Track): Promise<void> | void;
  play(): Promise<void> | void;
  pause(): void;
  seek(seconds: number): void;
  /** 0–1 linear gain, already curved by `sliderToGain`. */
  setGain(gain: number): void;
  subscribeTimeUpdate(cb: (currentTime: number, duration: number) => void): () => void;
  subscribeEnded(cb: () => void): () => void;
}

export interface PlayerState {
  backend: PlayerBackend | null;
  queue: Track[];
  /** The order `queue` was originally built in, before any shuffle was applied — restored when shuffle is turned off. */
  unshuffledQueue: Track[];
  history: Track[];
  currentIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: VolumeState;

  setBackend: (backend: PlayerBackend) => void;
  playQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
  togglePlay: () => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  setRepeat: (mode: RepeatMode) => void;
  setVolume: (value: number) => void;
  nudgeVolume: (delta: number) => void;
  toggleMute: () => void;
  /** Called by the backend's ended/time-update subscriptions; not for UI use. */
  _handleTimeUpdate: (currentTime: number, duration: number) => void;
  _handleEnded: () => void;
}

async function loadAndPlay(backend: PlayerBackend | null, track: Track | undefined) {
  if (!backend || !track) return;
  await backend.load(track);
  await safePlay(backend);
}

/**
 * `play()` legitimately rejects when a previous, still-pending play request
 * gets interrupted by a new load (e.g. the user skips tracks quickly) — that
 * isn't a real error worth surfacing, just a race we should swallow instead
 * of leaving as an unhandled rejection.
 */
async function safePlay(backend: PlayerBackend): Promise<void> {
  try {
    await backend.play();
  } catch {
    // Ignored — see doc comment above.
  }
}

export function createPlayerStore(initialVolume = 80) {
  return create<PlayerState>((set, get) => ({
    backend: null,
    queue: [],
    unshuffledQueue: [],
    history: [],
    currentIndex: -1,
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    shuffle: false,
    repeat: "off",
    volume: createVolumeState(initialVolume),

    setBackend: (backend) => {
      backend.setGain(sliderToGain(get().volume.value));
      set({ backend });
    },

    playQueue: async (tracks, startIndex = 0) => {
      const unshuffledQueue = [...tracks];
      const queue = get().shuffle ? shuffleTracks(tracks) : unshuffledQueue;
      const currentIndex = Math.min(Math.max(startIndex, 0), Math.max(queue.length - 1, 0));
      const currentTrack = queue[currentIndex] ?? null;
      // Loop back to the start once the queue ends by default (favorites, a
      // library folder, a playlist) — the repeat menu can still override this.
      set({ queue, unshuffledQueue, currentIndex, currentTrack, repeat: "all", isPlaying: Boolean(currentTrack) });
      await loadAndPlay(get().backend, currentTrack ?? undefined);
    },

    togglePlay: () => {
      const { backend, isPlaying, currentTrack } = get();
      if (!backend || !currentTrack) return;
      if (isPlaying) {
        backend.pause();
        set({ isPlaying: false });
      } else {
        void safePlay(backend);
        set({ isPlaying: true });
      }
    },

    next: async () => {
      const { queue, currentIndex, repeat, backend, currentTrack } = get();
      if (queue.length === 0) return;
      if (repeat === "one" && currentTrack) {
        await loadAndPlay(backend, currentTrack);
        set({ isPlaying: true });
        return;
      }
      const history = currentTrack ? [...get().history, currentTrack] : get().history;
      let nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat !== "all") {
          set({ isPlaying: false });
          return;
        }
        nextIndex = 0;
      }
      const nextTrack = queue[nextIndex] ?? null;
      set({ currentIndex: nextIndex, currentTrack: nextTrack, history, isPlaying: Boolean(nextTrack) });
      await loadAndPlay(backend, nextTrack ?? undefined);
    },

    prev: async () => {
      const { history, backend, queue, currentIndex } = get();
      if (history.length > 0) {
        const previousTrack = history[history.length - 1]!;
        set({ history: history.slice(0, -1), currentTrack: previousTrack, isPlaying: true });
        await loadAndPlay(backend, previousTrack);
        return;
      }
      const prevIndex = Math.max(currentIndex - 1, 0);
      const prevTrack = queue[prevIndex] ?? null;
      set({ currentIndex: prevIndex, currentTrack: prevTrack, isPlaying: Boolean(prevTrack) });
      await loadAndPlay(backend, prevTrack ?? undefined);
    },

    seek: (seconds) => {
      get().backend?.seek(seconds);
      set({ currentTime: seconds });
    },

    toggleShuffle: () =>
      set((state) => {
        const shuffle = !state.shuffle;
        if (state.queue.length === 0) return { shuffle };
        const current = state.currentTrack;
        const remaining = state.unshuffledQueue.filter((track) => track.id !== current?.id);
        const reordered = shuffle ? shuffleTracks(remaining) : remaining;
        const queue = current ? [current, ...reordered] : reordered;
        return { shuffle, queue, currentIndex: 0 };
      }),

    setRepeat: (mode) => set({ repeat: mode }),

    setVolume: (value) =>
      set((state) => {
        const volume = setVolumeState(value);
        state.backend?.setGain(sliderToGain(volume.value));
        return { volume };
      }),

    nudgeVolume: (delta) =>
      set((state) => {
        const volume = nudgeVolumeState(state.volume, delta);
        state.backend?.setGain(sliderToGain(volume.value));
        return { volume };
      }),

    toggleMute: () =>
      set((state) => {
        const volume = toggleMuteState(state.volume);
        state.backend?.setGain(sliderToGain(volume.value));
        return { volume };
      }),

    _handleTimeUpdate: (currentTime, duration) => set({ currentTime, duration }),
    _handleEnded: () => {
      void get().next();
    },
  }));
}

export type PlayerStore = ReturnType<typeof createPlayerStore>;

/** Wires a backend's callbacks into the store; call once after `setBackend`. */
export function attachBackendSubscriptions(store: PlayerStore, backend: PlayerBackend): () => void {
  const unsubTime = backend.subscribeTimeUpdate((currentTime, duration) => {
    store.getState()._handleTimeUpdate(currentTime, duration);
  });
  const unsubEnded = backend.subscribeEnded(() => {
    store.getState()._handleEnded();
  });
  return () => {
    unsubTime();
    unsubEnded();
  };
}
