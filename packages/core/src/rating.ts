import { RATING_LABELS, SHUFFLEABLE_MIN_RATING, type Rating, type Track } from "./types.js";

export function isValidRating(value: number): value is Rating {
  return Number.isInteger(value) && value >= 0 && value <= 5;
}

export function ratingLabel(rating: Rating): string {
  return rating === 0 ? "unrated" : RATING_LABELS[rating];
}

/** Whether a track is eligible for shuffle / random playback (3–5 stars by default). */
export function isShuffleable(rating: Rating, minRating: Rating = SHUFFLEABLE_MIN_RATING): boolean {
  return rating >= minRating;
}

export function filterShuffleable(tracks: readonly Track[], minRating: Rating = SHUFFLEABLE_MIN_RATING): Track[] {
  return tracks.filter((track) => isShuffleable(track.rating, minRating));
}

/**
 * Fisher–Yates shuffle restricted to tracks at or above `minRating` (3★ by
 * default, per the "shuffle skips 1★/2★" rule — lower via Settings' "include
 * 1-2 star tracks"). Falls back to shuffling the full list when nothing meets
 * that bar, so a queue of only low-rated/unrated tracks still plays instead
 * of silently producing an empty queue.
 */
export function shuffleTracks(
  tracks: readonly Track[],
  minRating: Rating = SHUFFLEABLE_MIN_RATING,
  rng: () => number = Math.random,
): Track[] {
  const eligible = filterShuffleable(tracks, minRating);
  const pool = eligible.length > 0 ? eligible : [...tracks];
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
