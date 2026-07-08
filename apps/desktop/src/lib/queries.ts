import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Playlist, Rating, Track } from "@starplayer/core";
import * as repo from "../db/repository.js";
import { scanLibrary, type ScanProgress } from "./scanner.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useScanStore } from "../store/scanStore.js";

/** Patches a track's rating everywhere the player store holds a copy of it. */
function patchRatingInPlayerStore(trackId: string, rating: Rating) {
  const patchTrack = (track: Track) => (track.id === trackId ? { ...track, rating } : track);
  usePlayerStore.setState((state) => ({
    currentTrack: state.currentTrack ? patchTrack(state.currentTrack) : state.currentTrack,
    queue: state.queue.map(patchTrack),
    history: state.history.map(patchTrack),
  }));
}

export function useTracksQuery() {
  return useQuery({ queryKey: ["tracks"], queryFn: repo.loadTracks });
}

export function usePlaylistsQuery() {
  return useQuery({ queryKey: ["playlists"], queryFn: repo.loadPlaylists });
}

export function useLinksQuery() {
  return useQuery({ queryKey: ["links"], queryFn: repo.loadTrackPlaylistLinks });
}

export function useRateTrackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, rating }: { trackId: string; rating: Rating }) =>
      repo.setTrackRating(trackId, rating),
    onSuccess: (_data, { trackId, rating }) => {
      patchRatingInPlayerStore(trackId, rating);
      void queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}

export function useCreatePlaylistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlist: Playlist) => repo.createPlaylist(playlist),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["playlists"] }),
  });
}

export function useDeletePlaylistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistId: string) => repo.deletePlaylist(playlistId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["playlists"] }),
  });
}

export function useTogglePlaylistLinkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      trackId,
      playlistId,
      isLinked,
    }: {
      trackId: string;
      playlistId: string;
      isLinked: boolean;
    }) => {
      if (isLinked) {
        await repo.unlinkTrackFromPlaylist(trackId, playlistId);
      } else {
        await repo.linkTrackToPlaylist(trackId, playlistId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });
}

export function useScanLibraryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ path, onProgress }: { path: string; onProgress?: (p: ScanProgress) => void }) => {
      useScanStore.getState().start();
      try {
        await scanLibrary(path, (progress) => {
          useScanStore.getState().update(progress.scanned, progress.total);
          onProgress?.(progress);
        });
      } finally {
        useScanStore.getState().finish();
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tracks"] }),
  });
}

export function useForgetLibraryFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderPath: string) => repo.deleteTracksUnderFolder(folderPath),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tracks"] }),
  });
}

export function useWipeAllDataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => repo.wipeAllData(),
    onSuccess: () => {
      queryClient.setQueryData(["tracks"], []);
      queryClient.setQueryData(["playlists"], []);
      queryClient.setQueryData(["links"], []);
    },
  });
}
