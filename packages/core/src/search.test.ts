import { describe, expect, it } from "vitest";
import { searchTracks } from "./search.js";
import type { Track } from "./types.js";

function makeTrack(overrides: Partial<Track> & { id: string }): Track {
  return {
    path: `/music/${overrides.id}.mp3`,
    title: "Untitled",
    artist: "Unknown",
    album: "Unknown",
    coverArt: null,
    duration: 200,
    bpm: null,
    mood: null,
    rating: 0,
    addedAt: 0,
    year: null,
    ...overrides,
  };
}

describe("searchTracks", () => {
  const tracks = [
    makeTrack({ id: "a", title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming" }),
    makeTrack({ id: "b", title: "Resonance", artist: "HOME", album: "Odyssey" }),
    makeTrack({ id: "c", title: "Genesis", artist: "Justice", album: "Cross" }),
  ];

  it("matches by title, case-insensitively", () => {
    expect(searchTracks(tracks, "midnight").map((t) => t.id)).toEqual(["a"]);
  });

  it("matches by artist", () => {
    expect(searchTracks(tracks, "home").map((t) => t.id)).toEqual(["b"]);
  });

  it("matches by album", () => {
    expect(searchTracks(tracks, "cross").map((t) => t.id)).toEqual(["c"]);
  });

  it("matches substrings, not just whole words", () => {
    expect(searchTracks(tracks, "eso").map((t) => t.id)).toEqual(["b"]);
  });

  it("returns nothing for a blank or whitespace-only query", () => {
    expect(searchTracks(tracks, "")).toEqual([]);
    expect(searchTracks(tracks, "   ")).toEqual([]);
  });

  it("returns nothing when there's no match", () => {
    expect(searchTracks(tracks, "nonexistent")).toEqual([]);
  });
});
