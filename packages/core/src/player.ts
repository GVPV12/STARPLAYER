import { create } from "zustand";
import { SHUFFLEABLE_MIN_RATING, type Rating, type RepeatMode, type Track } from "./types.js";
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
  /** Internal: whether the current track's one-shot "repeat once" replay has already happened. */
  repeatOneConsumed: boolean;
  volume: VolumeState;

  setBackend: (backend: PlayerBackend) => void;
  /** `shuffle` defaults to off — pass `{ shuffle: true }` for an explicit "play shuffled" action. */
  playQueue: (tracks: Track[], startIndex?: number, options?: { shuffle?: boolean }) => Promise<void>;
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

/**
 * @param getShuffleMinRating Read fresh on every shuffle so a live Settings
 * change (e.g. "include 1-2 star tracks") takes effect immediately, without
 * threading the value through every `playQueue`/`toggleShuffle` call site.
 */
export function createPlayerStore(
  initialVolume = 80,
  getShuffleMinRating: () => Rating = () => SHUFFLEABLE_MIN_RATING,
) {
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
    repeatOneConsumed: false,
    volume: createVolumeState(initialVolume),

    setBackend: (backend) => {
      backend.setGain(sliderToGain(get().volume.value));
      set({ backend });
    },

    playQueue: async (tracks, startIndex = 0, options) => {
      const shuffle = options?.shuffle ?? false;
      const unshuffledQueue = [...tracks];
      const queue = shuffle ? shuffleTracks(tracks, getShuffleMinRating()) : unshuffledQueue;
      const currentIndex = Math.min(Math.max(startIndex, 0), Math.max(queue.length - 1, 0));
      const currentTrack = queue[currentIndex] ?? null;
      // Starting a new queue always begins with shuffle/repeat off unless the
      // caller explicitly asked for shuffle — neither should silently carry
      // over from a previous queue and surprise the next thing you play.
      set({
        queue,
        unshuffledQueue,
        currentIndex,
        currentTrack,
        shuffle,
        repeat: "off",
        repeatOneConsumed: false,
        isPlaying: Boolean(currentTrack),
      });
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
      const { queue, currentIndex, backend, currentTrack, repeatOneConsumed, repeat: initialRepeat } = get();
      let repeat = initialRepeat;
      if (queue.length === 0) return;

      // "all" loops the current (marked) track forever — only changing
      // `repeat` away from it moves playback on to a different track.
      if (repeat === "all" && currentTrack) {
        await loadAndPlay(backend, currentTrack);
        set({ isPlaying: true });
        return;
      }

      // "one" is a one-shot: the current track replays exactly once, then
      // the mode turns itself back off and playback advances normally.
      if (repeat === "one" && currentTrack && !repeatOneConsumed) {
        set({ repeatOneConsumed: true });
        await loadAndPlay(backend, currentTrack);
        set({ isPlaying: true });
        return;
      }
      if (repeat === "one") {
        repeat = "off";
        set({ repeat, repeatOneConsumed: false });
      }

      const history = currentTrack ? [...get().history, currentTrack] : get().history;
      const nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        set({ isPlaying: false });
        return;
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
        const reordered = shuffle ? shuffleTracks(remaining, getShuffleMinRating()) : remaining;
        const queue = current ? [current, ...reordered] : reordered;
        return { shuffle, queue, currentIndex: 0 };
      }),

    setRepeat: (mode) => set({ repeat: mode, repeatOneConsumed: false }),

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
