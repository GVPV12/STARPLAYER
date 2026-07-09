import { useSkin } from "../SkinProvider.js";
import { BackArrowIcon, FavoritesIcon, PlaylistIcon, SearchIcon, SettingsGearIcon } from "../icons/Icons.js";
import styles from "./TopBar.module.css";

export interface TopBarProps {
  onBack?: () => void;
  onOpenSearch: () => void;
  onOpenPlaylists: () => void;
  onOpenFavorites: () => void;
  onOpenSettings: () => void;
  favoritesActive?: boolean;
}

export function TopBar({
  onBack,
  onOpenSearch,
  onOpenPlaylists,
  onOpenFavorites,
  onOpenSettings,
  favoritesActive,
}: TopBarProps) {
  const skin = useSkin();

  return (
    <div className={styles.bar} data-skin={skin.id}>
      <div className={styles.group}>
        <button
          type="button"
          className={styles.iconButton}
          data-skin={skin.id}
          onClick={onBack}
          disabled={!onBack}
          aria-label="Back"
        >
          <BackArrowIcon size={18} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          data-skin={skin.id}
          onClick={onOpenSearch}
          aria-label="Search"
        >
          <SearchIcon size={18} />
        </button>
      </div>
      <div className={styles.group}>
        <button
          type="button"
          className={styles.iconButton}
          data-skin={skin.id}
          onClick={onOpenPlaylists}
          aria-label="Playlists"
        >
          <PlaylistIcon size={18} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          data-skin={skin.id}
          data-active={favoritesActive}
          onClick={onOpenFavorites}
          aria-label="Favorites mode"
          aria-pressed={favoritesActive}
        >
          <FavoritesIcon size={18} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          data-skin={skin.id}
          onClick={onOpenSettings}
          aria-label="Settings"
        >
          <SettingsGearIcon size={18} />
        </button>
      </div>
    </div>
  );
}
