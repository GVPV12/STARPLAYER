import { useState } from "react";
import { useTranslation } from "react-i18next";
import { disable as disableAutostart, enable as enableAutostart } from "@tauri-apps/plugin-autostart";
import {
  BUILT_IN_SKINS,
  type BeatSkinMapping,
  type Language,
  type MoodTag,
  type SkinMode,
  type VisualizerColorMode,
  type VisualizerStyle,
} from "@starplayer/core";
import { useSkin } from "@starplayer/ui";
import { useSettingsStore } from "../store/settingsStore.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useFavoritesModeStore } from "../store/favoritesModeStore.js";
import { pickLibraryFolder } from "../lib/scanner.js";
import { useForgetLibraryFolderMutation, useScanLibraryMutation, useWipeAllDataMutation } from "../lib/queries.js";
import { ConfirmModal } from "../components/ConfirmModal.js";
import { LoadingOverlay } from "../components/LoadingOverlay.js";
import styles from "./SettingsScreen.module.css";

const MOOD_TAGS: MoodTag[] = ["sad", "calm", "ambient", "retro", "synthwave", "lofi", "energetic", "neutral"];

export interface SettingsScreenProps {
  onOpenCustomSkin: () => void;
  onDataWiped: () => void;
}

export function SettingsScreen({ onOpenCustomSkin, onDataWiped }: SettingsScreenProps) {
  const { t, i18n } = useTranslation();
  const skin = useSkin();
  const settings = useSettingsStore();
  const scanMutation = useScanLibraryMutation();
  const forgetMutation = useForgetLibraryFolderMutation();
  const wipeMutation = useWipeAllDataMutation();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const allSkins = [...BUILT_IN_SKINS, ...settings.customSkins];

  async function handleLaunchToggle(checked: boolean) {
    settings.setLaunchAtStartup(checked);
    try {
      if (checked) await enableAutostart();
      else await disableAutostart();
    } catch {
      // autostart plugin may be unavailable outside a real Tauri runtime (e.g. plain `vite dev`)
    }
  }

  function handleLanguageChange(language: Language) {
    settings.setLanguage(language);
    void i18n.changeLanguage(language);
  }

  function updateMoodMapping(mood: MoodTag, skinId: string) {
    const next: BeatSkinMapping[] = settings.beatSkinMap.some((m) => m.mood === mood)
      ? settings.beatSkinMap.map((m) => (m.mood === mood ? { mood, skinId } : m))
      : [...settings.beatSkinMap, { mood, skinId }];
    settings.setBeatSkinMap(next);
  }

  async function handleAddFolder() {
    const folder = await pickLibraryFolder();
    if (!folder) return;
    settings.addLibraryFolder(folder);
    try {
      await scanMutation.mutateAsync({ path: folder });
    } catch {
      // Surfaced via scanMutation.isError/error for the toolbar to show if needed;
      // swallowed here so a failed scan (e.g. folder became unreadable) doesn't
      // turn into an unhandled promise rejection.
    }
  }

  async function handleRescanFolder(folder: string) {
    try {
      await scanMutation.mutateAsync({ path: folder });
    } catch {
      // See handleAddFolder.
    }
  }

  async function handleForgetFolder(folder: string) {
    settings.removeLibraryFolder(folder);
    try {
      await forgetMutation.mutateAsync(folder);
    } catch {
      // Folder's tracks may already be gone; nothing actionable for the user here.
    }
  }

  async function handleConfirmDeleteAllData() {
    setConfirmDeleteOpen(false);
    setIsDeleting(true);
    try {
      const player = usePlayerStore.getState();
      player.backend?.pause();
      usePlayerStore.setState({
        queue: [],
        unshuffledQueue: [],
        history: [],
        currentIndex: -1,
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      });
      useFavoritesModeStore.getState().setActive(false);
      await wipeMutation.mutateAsync();
      settings.resetForDataWipe();
    } catch {
      // The delete is best-effort — even a partial failure means we still
      // want to drop back to the library screen rather than getting stuck.
    } finally {
      setIsDeleting(false);
      onDataWiped();
    }
  }

  return (
    <div className={styles.wrap} data-skin={skin.id}>
      <h2 className={styles.heading} data-skin={skin.id}>
        {t("settings.title")}
      </h2>

      <label className={styles.row}>
        <span>{t("settings.launchAtStartup")}</span>
        <input
          type="checkbox"
          checked={settings.launchAtStartup}
          onChange={(e) => void handleLaunchToggle(e.target.checked)}
        />
      </label>

      <label className={styles.row}>
        <span>{t("settings.language")}</span>
        <select value={settings.language} onChange={(e) => handleLanguageChange(e.target.value as Language)}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </label>

      <label className={styles.row}>
        <span>{t("settings.skinMode")}</span>
        <select
          value={settings.skinMode}
          onChange={(e) => settings.setSkinMode(e.target.value as SkinMode)}
        >
          <option value="manual">{t("settings.skinModeManual")}</option>
          <option value="random-on-startup">{t("settings.skinModeRandom")}</option>
          <option value="beat-adaptive">{t("settings.skinModeBeatAdaptive")}</option>
        </select>
      </label>

      {settings.skinMode !== "beat-adaptive" ? (
        <label className={styles.row}>
          <span>Skin</span>
          <select value={settings.activeSkinId} onChange={(e) => settings.setActiveSkinId(e.target.value)}>
            {allSkins.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className={styles.mappingBlock}>
          <span className={styles.mappingTitle}>{t("settings.beatMapping")}</span>
          {MOOD_TAGS.map((mood) => (
            <label key={mood} className={styles.row}>
              <span>{t(`moods.${mood}`)}</span>
              <select
                value={settings.beatSkinMap.find((m) => m.mood === mood)?.skinId ?? allSkins[0]!.id}
                onChange={(e) => updateMoodMapping(mood, e.target.value)}
              >
                {allSkins.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <button type="button" className={styles.linkButton} onClick={onOpenCustomSkin}>
        {t("settings.customSkin")} →
      </button>

      <div className={styles.mappingBlock}>
        <span className={styles.mappingTitle}>{t("settings.visualizer")}</span>

        <label className={styles.row}>
          <span>{t("settings.visualizerEnabled")}</span>
          <input
            type="checkbox"
            checked={settings.visualizerEnabled}
            onChange={(e) => settings.setVisualizerEnabled(e.target.checked)}
          />
        </label>

        {settings.visualizerEnabled ? (
          <>
            <label className={styles.row}>
              <span>{t("settings.visualizerRandomStyle")}</span>
              <input
                type="checkbox"
                checked={settings.visualizerRandomStyle}
                onChange={(e) => settings.setVisualizerRandomStyle(e.target.checked)}
              />
            </label>

            {!settings.visualizerRandomStyle ? (
              <label className={styles.row}>
                <span>{t("settings.visualizerStyle")}</span>
                <select
                  value={settings.visualizerStyle}
                  onChange={(e) => settings.setVisualizerStyle(e.target.value as VisualizerStyle)}
                >
                  <option value="bars">{t("settings.visualizerStyleBars")}</option>
                  <option value="dots">{t("settings.visualizerStyleDots")}</option>
                  <option value="wave">{t("settings.visualizerStyleWave")}</option>
                  <option value="ring">{t("settings.visualizerStyleRing")}</option>
                  <option value="circle">{t("settings.visualizerStyleCircle")}</option>
                </select>
              </label>
            ) : null}

            <label className={styles.row}>
              <span>{t("settings.visualizerColorMode")}</span>
              <select
                value={settings.visualizerColorMode}
                onChange={(e) => settings.setVisualizerColorMode(e.target.value as VisualizerColorMode)}
              >
                <option value="rainbow">{t("settings.visualizerColorModeRainbow")}</option>
                <option value="duo">{t("settings.visualizerColorModeDuo")}</option>
              </select>
            </label>

            {settings.visualizerColorMode === "duo" ? (
              <>
                <label className={styles.row}>
                  <span>{t("settings.visualizerRelaxedColor")}</span>
                  <input
                    type="color"
                    value={settings.visualizerRelaxedColor}
                    onChange={(e) => settings.setVisualizerRelaxedColor(e.target.value)}
                  />
                </label>

                <label className={styles.row}>
                  <span>{t("settings.visualizerEnergeticColor")}</span>
                  <input
                    type="color"
                    value={settings.visualizerEnergeticColor}
                    onChange={(e) => settings.setVisualizerEnergeticColor(e.target.value)}
                  />
                </label>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      <div className={styles.libraryBlock}>
        <span className={styles.mappingTitle}>{t("settings.libraryPath")}</span>
        {settings.libraryFolders.length === 0 ? (
          <span className={styles.pathText}>—</span>
        ) : (
          settings.libraryFolders.map((folder) => (
            <div key={folder} className={styles.folderRow}>
              <span className={styles.pathText}>{folder}</span>
              <div className={styles.libraryButtons}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => void handleRescanFolder(folder)}
                  disabled={scanMutation.isPending}
                >
                  {t("settings.rescanLibrary")}
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => void handleForgetFolder(folder)}>
                  {t("settings.forgetFolder")}
                </button>
              </div>
            </div>
          ))
        )}
        <button type="button" className={styles.secondaryButton} onClick={() => void handleAddFolder()}>
          + {t("player.addFolder")}
        </button>
      </div>

      <div className={styles.dangerZone}>
        <span className={styles.mappingTitle}>{t("settings.dangerZone")}</span>
        <button type="button" className={styles.deleteButton} onClick={() => setConfirmDeleteOpen(true)}>
          {t("settings.deleteData")}
        </button>
      </div>

      <div className={styles.about}>
        <span>{t("settings.about")}</span>
        <span className={styles.pathText}>STARPLAYER — {t("settings.version")} 0.1.0</span>
      </div>

      <ConfirmModal
        open={confirmDeleteOpen}
        title={t("settings.deleteDataConfirmTitle")}
        message={t("settings.deleteDataConfirmMessage")}
        confirmLabel={t("settings.deleteDataConfirm")}
        cancelLabel={t("playlists.cancel")}
        danger
        onConfirm={() => void handleConfirmDeleteAllData()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
      <LoadingOverlay open={isDeleting} message={t("settings.deletingData")} />
    </div>
  );
}
