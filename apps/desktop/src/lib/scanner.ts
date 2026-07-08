import { readDir, readFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
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
        coverArt: picture ? `data:${picture.format};base64,${bytesToBase64(picture.data)}` : null,
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
