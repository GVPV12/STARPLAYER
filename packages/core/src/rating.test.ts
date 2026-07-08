import { describe, expect, it } from "vitest";
import { filterFavorites, filterShuffleable, isShuffleable, ratingLabel, shuffleTracks } from "./rating.js";
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

describe("rating labels", () => {
  it("maps every non-zero rating to its Spanish label", () => {
    expect(ratingLabel(1)).toBe("no me gusta");
    expect(ratingLabel(2)).toBe("meh");
    expect(ratingLabel(3)).toBe("me gusta");
    expect(ratingLabel(4)).toBe("genial");
    expect(ratingLabel(5)).toBe("ultrafavorita");
  });
});

describe("isShuffleable", () => {
  it("excludes 1 and 2 star ratings", () => {
    expect(isShuffleable(1)).toBe(false);
    expect(isShuffleable(2)).toBe(false);
  });

  it("includes 3 through 5 star ratings", () => {
    expect(isShuffleable(3)).toBe(true);
    expect(isShuffleable(4)).toBe(true);
    expect(isShuffleable(5)).toBe(true);
  });
});

describe("filterShuffleable", () => {
  it("drops 1-2 star tracks and unrated tracks", () => {
    const tracks = [makeTrack("a", 0), makeTrack("b", 1), makeTrack("c", 2), makeTrack("d", 3), makeTrack("e", 5)];
    expect(filterShuffleable(tracks).map((t) => t.id)).toEqual(["d", "e"]);
  });
});

describe("shuffleTracks", () => {
  it("never includes 1-2 star tracks in the shuffled result", () => {
    const tracks = [makeTrack("a", 1), makeTrack("b", 2), makeTrack("c", 3), makeTrack("d", 4), makeTrack("e", 5)];
    const shuffled = shuffleTracks(tracks);
    expect(shuffled.every((t) => t.rating >= 3)).toBe(true);
    expect(shuffled).toHaveLength(3);
  });

  it("is a pure permutation of the eligible pool under a deterministic rng", () => {
    const tracks = [makeTrack("a", 3), makeTrack("b", 4), makeTrack("c", 5)];
    const shuffled = shuffleTracks(tracks, () => 0);
    expect(new Set(shuffled.map((t) => t.id))).toEqual(new Set(["a", "b", "c"]));
  });
});

describe("filterFavorites", () => {
  const tracks = [makeTrack("a", 3), makeTrack("b", 4), makeTrack("c", 5), makeTrack("d", 2)];

  it("filters to a single sub-rating", () => {
    expect(filterFavorites(tracks, 4).map((t) => t.id)).toEqual(["b"]);
  });

  it("combines 3-5 star tracks when 'all' is requested", () => {
    expect(filterFavorites(tracks, "all").map((t) => t.id)).toEqual(["a", "b", "c"]);
  });
});
