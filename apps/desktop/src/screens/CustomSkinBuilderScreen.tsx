import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BUILT_IN_SKINS,
  finalizeCustomSkin,
  remixSkin,
  type CustomSkinDraft,
  type SkinRenderMode,
} from "@starplayer/core";
import { useSkin } from "@starplayer/ui";
import { useSettingsStore } from "../store/settingsStore.js";
import styles from "./CustomSkinBuilderScreen.module.css";

const FONT_OPTIONS = [
  "'VT323', monospace",
  "'Silkscreen', monospace",
  "'DotGothic16', monospace",
  "'Space Grotesk', sans-serif",
  "'Inter', sans-serif",
  "'Fraunces', serif",
];

export interface CustomSkinBuilderScreenProps {
  onSaved: () => void;
}

export function CustomSkinBuilderScreen({ onSaved }: CustomSkinBuilderScreenProps) {
  const { t } = useTranslation();
  const skin = useSkin();
  const addCustomSkin = useSettingsStore((s) => s.addCustomSkin);
  const setActiveSkinId = useSettingsStore((s) => s.setActiveSkinId);
  const customSkins = useSettingsStore((s) => s.customSkins);

  const allBaseSkins = [...BUILT_IN_SKINS, ...customSkins];
  const [baseId, setBaseId] = useState(allBaseSkins[0]!.id);
  const [draft, setDraft] = useState<CustomSkinDraft>(() => remixSkin(allBaseSkins[0]));

  function handleBaseChange(id: string) {
    setBaseId(id);
    const base = allBaseSkins.find((s) => s.id === id);
    setDraft(remixSkin(base));
  }

  function updateToken<K extends keyof CustomSkinDraft["tokens"]>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, tokens: { ...prev.tokens, [key]: value } }));
  }

  function handleSave() {
    const saved = finalizeCustomSkin(draft);
    addCustomSkin(saved);
    setActiveSkinId(saved.id);
    onSaved();
  }

  return (
    <div className={styles.wrap} data-skin={skin.id}>
      <h2 className={styles.heading} data-skin={skin.id}>
        {t("customSkin.title")}
      </h2>

      <label className={styles.row}>
        <span>{t("customSkin.startFrom")}</span>
        <select value={baseId} onChange={(e) => handleBaseChange(e.target.value)}>
          {allBaseSkins.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.row}>
        <span>{t("customSkin.name")}</span>
        <input
          value={draft.name}
          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
        />
      </label>

      <label className={styles.row}>
        <span>{t("customSkin.mode")}</span>
        <select
          value={draft.mode}
          onChange={(e) => setDraft((prev) => ({ ...prev, mode: e.target.value as SkinRenderMode }))}
        >
          <option value="pixel">{t("customSkin.modePixel")}</option>
          <option value="modern">{t("customSkin.modeModern")}</option>
        </select>
      </label>

      <div className={styles.colorGrid}>
        <label className={styles.colorRow}>
          <span>bg</span>
          <input type="color" value={toHex(draft.tokens.bg)} onChange={(e) => updateToken("bg", e.target.value)} />
        </label>
        <label className={styles.colorRow}>
          <span>surface</span>
          <input
            type="color"
            value={toHex(draft.tokens.surface)}
            onChange={(e) => updateToken("surface", e.target.value)}
          />
        </label>
        <label className={styles.colorRow}>
          <span>border</span>
          <input
            type="color"
            value={toHex(draft.tokens.border)}
            onChange={(e) => updateToken("border", e.target.value)}
          />
        </label>
        <label className={styles.colorRow}>
          <span>accent 1</span>
          <input
            type="color"
            value={toHex(draft.tokens.accent1)}
            onChange={(e) => updateToken("accent1", e.target.value)}
          />
        </label>
        <label className={styles.colorRow}>
          <span>accent 2</span>
          <input
            type="color"
            value={toHex(draft.tokens.accent2)}
            onChange={(e) => updateToken("accent2", e.target.value)}
          />
        </label>
        <label className={styles.colorRow}>
          <span>text</span>
          <input
            type="color"
            value={toHex(draft.tokens.textPrimary)}
            onChange={(e) => updateToken("textPrimary", e.target.value)}
          />
        </label>
      </div>

      <label className={styles.row}>
        <span>Font</span>
        <select value={draft.tokens.fontDisplay} onChange={(e) => {
          updateToken("fontDisplay", e.target.value);
          updateToken("fontBody", e.target.value);
        }}>
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font}>
              {font.split(",")[0]}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.row}>
        <span>{t("customSkin.radius")}</span>
        <input
          type="range"
          min={0}
          max={32}
          value={parseInt(draft.tokens.radius, 10) || 0}
          onChange={(e) => updateToken("radius", `${e.target.value}px`)}
        />
      </label>

      <div className={styles.preview} style={{
        background: draft.tokens.surface,
        border: `2px solid ${draft.tokens.border}`,
        borderRadius: draft.tokens.radius,
        color: draft.tokens.textPrimary,
        fontFamily: draft.tokens.fontDisplay,
      }}>
        <span style={{ color: draft.tokens.accent1 }}>{draft.name}</span>
      </div>

      <button type="button" className={styles.saveButton} onClick={handleSave}>
        {t("customSkin.save")}
      </button>
    </div>
  );
}

function toHex(color: string): string {
  if (color.startsWith("#") && (color.length === 7 || color.length === 4)) return color;
  return "#888888";
}
