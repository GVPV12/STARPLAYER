/** Exponent for the perceptual (logarithmic-feeling) volume curve. */
const VOLUME_CURVE_EXPONENT = 2.5;

export const VOLUME_MIN = 0;
export const VOLUME_MAX = 100;
export const VOLUME_STEP = 5;

export function clampVolume(value: number): number {
  if (Number.isNaN(value)) return VOLUME_MIN;
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, value));
}

/**
 * Converts a 0–100 slider value into the 0–1 gain to assign to an audio
 * element's `.volume`. Human loudness perception is roughly logarithmic, so a
 * plain linear mapping makes the bottom half of the slider feel like it does
 * nothing and the top half feel too sudden. Raising the normalized slider
 * value to a power > 1 compresses the low end and expands the high end to
 * match that perception.
 */
export function sliderToGain(sliderValue: number): number {
  const normalized = clampVolume(sliderValue) / VOLUME_MAX;
  return Math.pow(normalized, VOLUME_CURVE_EXPONENT);
}

/** Inverse of `sliderToGain`, for restoring a slider position from a stored gain. */
export function gainToSlider(gain: number): number {
  const clampedGain = Math.min(1, Math.max(0, gain));
  const normalized = Math.pow(clampedGain, 1 / VOLUME_CURVE_EXPONENT);
  return clampVolume(normalized * VOLUME_MAX);
}

export type SpeakerIconLevel = "muted" | "low" | "medium" | "high";

export function speakerIconLevel(sliderValue: number, muted: boolean): SpeakerIconLevel {
  if (muted || sliderValue <= 0) return "muted";
  if (sliderValue <= 33) return "low";
  if (sliderValue <= 66) return "medium";
  return "high";
}

export interface VolumeState {
  value: number;
  muted: boolean;
  /** Value to restore when unmuting. */
  previousValue: number;
}

export function createVolumeState(initialValue = 80): VolumeState {
  const value = clampVolume(initialValue);
  return { value, muted: false, previousValue: value };
}

export function setVolume(nextValue: number): VolumeState {
  const value = clampVolume(nextValue);
  // Moving the slider while muted implicitly unmutes, matching how physical
  // volume knobs / OS sliders behave.
  return { value, muted: false, previousValue: value };
}

export function nudgeVolume(state: VolumeState, delta: number): VolumeState {
  return setVolume(state.value + delta);
}

export function toggleMute(state: VolumeState): VolumeState {
  if (state.muted) {
    return { value: state.previousValue, muted: false, previousValue: state.previousValue };
  }
  return { value: 0, muted: true, previousValue: state.value > 0 ? state.value : state.previousValue };
}
