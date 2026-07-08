import type { AutoPlaylist, AutoPlaylistId, Playlist, Track, TrackPlaylistLink } from "./types.js";

export const AUTO_PLAYLISTS: readonly AutoPlaylist[] = [
  { id: "auto-ultrafavorites", name: "Ultrafavorites", emoji: "💖", minRating: 5, maxRating: 5 },
  { id: "auto-great", name: "Great", emoji: "🌟", minRating: 4, maxRating: 4 },
  { id: "auto-liked", name: "Liked", emoji: "👍", minRating: 3, maxRating: 3 },
  { id: "auto-all-favorites", name: "All favorites", emoji: "✨", minRating: 3, maxRating: 5 },
];

export function getAutoPlaylistTracks(
  tracks: readonly Track[],
  autoPlaylistId: AutoPlaylistId,
): Track[] {
  const auto = AUTO_PLAYLISTS.find((entry) => entry.id === autoPlaylistId);
  if (!auto) return [];
  return tracks.filter((track) => track.rating >= auto.minRating && track.rating <= auto.maxRating);
}

/** Tracks that belong to a user-created (non-auto) playlist. */
export function getPlaylistTracks(
  tracks: readonly Track[],
  links: readonly TrackPlaylistLink[],
  playlistId: string,
): Track[] {
  const trackIds = new Set(
    links.filter((link) => link.playlistId === playlistId).map((link) => link.trackId),
  );
  return tracks.filter((track) => trackIds.has(track.id));
}

export function isTrackInPlaylist(
  links: readonly TrackPlaylistLink[],
  trackId: string,
  playlistId: string,
): boolean {
  return links.some((link) => link.trackId === trackId && link.playlistId === playlistId);
}

/** Toggles a track's membership in a playlist, returning the next link list. */
export function toggleTrackInPlaylist(
  links: readonly TrackPlaylistLink[],
  trackId: string,
  playlistId: string,
): TrackPlaylistLink[] {
  if (isTrackInPlaylist(links, trackId, playlistId)) {
    return links.filter((link) => !(link.trackId === trackId && link.playlistId === playlistId));
  }
  return [...links, { trackId, playlistId }];
}

/**
 * The track to use as a playlist's cover — the first track added to it that
 * still exists in the library. Relies on `links` preserving insertion order
 * (the SQL behind `allTrackPlaylistLinks` is ordered by `rowid ASC`).
 */
export function getPlaylistCoverTrack(
  tracks: readonly Track[],
  links: readonly TrackPlaylistLink[],
  playlistId: string,
): Track | null {
  for (const link of links) {
    if (link.playlistId !== playlistId) continue;
    const track = tracks.find((t) => t.id === link.trackId);
    if (track) return track;
  }
  return null;
}

export interface PlaylistCarouselItem {
  id: string;
  name: string;
  emoji: string;
  isAuto: boolean;
}

/** Combines user playlists with the always-present auto-lists, in carousel order. */
export function buildPlaylistCarousel(playlists: readonly Playlist[]): PlaylistCarouselItem[] {
  const autoItems: PlaylistCarouselItem[] = AUTO_PLAYLISTS.map((auto) => ({
    id: auto.id,
    name: auto.name,
    emoji: auto.emoji,
    isAuto: true,
  }));
  const userItems: PlaylistCarouselItem[] = playlists.map((playlist) => ({
    id: playlist.id,
    name: playlist.name,
    emoji: playlist.emoji,
    isAuto: false,
  }));
  return [...autoItems, ...userItems];
}
