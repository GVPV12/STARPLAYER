/** Star rating, 0 = unrated. */
export type Rating = 0 | 1 | 2 | 3 | 4 | 5;

export const RATING_LABELS: Record<Exclude<Rating, 0>, string> = {
  1: "no me gusta",
  2: "meh",
  3: "me gusta",
  4: "genial",
  5: "ultrafavorita",
};

/** Lowest rating that is allowed to play during shuffle / favorites mode. */
export const SHUFFLEABLE_MIN_RATING: Rating = 3;

export type MoodTag =
  | "sad"
  | "calm"
  | "ambient"
  | "retro"
  | "synthwave"
  | "lofi"
  | "energetic"
  | "neutral";

export interface Track {
  id: string;
  path: string;
  title: string;
  artist: string;
  album: string;
  /** Data URL or file reference to embedded cover art, if any. */
  coverArt: string | null;
  /** Duration in seconds. */
  duration: number;
  /** Beats per minute, if known/embedded/detected. */
  bpm: number | null;
  mood: MoodTag | null;
  rating: Rating;
  addedAt: number;
  year: number | null;
}

export interface Playlist {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

export interface TrackPlaylistLink {
  trackId: string;
  playlistId: string;
}

/** Auto-generated (virtual) playlists derived from ratings, never stored. */
export type AutoPlaylistId =
  | "auto-ultrafavorites"
  | "auto-great"
  | "auto-liked"
  | "auto-all-favorites";

export interface AutoPlaylist {
  id: AutoPlaylistId;
  name: string;
  emoji: string;
  minRating: Rating;
  maxRating: Rating;
}

export type RepeatMode = "off" | "all" | "one";

export type SkinMode = "manual" | "random-on-startup" | "beat-adaptive";

export type SkinId =
  | "vaporwave"
  | "neo-brutalist-cute"
  | "gradient-glass"
  | "monochrome-retro"
  | "soft-glass"
  | (string & {});

export type SkinRenderMode = "pixel" | "modern";

export interface SkinTokens {
  bg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  accent1: string;
  accent2: string;
  fontDisplay: string;
  fontBody: string;
  radius: string;
  pixelScale: string;
  glow: string;
}

export interface Skin {
  id: SkinId;
  name: string;
  mode: SkinRenderMode;
  tokens: SkinTokens;
  /** Whether this skin was authored by the user via the custom skin builder. */
  isCustom?: boolean;
}

export type Language = "en" | "es";

export type LibraryViewMode = "list" | "covers";

export type VisualizerStyle = "bars" | "dots" | "wave" | "ring" | "circle";

export const ALL_VISUALIZER_STYLES: readonly VisualizerStyle[] = ["bars", "dots", "wave", "ring", "circle"];

export type VisualizerColorMode = "duo" | "rainbow";

export interface BeatSkinMapping {
  mood: MoodTag;
  skinId: SkinId;
}

export interface Settings {
  language: Language;
  launchAtStartup: boolean;
  skinMode: SkinMode;
  activeSkinId: SkinId;
  beatSkinMap: BeatSkinMapping[];
  /** Every folder the user has ever scanned; each can be re-scanned or forgotten independently. */
  libraryFolders: string[];
  /** How the main track list renders; persists across restarts. */
  libraryViewMode: LibraryViewMode;
  /** Beat visualizer behind the now-playing cover art. */
  visualizerEnabled: boolean;
  visualizerStyle: VisualizerStyle;
  /** When true, each song gets a randomly-picked style instead of the fixed one above. */
  visualizerRandomStyle: boolean;
  visualizerColorMode: VisualizerColorMode;
  visualizerRelaxedColor: string;
  visualizerEnergeticColor: string;
  volume: number;
  muted: boolean;
  volumeBeforeMute: number;
}
