import { useState } from "react";
import { useTranslation } from "react-i18next";
import { searchTracks, type Track } from "@starplayer/core";
import { PlayIcon, useSkin } from "@starplayer/ui";
import { useTracksQuery } from "../lib/queries.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useFavoritesModeStore } from "../store/favoritesModeStore.js";
import styles from "./SearchScreen.module.css";

export interface SearchScreenProps {
  onOpenTrack: (tracks: Track[], index: number) => void;
}

export function SearchScreen({ onOpenTrack }: SearchScreenProps) {
  const { t } = useTranslation();
  const skin = useSkin();
  const { data: tracks = [] } = useTracksQuery();
  const [query, setQuery] = useState("");

  const results = searchTracks(tracks, query);

  function playResult(index: number) {
    void usePlayerStore.getState().playQueue(results, index);
    useFavoritesModeStore.getState().setActive(false);
    onOpenTrack(results, index);
  }

  return (
    <div className={styles.wrap} data-skin={skin.id}>
      <input
        type="text"
        className={styles.input}
        data-skin={skin.id}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.placeholder")}
        autoFocus
      />

      {query.trim() === "" ? (
        <p className={styles.hintText} data-skin={skin.id}>
          {t("search.hint")}
        </p>
      ) : results.length === 0 ? (
        <p className={styles.hintText} data-skin={skin.id}>
          {t("search.noResults")}
        </p>
      ) : (
        <div className={styles.list} data-skin={skin.id}>
          {results.map((track, index) => (
            <button
              key={track.id}
              type="button"
              className={styles.row}
              data-skin={skin.id}
              onClick={() => playResult(index)}
            >
              <span className={styles.rowCover} data-skin={skin.id}>
                {track.coverArt ? (
                  <img className={styles.rowCoverImg} src={track.coverArt} alt="" />
                ) : (
                  <span className={styles.rowCoverPlaceholder} aria-hidden="true">
                    ?
                  </span>
                )}
              </span>
              <span className={styles.rowText}>
                <span className={styles.rowTitle}>{track.title}</span>
                <span className={styles.rowArtist}>
                  {track.artist} — {track.album}
                </span>
              </span>
              <PlayIcon className={styles.rowPlayIcon} size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
