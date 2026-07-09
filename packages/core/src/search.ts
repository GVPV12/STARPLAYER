import type { Track } from "./types.js";

/** Case-insensitive substring match against title, artist, and album. Empty/blank query returns no results. */
export function searchTracks(tracks: readonly Track[], query: string): Track[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return tracks.filter(
    (track) =>
      track.title.toLowerCase().includes(needle) ||
      track.artist.toLowerCase().includes(needle) ||
      track.album.toLowerCase().includes(needle),
  );
}
