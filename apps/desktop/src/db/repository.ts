import { db as coreDb } from "@starplayer/core";
import type { MoodTag, Playlist, Rating, Track, TrackPlaylistLink } from "@starplayer/core";
import { getDb } from "./client.js";

interface TrackRow {
  id: string;
  path: string;
  title: string;
  artist: string;
  album: string;
  cover_blob: string | null;
  duration: number;
  bpm: number | null;
  mood: string | null;
  rating: number;
  year: number | null;
  added_at: number;
}

interface PlaylistRow {
  id: string;
  name: string;
  emoji: string;
  created_at: number;
}

interface TrackPlaylistRow {
  track_id: string;
  playlist_id: string;
}

function rowToTrack(row: TrackRow): Track {
  return {
    id: row.id,
    path: row.path,
    title: row.title,
    artist: row.artist,
    album: row.album,
    coverArt: row.cover_blob,
    duration: row.duration,
    bpm: row.bpm,
    mood: (row.mood as MoodTag | null) ?? null,
    rating: row.rating as Rating,
    year: row.year,
    addedAt: row.added_at,
  };
}

function rowToPlaylist(row: PlaylistRow): Playlist {
  return { id: row.id, name: row.name, emoji: row.emoji, createdAt: row.created_at };
}

export async function loadTracks(): Promise<Track[]> {
  const db = await getDb();
  const rows = await db.select<TrackRow[]>(coreDb.QUERIES.allTracks);
  return rows.map(rowToTrack);
}

export interface UpsertTrackInput {
  id: string;
  path: string;
  title: string;
  artist: string;
  album: string;
  coverArt: string | null;
  duration: number;
  bpm: number | null;
  year: number | null;
}

export async function upsertTrack(input: UpsertTrackInput): Promise<void> {
  const db = await getDb();
  await db.execute(coreDb.QUERIES.upsertTrack, [
    input.id,
    input.path,
    input.title,
    input.artist,
    input.album,
    input.coverArt,
    input.duration,
    input.bpm,
    null,
    0,
    input.year,
    Date.now(),
  ]);
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").toLowerCase();
}

function isPathUnderFolder(path: string, folderPath: string): boolean {
  const normalizedPath = normalizePath(path);
  const normalizedFolder = normalizePath(folderPath).replace(/\/$/, "");
  return normalizedPath === normalizedFolder || normalizedPath.startsWith(`${normalizedFolder}/`);
}

/**
 * Deletes tracks that used to live under `folderPath` but are no longer
 * present in `keptPaths` (the file list from a fresh scan of that folder).
 * Scoped to `folderPath` so rescanning one library folder never touches
 * tracks that came from a different remembered folder.
 */
export async function pruneTracksNotInFolder(folderPath: string, keptPaths: string[]): Promise<void> {
  const db = await getDb();
  const rows = await db.select<TrackRow[]>(coreDb.QUERIES.allTracks);
  const keptSet = new Set(keptPaths);
  const idsToDelete = rows
    .filter((row) => isPathUnderFolder(row.path, folderPath) && !keptSet.has(row.path))
    .map((row) => row.id);
  if (idsToDelete.length === 0) return;
  const placeholders = idsToDelete.map(() => "?").join(",");
  await db.execute(`DELETE FROM tracks WHERE id IN (${placeholders})`, idsToDelete);
}

/** Removes every track that lives under `folderPath` (used when "forgetting" a library folder). */
export async function deleteTracksUnderFolder(folderPath: string): Promise<void> {
  const db = await getDb();
  const rows = await db.select<TrackRow[]>(coreDb.QUERIES.allTracks);
  const idsToDelete = rows.filter((row) => isPathUnderFolder(row.path, folderPath)).map((row) => row.id);
  if (idsToDelete.length === 0) return;
  const placeholders = idsToDelete.map(() => "?").join(",");
  await db.execute(`DELETE FROM tracks WHERE id IN (${placeholders})`, idsToDelete);
}

export async function setTrackRating(trackId: string, rating: Rating): Promise<void> {
  const db = await getDb();
  await db.execute(coreDb.QUERIES.setRating, [rating, trackId]);
}

export async function setTrackMood(trackId: string, mood: MoodTag): Promise<void> {
  const db = await getDb();
  await db.execute(coreDb.QUERIES.setMood, [mood, trackId]);
}

export async function loadPlaylists(): Promise<Playlist[]> {
  const db = await getDb();
  const rows = await db.select<PlaylistRow[]>(coreDb.QUERIES.allPlaylists);
  return rows.map(rowToPlaylist);
}

export async function createPlaylist(playlist: Playlist): Promise<void> {
  const db = await getDb();
  await db.execute(coreDb.QUERIES.insertPlaylist, [
    playlist.id,
    playlist.name,
    playlist.emoji,
    playlist.createdAt,
  ]);
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const db = await getDb();
  await db.execute(coreDb.QUERIES.deletePlaylist, [playlistId]);
}

export async function loadTrackPlaylistLinks(): Promise<TrackPlaylistLink[]> {
  const db = await getDb();
  const rows = await db.select<TrackPlaylistRow[]>(coreDb.QUERIES.allTrackPlaylistLinks);
  return rows.map((row) => ({ trackId: row.track_id, playlistId: row.playlist_id }));
}

export async function linkTrackToPlaylist(trackId: string, playlistId: string): Promise<void> {
  const db = await getDb();
  await db.execute(coreDb.QUERIES.linkTrackToPlaylist, [trackId, playlistId]);
}

export async function unlinkTrackFromPlaylist(trackId: string, playlistId: string): Promise<void> {
  const db = await getDb();
  await db.execute(coreDb.QUERIES.unlinkTrackFromPlaylist, [trackId, playlistId]);
}

/** Wipes every track, playlist, and playlist membership — used by Settings' "delete all data". */
export async function wipeAllData(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM track_playlists");
  await db.execute("DELETE FROM playlists");
  await db.execute("DELETE FROM tracks");
}
