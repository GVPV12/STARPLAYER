/**
 * SQLite schema shared by the desktop (`tauri-plugin-sql`) and, later, mobile
 * (`react-native-quick-sqlite`) backends. Plain SQL strings so both platforms'
 * thin DB wrappers can execute them without depending on a specific driver.
 */
export const SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT NOT NULL,
    cover_blob TEXT,
    duration REAL NOT NULL DEFAULT 0,
    bpm REAL,
    mood TEXT,
    rating INTEGER NOT NULL DEFAULT 0,
    year INTEGER,
    added_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS track_playlists (
    track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    PRIMARY KEY (track_id, playlist_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tracks_rating ON tracks(rating)`,
  `CREATE INDEX IF NOT EXISTS idx_track_playlists_playlist ON track_playlists(playlist_id)`,
];

export const QUERIES = {
  allTracks: `SELECT * FROM tracks ORDER BY artist, album, title`,
  tracksByRatingRange: `SELECT * FROM tracks WHERE rating >= ? AND rating <= ? ORDER BY artist, album, title`,
  upsertTrack: `INSERT INTO tracks (id, path, title, artist, album, cover_blob, duration, bpm, mood, rating, year, added_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(path) DO UPDATE SET
      title = excluded.title,
      artist = excluded.artist,
      album = excluded.album,
      cover_blob = excluded.cover_blob,
      duration = excluded.duration,
      bpm = excluded.bpm,
      year = excluded.year`,
  setRating: `UPDATE tracks SET rating = ? WHERE id = ?`,
  setMood: `UPDATE tracks SET mood = ? WHERE id = ?`,
  allPlaylists: `SELECT * FROM playlists ORDER BY created_at`,
  insertPlaylist: `INSERT INTO playlists (id, name, emoji, created_at) VALUES (?, ?, ?, ?)`,
  deletePlaylist: `DELETE FROM playlists WHERE id = ?`,
  allTrackPlaylistLinks: `SELECT * FROM track_playlists ORDER BY rowid ASC`,
  linkTrackToPlaylist: `INSERT OR IGNORE INTO track_playlists (track_id, playlist_id) VALUES (?, ?)`,
  unlinkTrackFromPlaylist: `DELETE FROM track_playlists WHERE track_id = ? AND playlist_id = ?`,
  tracksForPlaylist: `SELECT tracks.* FROM tracks
    JOIN track_playlists ON track_playlists.track_id = tracks.id
    WHERE track_playlists.playlist_id = ?
    ORDER BY tracks.artist, tracks.album, tracks.title`,
} as const;
