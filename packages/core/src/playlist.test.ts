import { describe, expect, it } from "vitest";
import {
  AUTO_PLAYLISTS,
  buildPlaylistCarousel,
  getAutoPlaylistTracks,
  getPlaylistCoverTrack,
  getPlaylistTracks,
  isTrackInPlaylist,
  toggleTrackInPlaylist,
} from "./playlist.js";
import type { Playlist, Track, TrackPlaylistLink } from "./types.js";

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

const tracks = [
  makeTrack("a", 5),
  makeTrack("b", 4),
  makeTrack("c", 3),
  makeTrack("d", 2),
  makeTrack("e", 5),
];

describe("getAutoPlaylistTracks", () => {
  it("resolves ultrafavorites to exactly the 5-star tracks", () => {
    expect(getAutoPlaylistTracks(tracks, "auto-ultrafavorites").map((t) => t.id)).toEqual(["a", "e"]);
  });

  it("resolves all-favorites to the combined 3-5 star tracks", () => {
    expect(getAutoPlaylistTracks(tracks, "auto-all-favorites").map((t) => t.id)).toEqual(["a", "b", "c", "e"]);
  });
});

describe("playlist membership", () => {
  const playlistId = "p1";
  const links: TrackPlaylistLink[] = [{ trackId: "a", playlistId }];

  it("getPlaylistTracks returns only linked tracks", () => {
    expect(getPlaylistTracks(tracks, links, playlistId).map((t) => t.id)).toEqual(["a"]);
  });

  it("isTrackInPlaylist reflects link presence", () => {
    expect(isTrackInPlaylist(links, "a", playlistId)).toBe(true);
    expect(isTrackInPlaylist(links, "b", playlistId)).toBe(false);
  });

  it("toggleTrackInPlaylist adds when absent, removes when present", () => {
    const added = toggleTrackInPlaylist(links, "b", playlistId);
    expect(isTrackInPlaylist(added, "b", playlistId)).toBe(true);

    const removed = toggleTrackInPlaylist(added, "a", playlistId);
    expect(isTrackInPlaylist(removed, "a", playlistId)).toBe(false);
  });
});

describe("getPlaylistCoverTrack", () => {
  const playlistId = "p1";

  it("returns the first-added track that still exists", () => {
    const links: TrackPlaylistLink[] = [
      { trackId: "b", playlistId },
      { trackId: "a", playlistId },
    ];
    expect(getPlaylistCoverTrack(tracks, links, playlistId)?.id).toBe("b");
  });

  it("skips links whose track no longer exists in the library", () => {
    const links: TrackPlaylistLink[] = [
      { trackId: "deleted-track", playlistId },
      { trackId: "c", playlistId },
    ];
    expect(getPlaylistCoverTrack(tracks, links, playlistId)?.id).toBe("c");
  });

  it("returns null for an empty or unmatched playlist", () => {
    expect(getPlaylistCoverTrack(tracks, [], playlistId)).toBeNull();
  });
});

describe("buildPlaylistCarousel", () => {
  it("always includes the 4 auto-lists before user playlists", () => {
    const userPlaylists: Playlist[] = [{ id: "p1", name: "Gym", emoji: "🏋️", createdAt: 0 }];
    const carousel = buildPlaylistCarousel(userPlaylists);
    expect(carousel.slice(0, AUTO_PLAYLISTS.length).every((item) => item.isAuto)).toBe(true);
    expect(carousel.at(-1)).toEqual({ id: "p1", name: "Gym", emoji: "🏋️", isAuto: false });
  });
});
