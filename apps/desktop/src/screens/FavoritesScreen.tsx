import { useTranslation } from "react-i18next";
import { filterFavorites, type FavoritesSubRating } from "@starplayer/core";
import { useSkin } from "@starplayer/ui";
import { useTracksQuery } from "../lib/queries.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useFavoritesModeStore } from "../store/favoritesModeStore.js";
import styles from "./FavoritesScreen.module.css";

export interface FavoritesScreenProps {
  onSelected: () => void;
}

const OPTIONS: { key: "all" | FavoritesSubRating; labelKey: string }[] = [
  { key: "all", labelKey: "favorites.all" },
  { key: 5, labelKey: "favorites.ultrafavorites" },
  { key: 4, labelKey: "favorites.great" },
  { key: 3, labelKey: "favorites.liked" },
];

export function FavoritesScreen({ onSelected }: FavoritesScreenProps) {
  const { t } = useTranslation();
  const skin = useSkin();
  const { data: tracks = [] } = useTracksQuery();

  function handleSelect(subRating: "all" | FavoritesSubRating) {
    const filtered = filterFavorites(tracks, subRating);
    if (filtered.length === 0) return;
    void usePlayerStore.getState().playQueue(filtered, 0);
    useFavoritesModeStore.getState().setActive(true);
    onSelected();
  }

  return (
    <div className={styles.wrap} data-skin={skin.id}>
      <h2 className={styles.heading} data-skin={skin.id}>
        {t("favorites.title")}
      </h2>
      {OPTIONS.map((option) => (
        <button
          key={String(option.key)}
          type="button"
          className={styles.option}
          data-skin={skin.id}
          onClick={() => handleSelect(option.key)}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}
