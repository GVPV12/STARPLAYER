import { describe, expect, it } from "vitest";
import {
  clampVolume,
  createVolumeState,
  gainToSlider,
  nudgeVolume,
  setVolume,
  sliderToGain,
  speakerIconLevel,
  toggleMute,
} from "./volume.js";

describe("sliderToGain", () => {
  it("maps 0 and 100 to 0 and 1", () => {
    expect(sliderToGain(0)).toBe(0);
    expect(sliderToGain(100)).toBe(1);
  });

  it("uses a curve where the second half of the slider matters more than the first", () => {
    const gainAt50 = sliderToGain(50);
    const gainAt100 = sliderToGain(100);
    // 50 -> 100 should move gain by more than 0 -> 50 (perceptual curve, not linear).
    const firstHalfDelta = gainAt50 - sliderToGain(0);
    const secondHalfDelta = gainAt100 - gainAt50;
    expect(secondHalfDelta).toBeGreaterThan(firstHalfDelta);
  });

  it("clamps out-of-range input", () => {
    expect(sliderToGain(-20)).toBe(0);
    expect(sliderToGain(150)).toBe(1);
  });
});

describe("gainToSlider", () => {
  it("round-trips with sliderToGain", () => {
    for (const value of [0, 25, 50, 75, 100]) {
      expect(gainToSlider(sliderToGain(value))).toBeCloseTo(value, 5);
    }
  });
});

describe("speakerIconLevel", () => {
  it("returns muted when muted flag is set regardless of value", () => {
    expect(speakerIconLevel(80, true)).toBe("muted");
  });

  it("returns muted at 0", () => {
    expect(speakerIconLevel(0, false)).toBe("muted");
  });

  it("buckets low/medium/high correctly", () => {
    expect(speakerIconLevel(20, false)).toBe("low");
    expect(speakerIconLevel(50, false)).toBe("medium");
    expect(speakerIconLevel(90, false)).toBe("high");
  });
});

describe("volume state machine", () => {
  it("starts at the given initial value, unmuted", () => {
    const state = createVolumeState(80);
    expect(state).toEqual({ value: 80, muted: false, previousValue: 80 });
  });

  it("setVolume clamps and implicitly unmutes", () => {
    const next = setVolume(40);
    expect(next).toEqual({ value: 40, muted: false, previousValue: 40 });
  });

  it("nudgeVolume moves by a relative delta and clamps at bounds", () => {
    const state = createVolumeState(98);
    expect(nudgeVolume(state, 5).value).toBe(100);
    expect(nudgeVolume(createVolumeState(2), -5).value).toBe(0);
  });

  it("toggleMute preserves the previous value for unmuting", () => {
    const state = createVolumeState(70);
    const muted = toggleMute(state);
    expect(muted).toEqual({ value: 0, muted: true, previousValue: 70 });
    const unmuted = toggleMute(muted);
    expect(unmuted).toEqual({ value: 70, muted: false, previousValue: 70 });
  });
});

describe("clampVolume", () => {
  it("treats NaN as 0", () => {
    expect(clampVolume(Number.NaN)).toBe(0);
  });
});
