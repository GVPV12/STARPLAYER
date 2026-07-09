import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createDefaultSettings,
  type BeatSkinMapping,
  type Language,
  type LibraryViewMode,
  type Settings,
  type SkinMode,
  type VisualizerColorMode,
  type VisualizerStyle,
} from "@starplayer/core";

export interface SettingsStoreState extends Settings {
  customSkins: import("@starplayer/core").Skin[];
  setLanguage: (language: Language) => void;
  setLaunchAtStartup: (value: boolean) => void;
  setSkinMode: (mode: SkinMode) => void;
  setActiveSkinId: (skinId: string) => void;
  setBeatSkinMap: (map: BeatSkinMapping[]) => void;
  addLibraryFolder: (path: string) => void;
  removeLibraryFolder: (path: string) => void;
  setLibraryViewMode: (mode: LibraryViewMode) => void;
  setVisualizerEnabled: (enabled: boolean) => void;
  setVisualizerStyle: (style: VisualizerStyle) => void;
  setVisualizerRandomStyle: (random: boolean) => void;
  setVisualizerColorMode: (mode: VisualizerColorMode) => void;
  setVisualizerRelaxedColor: (color: string) => void;
  setVisualizerEnergeticColor: (color: string) => void;
  setShuffleIncludeLowRated: (value: boolean) => void;
  addCustomSkin: (skin: import("@starplayer/core").Skin) => void;
  /** Resets everything except language back to defaults — used by "delete all data". */
  resetForDataWipe: () => void;
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      ...createDefaultSettings(),
      customSkins: [],
      setLanguage: (language) => set({ language }),
      setLaunchAtStartup: (launchAtStartup) => set({ launchAtStartup }),
      setSkinMode: (skinMode) => set({ skinMode }),
      setActiveSkinId: (activeSkinId) => set({ activeSkinId }),
      setBeatSkinMap: (beatSkinMap) => set({ beatSkinMap }),
      addLibraryFolder: (path) =>
        set((state) => (state.libraryFolders.includes(path) ? state : { libraryFolders: [...state.libraryFolders, path] })),
      removeLibraryFolder: (path) =>
        set((state) => ({ libraryFolders: state.libraryFolders.filter((p) => p !== path) })),
      setLibraryViewMode: (libraryViewMode) => set({ libraryViewMode }),
      setVisualizerEnabled: (visualizerEnabled) => set({ visualizerEnabled }),
      setVisualizerStyle: (visualizerStyle) => set({ visualizerStyle }),
      setVisualizerRandomStyle: (visualizerRandomStyle) => set({ visualizerRandomStyle }),
      setVisualizerColorMode: (visualizerColorMode) => set({ visualizerColorMode }),
      setVisualizerRelaxedColor: (visualizerRelaxedColor) => set({ visualizerRelaxedColor }),
      setVisualizerEnergeticColor: (visualizerEnergeticColor) => set({ visualizerEnergeticColor }),
      setShuffleIncludeLowRated: (shuffleIncludeLowRated) => set({ shuffleIncludeLowRated }),
      addCustomSkin: (skin) => set((state) => ({ customSkins: [...state.customSkins, skin] })),
      resetForDataWipe: () =>
        set((state) => ({
          ...createDefaultSettings(),
          language: state.language,
          customSkins: [],
        })),
    }),
    { name: "starplayer:settings" },
  ),
);
