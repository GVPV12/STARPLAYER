# STARPLAYER

A cross-platform music player with a retro vaporwave OS-simulator identity —
pixelated windows, chunky bitmap fonts, neon glows, and a skin engine that can
swap the entire look (5 built-in skins + a custom skin builder) without
touching any component code.

This first pass ships the **desktop app** (Tauri + React + Vite) and the
**shared core/UI packages**. `apps/mobile` is an intentionally empty
placeholder — see [`apps/mobile/README.md`](apps/mobile/README.md).

## Project structure

```
starplayer/
├── packages/
│   ├── core/     Shared TS logic: types, rating rules, playlist queries,
│   │              volume curve, mood classifier, skin tokens, player store
│   ├── ui/       Shared React components + skin-aware CSS, per-skin
│   │              backgrounds, icons (works today on desktop; RN port notes
│   │              in apps/mobile/README.md)
│   └── assets/   Fonts (self-hosted via @fontsource) + notes on swapping in
│                  real pixel-art/photo backgrounds later
├── apps/
│   ├── desktop/  Tauri 2.x + React + Vite
│   └── mobile/   Placeholder (not scaffolded yet)
└── references/   Visual reference images for each skin
```

## Prerequisites

- **Node.js** ≥ 20 and **pnpm** (`corepack enable` or `npm i -g pnpm`)
- **Rust** + the Tauri system dependencies for your OS, to run the desktop
  shell (`cargo`/`rustc`). Follow
  [Tauri's prerequisites guide](https://v2.tauri.app/start/prerequisites/) —
  on Windows this is the MSVC Build Tools + WebView2 (usually already present).

## Getting started

```sh
pnpm install
pnpm --filter @starplayer/desktop tauri dev
```

`tauri dev` starts the Vite dev server and the Rust/WebView shell together. If
you only want to iterate on the frontend (no native window), you can run
`pnpm --filter @starplayer/desktop dev` directly, but folder scanning, SQLite,
autostart, and file:// audio playback all depend on Tauri's plugins and won't
work outside the real shell.

On first launch: **Settings → Library folder → Choose folder**, or use the
prompt on the home screen. STARPLAYER recursively scans for `.mp3`, `.flac`,
`.wav`, `.m4a`, and `.ogg`, reads embedded tags via `music-metadata`, and
stores everything in a local SQLite database (`tauri-plugin-sql`).

## Other commands

```sh
pnpm test                                    # Vitest — packages/core logic
pnpm --filter @starplayer/core test          # same, scoped
pnpm typecheck                                # tsc --noEmit across all packages
pnpm --filter @starplayer/desktop build       # tsc + vite build (frontend only)
pnpm --filter @starplayer/desktop tauri build # full installer build (needs Rust)
```

## Skins

Five built-in skins live in `packages/core/src/skin/skins.ts`: **Vaporwave**
(default), **Neo-Brutalist Cute**, **Gradient Glass**, **Monochrome Retro**,
and **Soft Glass**. Every token (`bg`, `surface`, `border`, `textPrimary`,
`accent1/2`, fonts, radius, glow) is read from CSS custom properties by
`packages/ui` components — nothing is hardcoded, so a skin swap is instant.
Switch modes in Settings: **Manual**, **Random on launch**, or
**Beat-adaptive** (maps a track's cached BPM-derived mood to a skin; the
mapping table is user-editable). Backgrounds are currently CSS-only
(gradients/canvas-free patterns) — see
[`packages/assets/images/README.md`](packages/assets/images/README.md) for how
to drop in real pixel art/photos later.

### A note on fonts

The brief named **PixelOperator** (body/display) and **Chicago**/**Geneva**
(Monochrome Retro) — none of those are redistributable via npm (PixelOperator
is personal-use-only; Chicago/Geneva are Apple system fonts). We substituted
freely-licensed, visually-equivalent bitmap fonts (Silkscreen, DotGothic16),
self-hosted via `@fontsource/*` in `packages/assets`. If you have a proper
license for the original fonts, drop the `.ttf` files in
`packages/assets/fonts/` and update `packages/assets/src/fonts.css` — every
component already reads fonts through the `--font-display`/`--font-body`
tokens, so nothing else changes.

## Style notes for future changes

- Send targeted patches, not whole-file rewrites, when iterating.
- Every interactive element (volume slider, rating stars, buttons, progress
  bar, playlist carousel) is styled per-skin via `data-skin` attribute
  selectors in each component's CSS Module — never a bare default control.
- New dependencies beyond what's already here should be confirmed first.
