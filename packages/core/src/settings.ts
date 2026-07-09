import { DEFAULT_BEAT_SKIN_MAP, resolveSkinForMood } from "./mood.js";
import { BUILT_IN_SKINS, DEFAULT_SKIN_ID } from "./skin/skins.js";
import type { Settings, Skin, Track } from "./types.js";

export function createDefaultSettings(): Settings {
  return {
    language: "en",
    launchAtStartup: false,
    skinMode: "manual",
    activeSkinId: DEFAULT_SKIN_ID,
    beatSkinMap: [...DEFAULT_BEAT_SKIN_MAP],
    libraryFolders: [],
    libraryViewMode: "list",
    visualizerEnabled: true,
    visualizerStyle: "bars",
    visualizerRandomStyle: false,
    visualizerColorMode: "rainbow",
    visualizerRelaxedColor: "#00e5ff",
    visualizerEnergeticColor: "#ff2bd6",
    volume: 80,
    muted: false,
    volumeBeforeMute: 80,
    shuffleIncludeLowRated: false,
  };
}

export function pickRandomSkin(
  skins: readonly Skin[] = BUILT_IN_SKINS,
  rng: () => number = Math.random,
): Skin {
  const index = Math.floor(rng() * skins.length);
  return skins[Math.min(index, skins.length - 1)]!;
}

/**
 * Resolves which skin id should be active given the current settings mode and
 * (if beat-adaptive) the currently playing track's cached mood.
 */
export function resolveActiveSkinId(settings: Settings, currentTrack: Track | null): string {
  switch (settings.skinMode) {
    case "manual":
      return settings.activeSkinId;
    case "random-on-startup":
      return settings.activeSkinId;
    case "beat-adaptive": {
      if (!currentTrack?.mood) return settings.activeSkinId;
      return resolveSkinForMood(currentTrack.mood, settings.beatSkinMap);
    }
    default:
      return settings.activeSkinId;
  }
}

/** Called once at app launch when skinMode is "random-on-startup". */
export function rollStartupSkin(settings: Settings, rng: () => number = Math.random): string {
  if (settings.skinMode !== "random-on-startup") return settings.activeSkinId;
  return pickRandomSkin(BUILT_IN_SKINS, rng).id;
}
