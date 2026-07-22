import { useTranslation } from "react-i18next";
import type { Track } from "@starplayer/core";
import { PlayIcon, useSkin } from "@starplayer/ui";
import { useSettingsStore } from "../store/settingsStore.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useScanLibraryMutation, useTracksQuery } from "../lib/queries.js";
import { pickLibraryFolder } from "../lib/scanner.js";
import { coverArtSrc } from "../lib/coverArt.js";
import { useFavoritesModeStore } from "../store/favoritesModeStore.js";
import styles from "./LibraryScreen.module.css";

export interface LibraryScreenProps {
  onOpenTrack: (tracks: Track[], index: number) => void;
}

export function LibraryScreen({ onOpenTrack }: LibraryScreenProps) {
  const { t } = useTranslation();
  const skin = useSkin();
  const libraryFolders = useSettingsStore((s) => s.libraryFolders);
  const addLibraryFolder = useSettingsStore((s) => s.addLibraryFolder);
  const viewMode = useSettingsStore((s) => s.libraryViewMode);
  const setLibraryViewMode = useSettingsStore((s) => s.setLibraryViewMode);
  const { data: tracks = [], isLoading } = useTracksQuery();
  const scanMutation = useScanLibraryMutation();

  async function handleAddFolder() {
    const folder = await pickLibraryFolder();
    if (!folder) return;
    addLibraryFolder(folder);
    try {
      await scanMutation.mutateAsync({ path: folder });
    } catch {
      // A failed scan (e.g. folder became unreadable) shouldn't crash the UI;
      // the folder stays remembered so the user can retry from Settings.
    }
  }

  function playTrack(index: number) {
    void usePlayerStore.getState().playQueue(tracks, index);
    useFavoritesModeStore.getState().setActive(false);
    onOpenTrack(tracks, index);
  }

  function handlePlayShuffled() {
    if (tracks.length === 0) return;
    void usePlayerStore.getState().playQueue(tracks, 0, { shuffle: true });
    useFavoritesModeStore.getState().setActive(false);
    onOpenTrack(tracks, 0);
  }

  if (libraryFolders.length === 0) {
    return (
      <div className={styles.empty} data-skin={skin.id}>
        <p className={styles.emptyText} data-skin={skin.id}>
          {t("player.selectFolder")}
        </p>
        <button type="button" className={styles.primaryButton} data-skin={skin.id} onClick={handleAddFolder}>
          {t("player.chooseFolder")}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap} data-skin={skin.id}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.secondaryButton}
          data-skin={skin.id}
          onClick={handleAddFolder}
          disabled={scanMutation.isPending}
        >
          + {t("player.addFolder")}
        </button>
        <div className={styles.viewToggle} data-skin={skin.id}>
          <button
            type="button"
            className={styles.viewToggleButton}
            data-skin={skin.id}
            data-active={viewMode === "list"}
            onClick={() => setLibraryViewMode("list")}
          >
            {t("player.viewList")}
          </button>
          <button
            type="button"
            className={styles.viewToggleButton}
            data-skin={skin.id}
            data-active={viewMode === "covers"}
            onClick={() => setLibraryViewMode("covers")}
          >
            {t("player.viewCovers")}
          </button>
        </div>
      </div>

      {isLoading ? null : tracks.length === 0 ? (
        <p className={styles.emptyText} data-skin={skin.id}>
          {t("player.noTrack")}
        </p>
      ) : viewMode === "list" ? (
        <div className={styles.list} data-skin={skin.id}>
          {tracks.map((track, index) => (
            <button
              key={track.id}
              type="button"
              className={styles.row}
              data-skin={skin.id}
              onClick={() => playTrack(index)}
            >
              <span className={styles.rowCover} data-skin={skin.id}>
                {track.coverArt ? (
                  <img className={styles.rowCoverImg} src={coverArtSrc(track.coverArt)} alt="" loading="lazy" />
                ) : (
                  <span className={styles.rowCoverPlaceholder} aria-hidden="true">
                    ?
                  </span>
                )}
              </span>
              <span className={styles.rowText}>
                <span className={styles.rowTitle}>{track.title}</span>
                <span className={styles.rowArtist}>{track.artist}</span>
              </span>
              <PlayIcon className={styles.rowPlayIcon} size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.grid} data-skin={skin.id}>
          {tracks.map((track, index) => (
            <button
              key={track.id}
              type="button"
              className={styles.tile}
              data-skin={skin.id}
              onClick={() => playTrack(index)}
              aria-label={track.title}
            >
              <span className={styles.tileSquare} data-skin={skin.id}>
                {track.coverArt ? (
                  <img className={styles.tileCover} src={coverArtSrc(track.coverArt)} alt="" loading="lazy" />
                ) : (
                  <span className={styles.tileEmoji} aria-hidden="true">
                    ♪
                  </span>
                )}
              </span>
              <span className={styles.tileName}>{track.title}</span>
            </button>
          ))}
        </div>
      )}

      {tracks.length > 0 ? (
        <button type="button" className={styles.playButton} data-skin={skin.id} onClick={handlePlayShuffled}>
          <PlayIcon size={16} />
          {t("player.playShuffled")}
        </button>
      ) : null}
    </div>
  );
}
