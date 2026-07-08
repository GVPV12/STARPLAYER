import { RATING_LABELS, SHUFFLEABLE_MIN_RATING, type Rating, type Track } from "./types.js";

export function isValidRating(value: number): value is Rating {
  return Number.isInteger(value) && value >= 0 && value <= 5;
}

export function ratingLabel(rating: Rating): string {
  return rating === 0 ? "unrated" : RATING_LABELS[rating];
}

/** Whether a track is eligible for shuffle / random playback (3–5 stars only). */
export function isShuffleable(rating: Rating): boolean {
  return rating >= SHUFFLEABLE_MIN_RATING;
}

export function filterShuffleable(tracks: readonly Track[]): Track[] {
  return tracks.filter((track) => isShuffleable(track.rating));
}

/** Fisher–Yates shuffle restricted to 3–5★ tracks, per the "shuffle skips 1★/2★" rule. */
export function shuffleTracks(tracks: readonly Track[], rng: () => number = Math.random): Track[] {
  const pool = filterShuffleable(tracks);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool;
}

export type FavoritesSubRating = 3 | 4 | 5;

/** Filters tracks for "Favorites mode" — a single sub-rating, or all 3–5★ combined. */
export function filterFavorites(
  tracks: readonly Track[],
  subRating: FavoritesSubRating | "all",
): Track[] {
  if (subRating === "all") return filterShuffleable(tracks);
  return tracks.filter((track) => track.rating === subRating);
}
