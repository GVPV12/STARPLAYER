import { createContext, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import type { Skin, SkinTokens } from "@starplayer/core";

const TOKEN_TO_CSS_VAR: Record<keyof SkinTokens, string> = {
  bg: "--bg",
  surface: "--surface",
  border: "--border",
  textPrimary: "--text-primary",
  textMuted: "--text-muted",
  accent1: "--accent-1",
  accent2: "--accent-2",
  fontDisplay: "--font-display",
  fontBody: "--font-body",
  radius: "--radius",
  pixelScale: "--pixel-scale",
  glow: "--glow",
};

const SkinContext = createContext<Skin | null>(null);

export interface SkinProviderProps {
  skin: Skin;
  children: ReactNode;
}

/**
 * Publishes the active skin to CSS custom properties on `documentElement` and
 * to a React context so components can also branch on `skin.mode` / `skin.id`
 * for structural (not just color) differences per skin.
 */
export function SkinProvider({ skin, children }: SkinProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS_VAR) as [keyof SkinTokens, string][]) {
      root.style.setProperty(cssVar, skin.tokens[key]);
    }
    root.dataset.skin = skin.id;
    root.dataset.skinMode = skin.mode;
  }, [skin]);

  const value = useMemo(() => skin, [skin]);

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
}

export function useSkin(): Skin {
  const skin = useContext(SkinContext);
  if (!skin) {
    throw new Error("useSkin() must be used within a <SkinProvider>");
  }
  return skin;
}
