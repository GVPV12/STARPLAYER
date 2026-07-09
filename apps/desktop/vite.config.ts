import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://v2.tauri.app/start/frontend/vite/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Avoid EBUSY on Windows from watching .dll/.exe artifacts that cargo
      // locks while compiling src-tauri.
      ignored: ["**/src-tauri/target/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    // safari13 (the old Tauri-template default for non-Windows) predates
    // BigInt literals, which music-metadata's MP4 parser uses — that broke
    // the macOS/Linux build (never caught locally since local builds always
    // forced TAURI_ENV_PLATFORM=windows). safari14 still targets Tauri's
    // real minimum macOS/webkit2gtk baseline, just without that gap.
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari14",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: Boolean(process.env.TAURI_ENV_DEBUG),
  },
});
