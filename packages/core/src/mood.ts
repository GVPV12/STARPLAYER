import type { BeatSkinMapping, MoodTag } from "./types.js";

/**
 * Heuristic mood classifier from BPM (+ optional spectral centroid).
 *
 * This is intentionally a simple heuristic, not ML: BPM buckets map to a mood
 * tag, and a low spectral centroid (bass-heavy / dull timbre) nudges borderline
 * tempos toward "calm"/"ambient" while a high centroid (bright/harsh timbre)
 * nudges toward "energetic". Callers should cache the result per track after
 * first analysis (see `tracks.mood` column).
 */
export function classifyMood(
  bpm: number | null,
  spectralCentroidHz: number | null = null,
): MoodTag {
  if (bpm === null) return "neutral";

  if (bpm < 70) {
    return spectralCentroidHz !== null && spectralCentroidHz < 1000 ? "ambient" : "sad";
  }
  if (bpm < 90) {
    return "calm";
  }
  if (bpm < 110) {
    return spectralCentroidHz !== null && spectralCentroidHz > 2500 ? "energetic" : "lofi";
  }
  if (bpm < 128) {
    return "retro";
  }
  if (bpm < 150) {
    return "synthwave";
  }
  return "energetic";
}

/** Default mood → skin mapping used when beat-adaptive mode is first enabled. */
export const DEFAULT_BEAT_SKIN_MAP: BeatSkinMapping[] = [
  { mood: "sad", skinId: "soft-glass" },
  { mood: "calm", skinId: "soft-glass" },
  { mood: "ambient", skinId: "gradient-glass" },
  { mood: "retro", skinId: "vaporwave" },
  { mood: "synthwave", skinId: "vaporwave" },
  { mood: "lofi", skinId: "monochrome-retro" },
  { mood: "energetic", skinId: "neo-brutalist-cute" },
  { mood: "neutral", skinId: "vaporwave" },
];

export function resolveSkinForMood(
  mood: MoodTag,
  mapping: readonly BeatSkinMapping[] = DEFAULT_BEAT_SKIN_MAP,
): string {
  const match = mapping.find((entry) => entry.mood === mood);
  return match?.skinId ?? "vaporwave";
}
