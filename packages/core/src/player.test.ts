import { describe, expect, it } from "vitest";
import { createPlayerStore, type PlayerBackend } from "./player.js";
import type { Track } from "./types.js";

function makeTrack(id: string, rating: Track["rating"]): Track {
  return {
    id,
    path: `/music/${id}.mp3`,
    title: id,
    artist: "Artist",
    album: "Album",
    coverArt: null,
    duration: 200,
    bpm: null,
    mood: null,
    rating,
    addedAt: 0,
    year: null,
  };
}

function makeFakeBackend(): PlayerBackend {
  return {
    load: () => {},
    play: () => {},
    pause: () => {},
    seek: () => {},
    setGain: () => {},
    subscribeTimeUpdate: () => () => {},
    subscribeEnded: () => () => {},
  };
}

describe("createPlayerStore playQueue + shuffle", () => {
  it("never ends up with a null currentTrack when shuffle is on but nothing meets the rating bar", async () => {
    // Reproduces the "delete all data, then play/shuffle does nothing" bug:
    // a freshly-scanned library is 100% unrated, well below the default 3★
    // shuffle threshold.
    const store = createPlayerStore();
    store.getState().setBackend(makeFakeBackend());

    const tracks = [makeTrack("a", 0), makeTrack("b", 0), makeTrack("c", 0)];
    await store.getState().playQueue(tracks, 0, { shuffle: true });

    expect(store.getState().currentTrack).not.toBeNull();
    expect(store.getState().queue).toHaveLength(3);
  });

  it("includes 1-2 star tracks when the injected threshold getter allows it", async () => {
    const store = createPlayerStore(undefined, () => 1);
    store.getState().setBackend(makeFakeBackend());

    const tracks = [makeTrack("a", 1), makeTrack("b", 2), makeTrack("c", 0)];
    await store.getState().playQueue(tracks, 0, { shuffle: true });

    expect(store.getState().queue.map((t) => t.id).sort()).toEqual(["a", "b"]);
  });

  it("defaults to unshuffled and repeat off, even if left on from a previous queue", async () => {
    const store = createPlayerStore();
    store.getState().setBackend(makeFakeBackend());
    store.setState({ shuffle: true, repeat: "all" });

    const tracks = [makeTrack("a", 5), makeTrack("b", 5), makeTrack("c", 5)];
    await store.getState().playQueue(tracks, 0);

    expect(store.getState().shuffle).toBe(false);
    expect(store.getState().repeat).toBe("off");
    expect(store.getState().queue.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });
});

describe("createPlayerStore repeat modes", () => {
  it("'one' replays the current track exactly once, then turns itself off", async () => {
    const store = createPlayerStore();
    store.getState().setBackend(makeFakeBackend());
    const tracks = [makeTrack("a", 5), makeTrack("b", 5)];
    await store.getState().playQueue(tracks, 0);
    store.getState().setRepeat("one");

    await store.getState().next();
    expect(store.getState().currentTrack?.id).toBe("a");
    expect(store.getState().repeat).toBe("one");

    await store.getState().next();
    expect(store.getState().currentTrack?.id).toBe("b");
    expect(store.getState().repeat).toBe("off");
  });

  it("re-selecting 'one' via setRepeat grants a fresh single replay", async () => {
    const store = createPlayerStore();
    store.getState().setBackend(makeFakeBackend());
    const tracks = [makeTrack("a", 5), makeTrack("b", 5)];
    await store.getState().playQueue(tracks, 0);
    store.getState().setRepeat("one");
    await store.getState().next();
    await store.getState().next();
    expect(store.getState().currentTrack?.id).toBe("b");

    // Choosing "one" again for the new current track should grant it its
    // own single replay, not immediately fall through as already-consumed.
    store.getState().setRepeat("one");
    await store.getState().next();
    expect(store.getState().currentTrack?.id).toBe("b");
    expect(store.getState().repeat).toBe("one");
  });

  it("'all' loops the current track indefinitely until repeat is changed away from it", async () => {
    const store = createPlayerStore();
    store.getState().setBackend(makeFakeBackend());
    const tracks = [makeTrack("a", 5), makeTrack("b", 5)];
    await store.getState().playQueue(tracks, 0);
    store.getState().setRepeat("all");

    for (let i = 0; i < 5; i += 1) {
      await store.getState().next();
      expect(store.getState().currentTrack?.id).toBe("a");
      expect(store.getState().repeat).toBe("all");
    }

    store.getState().setRepeat("off");
    await store.getState().next();
    expect(store.getState().currentTrack?.id).toBe("b");
  });

  it("stops at the end of the queue when repeat is off", async () => {
    const store = createPlayerStore();
    store.getState().setBackend(makeFakeBackend());
    const tracks = [makeTrack("a", 5), makeTrack("b", 5)];
    await store.getState().playQueue(tracks, 1);

    await store.getState().next();
    expect(store.getState().isPlaying).toBe(false);
    expect(store.getState().currentTrack?.id).toBe("b");
  });
});
