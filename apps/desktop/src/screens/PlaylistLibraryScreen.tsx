import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getPlaylistCoverTrack, getPlaylistTracks, type Track } from "@starplayer/core";
import { useSkin } from "@starplayer/ui";
import { useLinksQuery, usePlaylistsQuery, useTracksQuery } from "../lib/queries.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useFavoritesModeStore } from "../store/favoritesModeStore.js";
import styles from "./PlaylistLibraryScreen.module.css";

export interface PlaylistLibraryScreenProps {
  onOpenTrack: (tracks: Track[], index: number) => void;
  onOpenManager: () => void;
}

/**
 * Browse-only playlist library: an Instagram-style grid of playlist covers,
 * tap one to see its songs. Distinct from `PlaylistManagerScreen`, which is
 * only for creating/deleting playlists.
 */
export function PlaylistLibraryScreen({ onOpenTrack, onOpenManager }: PlaylistLibraryScreenProps) {
  const { t } = useTranslation();
  const skin = useSkin();
  const { data: playlists = [] } = usePlaylistsQuery();
  const { data: tracks = [] } = useTracksQuery();
  const { data: links = [] } = useLinksQuery();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) ?? null;

  if (selectedPlaylist) {
    const playlistTracks = getPlaylistTracks(tracks, links, selectedPlaylist.id);
    return (
      <div className={styles.wrap} data-skin={skin.id}>
        <button type="button" className={styles.backLink} data-skin={skin.id} onClick={() => setSelectedPlaylistId(null)}>
          ← {t("playlists.title")}
        </button>
        <h2 className={styles.heading} data-skin={skin.id}>
          {selectedPlaylist.emoji} {selectedPlaylist.name}
        </h2>
        {playlistTracks.length === 0 ? (
          <p className={styles.emptyText}>{t("playlists.empty")}</p>
        ) : (
          <div className={styles.list} data-skin={skin.id}>
            {playlistTracks.map((track, index) => (
              <button
                key={track.id}
                type="button"
                className={styles.row}
                data-skin={skin.id}
                onClick={() => {
                  void usePlayerStore.getState().playQueue(playlistTracks, index);
                  useFavoritesModeStore.getState().setActive(false);
                  onOpenTrack(playlistTracks, index);
                }}
              >
                <span className={styles.rowTitle}>{track.title}</span>
                <span className={styles.rowArtist}>{track.artist}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.wrap} data-skin={skin.id}>
      <h2 className={styles.heading} data-skin={skin.id}>
        {t("playlistLibrary.title")}
      </h2>

      {playlists.length === 0 ? (
        <p className={styles.emptyText}>{t("playlists.empty")}</p>
      ) : (
        <div className={styles.grid} data-skin={skin.id}>
          {playlists.map((playlist) => {
            const cover = getPlaylistCoverTrack(tracks, links, playlist.id);
            return (
              <button
                key={playlist.id}
                type="button"
                className={styles.tile}
                data-skin={skin.id}
                onClick={() => setSelectedPlaylistId(playlist.id)}
                aria-label={playlist.name}
              >
                <span className={styles.tileSquare} data-skin={skin.id}>
                  {cover?.coverArt ? (
                    <img className={styles.tileCover} src={cover.coverArt} alt="" />
                  ) : (
                    <span className={styles.tileEmoji} aria-hidden="true">
                      {playlist.emoji}
                    </span>
                  )}
                </span>
                <span className={styles.tileName}>
                  {playlist.emoji} {playlist.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button type="button" className={styles.managerLink} data-skin={skin.id} onClick={onOpenManager}>
        {t("playlistLibrary.manage")} →
      </button>
    </div>
  );
}
