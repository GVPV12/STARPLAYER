import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getPlaylistCoverTrack, getPlaylistTracks } from "@starplayer/core";
import { useSkin } from "@starplayer/ui";
import {
  useCreatePlaylistMutation,
  useDeletePlaylistMutation,
  useLinksQuery,
  usePlaylistsQuery,
  useTracksQuery,
} from "../lib/queries.js";
import { usePlayerStore } from "../store/playerStore.js";
import { IconEmojiPicker } from "../components/IconEmojiPicker.js";
import styles from "./PlaylistManagerScreen.module.css";

export interface PlaylistManagerScreenProps {
  onPlayPlaylist: () => void;
}

export function PlaylistManagerScreen({ onPlayPlaylist }: PlaylistManagerScreenProps) {
  const { t } = useTranslation();
  const skin = useSkin();
  const { data: playlists = [] } = usePlaylistsQuery();
  const { data: tracks = [] } = useTracksQuery();
  const { data: links = [] } = useLinksQuery();
  const createMutation = useCreatePlaylistMutation();
  const deleteMutation = useDeletePlaylistMutation();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎵");
  const [showForm, setShowForm] = useState(false);

  function handleCreate() {
    if (!name.trim()) return;
    createMutation.mutate({
      id: crypto.randomUUID(),
      name: name.trim(),
      emoji,
      createdAt: Date.now(),
    });
    setName("");
    setEmoji("🎵");
    setShowForm(false);
  }

  function handleOpenPlaylist(playlistId: string) {
    const playlistTracks = getPlaylistTracks(tracks, links, playlistId);
    if (playlistTracks.length === 0) return;
    void usePlayerStore.getState().playQueue(playlistTracks, 0);
    onPlayPlaylist();
  }

  return (
    <div className={styles.wrap} data-skin={skin.id}>
      <h2 className={styles.heading} data-skin={skin.id}>
        {t("playlists.title")}
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
                onClick={() => handleOpenPlaylist(playlist.id)}
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
                  <span
                    className={styles.tileDelete}
                    data-skin={skin.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Delete ${playlist.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(playlist.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        deleteMutation.mutate(playlist.id);
                      }
                    }}
                  >
                    ×
                  </span>
                </span>
                <span className={styles.tileName}>
                  {playlist.emoji} {playlist.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showForm ? (
        <div className={styles.form} data-skin={skin.id}>
          <span className={styles.formTitle}>{t("playlists.newPlaylist")}</span>
          <div className={styles.formRow}>
            <IconEmojiPicker value={emoji} onChange={setEmoji} />
            <input
              className={styles.nameInput}
              value={name}
              placeholder={t("playlists.name")}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.formButtons}>
            <button type="button" className={styles.cancelButton} onClick={() => setShowForm(false)}>
              {t("playlists.cancel")}
            </button>
            <button type="button" className={styles.createButton} data-skin={skin.id} onClick={handleCreate}>
              {t("playlists.create")}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.newButton} data-skin={skin.id} onClick={() => setShowForm(true)}>
          + {t("playlists.newPlaylist")}
        </button>
      )}
    </div>
  );
}
