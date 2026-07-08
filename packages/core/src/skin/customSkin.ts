import type { Skin, SkinRenderMode, SkinTokens } from "../types.js";
import { VAPORWAVE_SKIN } from "./skins.js";

let customSkinCounter = 0;

/** Creates a fresh id for a user-authored skin. Stable within a session; callers persist the result. */
export function createCustomSkinId(): string {
  customSkinCounter += 1;
  return `custom-${Date.now()}-${customSkinCounter}`;
}

export interface CustomSkinDraft {
  name: string;
  mode: SkinRenderMode;
  tokens: SkinTokens;
}

/** Starts a new custom-skin draft, optionally remixing an existing skin's tokens. */
export function remixSkin(base: Skin = VAPORWAVE_SKIN): CustomSkinDraft {
  return {
    name: `${base.name} (remix)`,
    mode: base.mode,
    tokens: { ...base.tokens },
  };
}

export function finalizeCustomSkin(draft: CustomSkinDraft): Skin {
  return {
    id: createCustomSkinId(),
    name: draft.name.trim() || "Untitled Skin",
    mode: draft.mode,
    tokens: draft.tokens,
    isCustom: true,
  };
}
