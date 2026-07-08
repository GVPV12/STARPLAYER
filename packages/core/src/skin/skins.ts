import type { Skin } from "../types.js";

/**
 * Built-in skin token values.
 * Colors/fonts are derived from the reference images in `references/`;
 * treat these as a starting point and adjust to taste against the images.
 */
export const VAPORWAVE_SKIN: Skin = {
  id: "vaporwave",
  name: "Vaporwave",
  mode: "pixel",
  tokens: {
    bg: "#0a0420",
    surface: "#1a0f3d",
    border: "#00e5ff",
    textPrimary: "#f2f0ff",
    textMuted: "#9a8fc9",
    accent1: "#ff2bd6",
    accent2: "#00e5ff",
    fontDisplay: "'Silkscreen', monospace",
    fontBody: "'Silkscreen', monospace",
    radius: "0px",
    pixelScale: "2",
    glow: "0 0 14px",
  },
};

export const NEO_BRUTALIST_CUTE_SKIN: Skin = {
  id: "neo-brutalist-cute",
  name: "Neo-Brutalist Cute",
  mode: "pixel",
  tokens: {
    bg: "#f5c77a",
    surface: "#fff6e9",
    border: "#111111",
    textPrimary: "#1a1208",
    textMuted: "#7a5c33",
    accent1: "#ff3e8e",
    accent2: "#ff8a3d",
    fontDisplay: "'Silkscreen', monospace",
    fontBody: "'Silkscreen', monospace",
    radius: "6px",
    pixelScale: "2",
    glow: "3px 3px 0",
  },
};

export const GRADIENT_GLASS_SKIN: Skin = {
  id: "gradient-glass",
  name: "Gradient Glass",
  mode: "modern",
  tokens: {
    bg: "#000000",
    surface: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.2)",
    textPrimary: "#ffffff",
    textMuted: "rgba(255,255,255,0.6)",
    accent1: "#8b5cf6",
    accent2: "#ec4899",
    fontDisplay: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
    radius: "24px",
    pixelScale: "1",
    glow: "0 0 24px",
  },
};

export const MONOCHROME_RETRO_SKIN: Skin = {
  id: "monochrome-retro",
  name: "Monochrome Retro",
  mode: "pixel",
  tokens: {
    bg: "#ffffff",
    surface: "#ffffff",
    border: "#000000",
    textPrimary: "#000000",
    textMuted: "#555555",
    accent1: "#000000",
    accent2: "#ffffff",
    fontDisplay: "'DotGothic16', monospace",
    fontBody: "'DotGothic16', monospace",
    radius: "0px",
    pixelScale: "1",
    glow: "none",
  },
};

export const SOFT_GLASS_SKIN: Skin = {
  id: "soft-glass",
  name: "Soft Glass",
  mode: "modern",
  tokens: {
    bg: "#aee1f9",
    surface: "rgba(255,255,255,0.35)",
    border: "rgba(255,255,255,0.5)",
    textPrimary: "#1b2b3a",
    textMuted: "#5b7086",
    accent1: "#7fb3d5",
    accent2: "#b9d8e8",
    fontDisplay: "'Fraunces', serif",
    fontBody: "'Inter', sans-serif",
    radius: "24px",
    pixelScale: "1",
    glow: "0 8px 32px",
  },
};

export const NEON_PINK_SKIN: Skin = {
  id: "neon-pink",
  name: "Neon Pink",
  mode: "modern",
  tokens: {
    bg: "#0c0512",
    surface: "rgba(255, 45, 149, 0.08)",
    border: "rgba(255, 45, 149, 0.35)",
    textPrimary: "#ffffff",
    textMuted: "rgba(255,255,255,0.62)",
    accent1: "#ff2d95",
    accent2: "#7b2ff7",
    fontDisplay: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
    radius: "20px",
    pixelScale: "1",
    glow: "0 0 24px",
  },
};

export const BUILT_IN_SKINS: readonly Skin[] = [
  VAPORWAVE_SKIN,
  NEO_BRUTALIST_CUTE_SKIN,
  GRADIENT_GLASS_SKIN,
  MONOCHROME_RETRO_SKIN,
  SOFT_GLASS_SKIN,
  NEON_PINK_SKIN,
];

export const DEFAULT_SKIN_ID = NEON_PINK_SKIN.id;

export function getSkinById(
  skinId: string,
  customSkins: readonly Skin[] = [],
): Skin | undefined {
  return (
    BUILT_IN_SKINS.find((skin) => skin.id === skinId) ??
    customSkins.find((skin) => skin.id === skinId)
  );
}
