import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_SKIN_ID,
  attachBackendSubscriptions,
  getSkinById,
  resolveActiveSkinId,
  rollStartupSkin,
} from "@starplayer/core";
import type { Track } from "@starplayer/core";
import { BackgroundLayer, SkinProvider, TopBar, WindowChrome } from "@starplayer/ui";
import { usePlayerStore } from "./store/playerStore.js";
import { useSettingsStore } from "./store/settingsStore.js";
import { useFavoritesModeStore } from "./store/favoritesModeStore.js";
import { createHtmlAudioBackend } from "./lib/audioBackend.js";
import { loadPersistedVolume, persistVolumeDebounced } from "./lib/volumePersistence.js";
import { LibraryScreen } from "./screens/LibraryScreen.js";
import { PlayerScreen } from "./screens/PlayerScreen.js";
import { SettingsScreen } from "./screens/SettingsScreen.js";
import { PlaylistManagerScreen } from "./screens/PlaylistManagerScreen.js";
import { PlaylistLibraryScreen } from "./screens/PlaylistLibraryScreen.js";
import { FavoritesScreen } from "./screens/FavoritesScreen.js";
import { CustomSkinBuilderScreen } from "./screens/CustomSkinBuilderScreen.js";
import { ScanningBanner } from "./components/ScanningBanner.js";

type ScreenId =
  | "library"
  | "player"
  | "settings"
  | "playlistLibrary"
  | "playlistManager"
  | "favorites"
  | "customSkin";

const KEY_IGNORE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function App() {
  const { t, i18n } = useTranslation();
  const settings = useSettingsStore();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const favoritesModeActive = useFavoritesModeStore((s) => s.active);
  const [screenStack, setScreenStack] = useState<ScreenId[]>(["library"]);
  const screen = screenStack[screenStack.length - 1]!;
  const [startupSkinRolled, setStartupSkinRolled] = useState(false);

  function navigateTo(next: ScreenId) {
    setScreenStack((stack) => (stack[stack.length - 1] === next ? stack : [...stack, next]));
  }

  function goBack() {
    setScreenStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
  }

  // Attach the audio backend + its store subscriptions exactly once.
  useEffect(() => {
    const backend = createHtmlAudioBackend();
    const persisted = loadPersistedVolume();
    if (persisted) {
      usePlayerStore.setState({ volume: persisted });
    }
    usePlayerStore.getState().setBackend(backend);
    const detach = attachBackendSubscriptions(usePlayerStore, backend);
    return detach;
  }, []);

  // Debounced volume persistence.
  useEffect(() => {
    return usePlayerStore.subscribe((state, prev) => {
      if (state.volume !== prev.volume) persistVolumeDebounced(state.volume);
    });
  }, []);

  // Roll a random skin once at startup when that mode is selected.
  useEffect(() => {
    if (!startupSkinRolled && settings.skinMode === "random-on-startup") {
      settings.setActiveSkinId(rollStartupSkin(settings));
    }
    setStartupSkinRolled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void i18n.changeLanguage(settings.language);
  }, [settings.language, i18n]);

  // Global keyboard shortcuts: Space, arrows (seek/volume), M (mute).
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && KEY_IGNORE_TAGS.has(target.tagName)) return;

      const player = usePlayerStore.getState();
      switch (event.key) {
        case " ":
          event.preventDefault();
          player.togglePlay();
          break;
        case "ArrowUp":
          event.preventDefault();
          player.nudgeVolume(5);
          break;
        case "ArrowDown":
          event.preventDefault();
          player.nudgeVolume(-5);
          break;
        case "ArrowRight":
          player.seek(Math.min(player.duration, player.currentTime + 5));
          break;
        case "ArrowLeft":
          player.seek(Math.max(0, player.currentTime - 5));
          break;
        case "m":
        case "M":
          player.toggleMute();
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeSkinId = resolveActiveSkinId(settings, currentTrack);
  const skin = getSkinById(activeSkinId, settings.customSkins) ?? getSkinById(DEFAULT_SKIN_ID)!;

  function openTrack(_tracks: Track[], _index: number) {
    navigateTo("player");
  }

  return (
    <SkinProvider skin={skin}>
      <BackgroundLayer />
      <WindowChrome title={t("app.name")}>
        <TopBar
          onBack={screenStack.length > 1 ? goBack : undefined}
          onOpenPlaylists={() => navigateTo("playlistLibrary")}
          onOpenFavorites={() => navigateTo("favorites")}
          onOpenSettings={() => navigateTo("settings")}
          favoritesActive={favoritesModeActive}
        />
        <ScanningBanner />
        {screen === "library" ? <LibraryScreen onOpenTrack={openTrack} /> : null}
        {screen === "player" ? <PlayerScreen /> : null}
        {screen === "settings" ? (
          <SettingsScreen
            onOpenCustomSkin={() => navigateTo("customSkin")}
            onDataWiped={() => setScreenStack(["library"])}
          />
        ) : null}
        {screen === "playlistLibrary" ? (
          <PlaylistLibraryScreen
            onOpenTrack={openTrack}
            onOpenManager={() => navigateTo("playlistManager")}
          />
        ) : null}
        {screen === "playlistManager" ? <PlaylistManagerScreen onPlayPlaylist={() => navigateTo("player")} /> : null}
        {screen === "favorites" ? <FavoritesScreen onSelected={() => navigateTo("player")} /> : null}
        {screen === "customSkin" ? <CustomSkinBuilderScreen onSaved={goBack} /> : null}
      </WindowChrome>
    </SkinProvider>
  );
}
