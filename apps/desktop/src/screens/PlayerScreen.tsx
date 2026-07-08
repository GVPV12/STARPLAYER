import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ALL_VISUALIZER_STYLES,
  buildPlaylistCarousel,
  getAutoPlaylistTracks,
  type AutoPlaylistId,
  type Rating,
  type VisualizerStyle,
} from "@starplayer/core";
import { BeatVisualizer, PlaybackControls, PlaylistCarousel, RatingStars, VolumeSlider, useSkin } from "@starplayer/ui";
import { usePlayerStore } from "../store/playerStore.js";
import { useSettingsStore } from "../store/settingsStore.js";
import { useAudioVisualizerData } from "../lib/useAudioVisualizerData.js";
import { ConnectedProgressBar } from "../components/ConnectedProgressBar.js";
import {
  useLinksQuery,
  usePlaylistsQuery,
  useRateTrackMutation,
  useTogglePlaylistLinkMutation,
  useTracksQuery,
} from "../lib/queries.js";
import styles from "./PlayerScreen.module.css";

const AUTO_PLAYLIST_IDS = new Set([
  "auto-ultrafavorites",
  "auto-great",
  "auto-liked",
  "auto-all-favorites",
]);

function pickRandomVisualizerStyle(): VisualizerStyle {
  return ALL_VISUALIZER_STYLES[Math.floor(Math.random() * ALL_VISUALIZER_STYLES.length)]!;
}

export function PlayerScreen() {
  const { t } = useTranslation();
  const skin = useSkin();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const volume = usePlayerStore((s) => s.volume);

  const { data: tracks = [] } = useTracksQuery();
  const { data: playlists = [] } = usePlaylistsQuery();
  const { data: links = [] } = useLinksQuery();
  const rateMutation = useRateTrackMutation();
  const toggleLinkMutation = useTogglePlaylistLinkMutation();

  const visualizerEnabled = useSettingsStore((s) => s.visualizerEnabled);
  const visualizerStyle = useSettingsStore((s) => s.visualizerStyle);
  const visualizerRandomStyle = useSettingsStore((s) => s.visualizerRandomStyle);
  const visualizerColorMode = useSettingsStore((s) => s.visualizerColorMode);
  const visualizerRelaxedColor = useSettingsStore((s) => s.visualizerRelaxedColor);
  const visualizerEnergeticColor = useSettingsStore((s) => s.visualizerEnergeticColor);
  const { frequencyData, energy, beatPulse } = useAudioVisualizerData(visualizerEnabled && isPlaying);

  // In random mode, roll a new style whenever the playing track changes.
  const [randomStyle, setRandomStyle] = useState<VisualizerStyle>(() => pickRandomVisualizerStyle());
  useEffect(() => {
    if (visualizerRandomStyle) setRandomStyle(pickRandomVisualizerStyle());
  }, [currentTrack?.id, visualizerRandomStyle]);

  const effectiveStyle = visualizerRandomStyle ? randomStyle : visualizerStyle;
  const isFullWidthStyle = effectiveStyle === "bars" || effectiveStyle === "wave";

  const carouselItems = buildPlaylistCarousel(playlists);
  const activeIds = new Set(
    currentTrack
      ? [
          ...links.filter((l) => l.trackId === currentTrack.id).map((l) => l.playlistId),
          ...carouselItems
            .filter((item) => item.isAuto && getAutoPlaylistTracks(tracks, item.id as AutoPlaylistId).some((tr) => tr.id === currentTrack.id))
            .map((item) => item.id),
        ]
      : [],
  );

  if (!currentTrack) {
    return (
      <div className={styles.emptyState} data-skin={skin.id}>
        <p>{t("player.noTrack")}</p>
      </div>
    );
  }

  return (
    <div className={styles.center} data-skin={skin.id}>
      <RatingStars
        rating={currentTrack.rating}
        onChange={(rating: Rating) => rateMutation.mutate({ trackId: currentTrack.id, rating })}
      />

      <div className={styles.coverWrap}>
        {visualizerEnabled && !isFullWidthStyle ? (
          <div className={styles.visualizerLayer}>
            <BeatVisualizer
              style={effectiveStyle}
              colorMode={visualizerColorMode}
              frequencyData={frequencyData}
              energy={energy}
              beatPulse={beatPulse}
              relaxedColor={visualizerRelaxedColor}
              energeticColor={visualizerEnergeticColor}
            />
          </div>
        ) : null}
        <div className={styles.coverFrame} data-skin={skin.id}>
          {currentTrack.coverArt ? (
            <img className={styles.cover} src={currentTrack.coverArt} alt="" />
          ) : (
            <div className={styles.coverPlaceholder} data-skin={skin.id} aria-hidden="true">
              ♪
            </div>
          )}
        </div>
      </div>

      <div className={styles.meta}>
        <span className={styles.artist} data-skin={skin.id}>
          {currentTrack.artist}
        </span>
        <span className={styles.title} data-skin={skin.id}>
          {currentTrack.title}
        </span>
        <span className={styles.albumYear} data-skin={skin.id}>
          {currentTrack.album}
          {currentTrack.year ? ` · ${currentTrack.year}` : ""}
        </span>
      </div>

      {visualizerEnabled && isFullWidthStyle ? (
        <div className={styles.fullWidthVisualizerWrap} data-skin={skin.id}>
          <div className={styles.fullWidthVisualizerInner}>
            <BeatVisualizer
              style={effectiveStyle}
              colorMode={visualizerColorMode}
              frequencyData={frequencyData}
              energy={energy}
              beatPulse={beatPulse}
              relaxedColor={visualizerRelaxedColor}
              energeticColor={visualizerEnergeticColor}
            />
          </div>
        </div>
      ) : null}

      <ConnectedProgressBar />

      <PlaybackControls
        isPlaying={isPlaying}
        onTogglePlay={() => usePlayerStore.getState().togglePlay()}
        onNext={() => void usePlayerStore.getState().next()}
        onPrev={() => void usePlayerStore.getState().prev()}
        shuffle={shuffle}
        onToggleShuffle={() => usePlayerStore.getState().toggleShuffle()}
        repeat={repeat}
        onSetRepeat={(mode) => usePlayerStore.getState().setRepeat(mode)}
        repeatLabels={{
          off: t("player.repeatOff"),
          all: t("player.repeatAll"),
          one: t("player.repeatOne"),
        }}
      />

      <VolumeSlider
        value={volume.value}
        muted={volume.muted}
        onChange={(value) => usePlayerStore.getState().setVolume(value)}
        onToggleMute={() => usePlayerStore.getState().toggleMute()}
      />

      <PlaylistCarousel
        items={carouselItems}
        activeIds={activeIds}
        onToggle={(item) => {
          if (AUTO_PLAYLIST_IDS.has(item.id)) return;
          toggleLinkMutation.mutate({
            trackId: currentTrack.id,
            playlistId: item.id,
            isLinked: activeIds.has(item.id),
          });
        }}
      />
    </div>
  );
}
