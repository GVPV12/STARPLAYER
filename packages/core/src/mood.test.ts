import { describe, expect, it } from "vitest";
import { classifyMood, resolveSkinForMood } from "./mood.js";

describe("classifyMood", () => {
  it("returns neutral when BPM is unknown", () => {
    expect(classifyMood(null)).toBe("neutral");
  });

  it("classifies low BPM as sad by default, ambient with a dull spectral centroid", () => {
    expect(classifyMood(60)).toBe("sad");
    expect(classifyMood(60, 500)).toBe("ambient");
  });

  it("classifies mid BPM ranges", () => {
    expect(classifyMood(80)).toBe("calm");
    expect(classifyMood(120)).toBe("retro");
  });

  it("classifies high BPM as synthwave then energetic", () => {
    expect(classifyMood(140)).toBe("synthwave");
    expect(classifyMood(170)).toBe("energetic");
  });
});

describe("resolveSkinForMood", () => {
  it("falls back to vaporwave when a mood has no mapping entry", () => {
    expect(resolveSkinForMood("neutral", [])).toBe("vaporwave");
  });

  it("uses the provided mapping when present", () => {
    expect(resolveSkinForMood("sad", [{ mood: "sad", skinId: "soft-glass" }])).toBe("soft-glass");
  });
});
