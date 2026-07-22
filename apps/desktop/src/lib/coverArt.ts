import { convertFileSrc } from "@tauri-apps/api/core";

/**
 * `track.coverArt` stores a raw filesystem path to the extracted cover image
 * (see scanner.ts), the same way `track.path` stores a raw path to the audio
 * file — both need `convertFileSrc` to become something an `<img>`/`<audio>`
 * can actually load through Tauri's asset protocol.
 */
export function coverArtSrc(coverArt: string | null): string | undefined {
  return coverArt ? convertFileSrc(coverArt) : undefined;
}
