import { exists, mkdir, readDir, readFile, remove, writeFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { appDataDir, join } from "@tauri-apps/api/path";
import { parseBuffer } from "music-metadata";
import { pruneTracksNotInFolder, upsertTrack } from "../db/repository.js";

/**
 * Extensions that Chromium/WebView2's `<audio>` element can actually decode —
 * not just what `music-metadata` can tag. Deliberately excludes formats that
 * scan/tag fine but fail silently on playback in this engine (WMA, AIFF,
 * Monkey's Audio/APE, Apple Lossless/ALAC).
 */
const SUPPORTED_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "wave",
  "flac",
  "ogg",
  "oga",
  "opus",
  "m4a",
  "m4b",
  "mp4",
  "aac",
  "weba",
  "webm",
]);

export async function pickLibraryFolder(): Promise<string | null> {
  const selected = await open({ directory: true, multiple: false, title: "Choose your music folder" });
  return typeof selected === "string" ? selected : null;
}

async function walk(dirPath: string): Promise<string[]> {
  const entries = await readDir(dirPath);
  const files: string[] = [];
  for (const entry of entries) {
    if (!entry.name) continue;
    const entryPath = await join(dirPath, entry.name);
    if (entry.isDirectory) {
      files.push(...(await walk(entryPath)));
    } else if (entry.isFile) {
      const ext = entry.name.split(".").pop()?.toLowerCase();
      if (ext && SUPPORTED_EXTENSIONS.has(ext)) {
        files.push(entryPath);
      }
    }
  }
  return files;
}

/**
 * Extracted cover art used to be stored as a base64 data URL directly in the
 * `tracks` table. For a real library (hundreds+ tracks) that meant every
 * `SELECT * FROM tracks` pulled the whole library's embedded art into memory
 * as text, and the UI had to render it all at once — the likely cause of the
 * app becoming sluggish or crashing outright on a full library load. Cover
 * art is now written to its own small file per track instead, so the DB and
 * JS memory only ever hold a short file path, and the OS decodes/caches each
 * image lazily as it's actually displayed.
 */
let coversDirPromise: Promise<string> | null = null;

function getCoversDir(): Promise<string> {
  if (!coversDirPromise) {
    coversDirPromise = (async () => {
      const dir = await join(await appDataDir(), "covers");
      if (!(await exists(dir))) {
        await mkdir(dir, { recursive: true });
      }
      return dir;
    })();
  }
  return coversDirPromise;
}

const PICTURE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Stable, non-cryptographic hash — just needs to give the same file name
 *  across rescans of the same track so re-scanning overwrites its cover in
 *  place instead of piling up orphaned files under a fresh id each time. */
function hashPath(path: string): string {
  let hash = 5381;
  for (let i = 0; i < path.length; i += 1) {
    hash = (hash * 33) ^ path.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

async function writeCoverArt(
  filePath: string,
  picture: { format: string; data: Uint8Array },
): Promise<string | null> {
  try {
    const ext = PICTURE_EXTENSIONS[picture.format] ?? "jpg";
    const coversDir = await getCoversDir();
    const coverPath = await join(coversDir, `${hashPath(filePath)}.${ext}`);
    await writeFile(coverPath, picture.data);
    return coverPath;
  } catch {
    // A missing cover shouldn't fail the whole track scan.
    return null;
  }
}

/** Deletes every extracted cover file — used by Settings' "delete all data" so it's a real clean reset. */
export async function clearCoversCache(): Promise<void> {
  const dir = await getCoversDir();
  try {
    await remove(dir, { recursive: true });
  } catch {
    // Nothing to clean up.
  }
  coversDirPromise = null;
}

export interface ScanProgress {
  scanned: number;
  total: number;
  currentFile: string;
}

/** Recursively scans `folderPath` for supported audio files, tagging + upserting each into SQLite. */
export async function scanLibrary(
  folderPath: string,
  onProgress?: (progress: ScanProgress) => void,
): Promise<void> {
  const filePaths = await walk(folderPath);

  for (let i = 0; i < filePaths.length; i += 1) {
    const filePath = filePaths[i]!;
    onProgress?.({ scanned: i, total: filePaths.length, currentFile: filePath });

    try {
      const bytes = await readFile(filePath);
      const metadata = await parseBuffer(bytes, { path: filePath });
      const common = metadata.common;
      const picture = common.picture?.[0];
      const fileName = filePath.split(/[/\\]/).pop() ?? filePath;

      await upsertTrack({
        id: crypto.randomUUID(),
        path: filePath,
        title: common.title ?? fileName.replace(/\.[^./]+$/, ""),
        artist: common.artist ?? "Unknown Artist",
        album: common.album ?? "Unknown Album",
        coverArt: picture ? await writeCoverArt(filePath, picture) : null,
        duration: metadata.format.duration ?? 0,
        bpm: common.bpm ?? null,
        year: common.year ?? null,
      });
    } catch {
      // Skip files that fail to parse (corrupt tags, unsupported container, etc.)
      continue;
    }
  }

  onProgress?.({ scanned: filePaths.length, total: filePaths.length, currentFile: "" });
  await pruneTracksNotInFolder(folderPath, filePaths);
}
