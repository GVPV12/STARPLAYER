# STARPLAYER — Prompt para Claude Code

Build a cross-platform music player app called **STARPLAYER** with a shared TypeScript core and two client shells: a desktop app (Tauri + React + Vite + TypeScript) and a mobile app (React Native + TypeScript with react-native-track-player). The developer is Grecia (solo dev, freelance UI designer and web developer, familiar with React/TS/Vite from her Focus Time project). The visual identity is heavily inspired by her personal site starmoon.nekoweb.org: retro vaporwave OS-simulator aesthetic with pixelated windows, chunky bitmap fonts, cyan/magenta glows, star-field background.

---

## REFERENCE IMAGES

All reference images live in `references/` at the project root. When implementing each skin, load and study the matching image — descriptions in text are a starting point but the image is the source of truth for color, spacing, texture, and mood.

- `references/01-starmoon-enter.webp` — Vaporwave skin (welcome window, pixel star field, magenta/cyan neon window chrome)
- `references/02-starmoon-desktop.webp` — Vaporwave skin (full desktop OS layout, taskbar, multiple pixel windows, mascot)
- `references/03-neobrutalist-cute.webp` — Neo-brutalist cute skin (warm cream bg, pixel cat mascot, chunky black borders, hot pink highlights)
- `references/04-gradient-glass.webp` — Gradient Glass skin (dark bg with violet/blue/magenta blur blobs, translucent card)
- `references/05-monochrome-retro.webp` — Monochrome Retro skin (pure b&w, sharp corners, HyperCard-style window)
- `references/06-soft-glass-cloud.webp` — Soft Glass skin (sky/cloud photo bg, frosted glass card, elegant typography)
- `references/07-music-player-layout.webp` — General player layout reference (cover art centered, artist/title below, controls, translucent card treatment)

---

## PROJECT STRUCTURE (monorepo, pnpm workspaces)

```
starplayer/
├── packages/
│   ├── core/           Shared TS logic (playback state, tagging, playlists, skin engine, beat detection)
│   ├── ui/             Shared React components + skin definitions (works in both Tauri and RN via react-native-web)
│   └── assets/         Pixel art icons, fonts (PixelOperator, VT323), skin background images
├── apps/
│   ├── desktop/        Tauri 2.x + React + Vite
│   └── mobile/         React Native (bare workflow, not Expo — for track-player)
├── references/         Visual reference images (see list above)
└── pnpm-workspace.yaml
```

Use pnpm for everything. Enforce strict TypeScript (`strict: true`, no `any`).

---

## CORE FEATURES (build in this order)

### 1. LOCAL LIBRARY SCANNER

- Desktop: Tauri fs plugin scans a user-selected folder recursively for `.mp3`/`.flac`/`.wav`/`.m4a`/`.ogg`
- Mobile: react-native-track-player + expo-media-library (or equivalent) reads device audio
- Parse ID3/metadata with `music-metadata` (title, artist, album, cover art, duration, BPM if embedded)
- Store the library in SQLite (Tauri: `tauri-plugin-sql`; RN: `react-native-quick-sqlite`)
- Schema:
  - `tracks(id, path, title, artist, album, cover_blob, duration, bpm, mood, rating, added_at)`
  - `playlists(id, name, emoji, created_at)`
  - `track_playlists(track_id, playlist_id)`

### 2. PLAYBACK ENGINE

- Desktop: HTML5 `<audio>` wrapped in a Zustand store (`usePlayerStore`) — no Web Audio unless doing FFT for beat detection
- Mobile: react-native-track-player handles background audio, media session, lockscreen controls
- Shared player interface in `packages/core/src/player.ts` so UI components don't care which backend is active
- Controls: play, pause, next, prev, shuffle (skips 1★/2★ tracks), seek, **volume (see Volume Control below)**
- Queue management with history stack

### 2b. VOLUME CONTROL (fully-featured, first-class UI)

The volume slider is a **first-class control**, always visible on the main player screen — not hidden in a menu.

**Functionality:**
- Range: 0 to 100, continuous (float precision, but display as integer percentage)
- Actual audio scaling uses a **logarithmic (perceptual) curve**, not linear — because human hearing is logarithmic. Formula: `actualGain = Math.pow(sliderValue / 100, 2.5)` on the `HTMLAudioElement.volume` property (0–1 range). This means moving the slider from 50 → 100 produces a much bigger perceived change than 0 → 50, matching human perception.
- **Mute toggle**: click the speaker icon to mute/unmute. Muting preserves the previous volume value so unmuting restores it.
- **Auto-icon change**: speaker icon shifts based on level — muted (X), low (0–33, one wave), medium (34–66, two waves), high (67–100, three waves).
- **Keyboard shortcuts (desktop)**: `↑` / `↓` = volume ±5, `M` = mute toggle.
- **Scroll wheel over the slider** (desktop) = ±5 per notch.
- Volume state persists across app restarts (save to localStorage on desktop, AsyncStorage on mobile).
- Volume changes are **debounced writes to storage** (150ms) so dragging doesn't spam disk.

**Layout placement:**
- Desktop: horizontal slider to the right of the play/pause/skip controls row, roughly 120px wide, with the speaker icon on its left.
- Mobile: horizontal slider below the play controls, full-width minus padding, speaker icon on the left.

**Per-skin styling** (must feel native to each skin, not a bolted-on generic slider):

- **Vaporwave**: pixelated track with a chunky square thumb, magenta fill on filled portion, cyan on unfilled, subtle neon glow around the thumb. Speaker icon in pixel art. Snap the thumb to whole percentage values for that "digital" feel.
- **Neo-brutalist cute**: thick 3px black border around the track, hot pink fill, chunky square thumb with a black offset shadow (2–3px), pixel speaker icon with warm palette. Slight tilt/rotation on the thumb for character (~2deg).
- **Gradient Glass**: ultra-thin track (2px) at 20% white, filled portion uses the same violet→magenta gradient as the skin's blur blobs, small circular thumb with a soft glow. Speaker icon minimal outline.
- **Monochrome Retro**: sharp 1px black track, black fill, small black square thumb with a 1px white inset, dithered pattern on the filled portion. Chicago-style speaker icon.
- **Soft Glass**: barely-there translucent track with backdrop-blur, soft blue-gray fill, small pill-shaped thumb with subtle shadow. Elegant outline speaker icon. Everything rounded and airy.

The volume control must feel **cohesive and harmonious** with each skin — never like a stock slider dropped on top.

### 3. RATING SYSTEM (top of the album art, above cover)

- 5 empty stars → click fills them yellow (pixel-art styled stars in retro skins, filled SVG in modern skins)
- Ratings:
  - 1★ = "no me gusta"
  - 2★ = "meh"
  - 3★ = "me gusta"
  - 4★ = "genial"
  - 5★ = "ultrafavorita"
- Shuffle mode ONLY plays 3–5★ tracks (never 1–2★)
- "Favorites mode" button in top bar (next to settings gear): filters view to 3/4/5★ tracks — user picks which sub-rating to play

### 4. PLAYLIST SYSTEM (below the cover art)

- Horizontal scrollable carousel of emoji icons (one per user-created playlist)
- Hover (desktop) / long-press (mobile) shows tooltip with playlist name
- Chevron arrow on the right to scroll the carousel horizontally
- Playlist button in top bar (next to settings gear) opens the playlist manager: create new playlist → pick emoji + name → done
- Adding current track to a playlist: click its emoji in the carousel to toggle
- Auto-lists (always present, generated on-the-fly by SQL queries — no manual add):
  - Ultrafavorites (5★), Great (4★), Liked (3★), plus one virtual "All favorites" combining 3–5★

### 5. SKIN ENGINE (the heart of the visual identity)

Skin = a JSON-ish TypeScript object with `{ id, name, mode: 'pixel'|'modern', tokens: {…}, backgroundLayer: ReactComponent }`.

Tokens include: `--bg`, `--surface`, `--border`, `--text-primary`, `--accent-1`, `--accent-2`, `--font-display`, `--font-body`, `--radius`, `--pixel-scale`.

All UI components read from CSS variables — never hardcode colors.

Every skin must define styling for **every UI element** including: rating stars, volume slider, playback buttons, progress bar, playlist carousel emojis, tooltips, and window/card chrome. Nothing should look "default" or generic — every atom of the interface should feel native to the chosen skin.

Ship these **5 built-in skins**:

#### [1] VAPORWAVE (default) — pixel-art mode
Dark navy/purple bg with animated pixel star field, magenta+cyan neon windows with chunky pixelated borders like classic retro OSes, bitmap font (PixelOperator or VT323), scan-line overlay, glowing accents.
**Reference:** `references/01-starmoon-enter.webp` and `references/02-starmoon-desktop.webp`

#### [2] NEO-BRUTALIST CUTE — pixel-art mode
Warm cream/butter background (~#F5C77A), pixelated sandwich-cat mascot area, hot pink + orange highlights, chunky black borders, playful pixel font, sticker-like UI blocks.
**Reference:** `references/03-neobrutalist-cute.webp`

#### [3] GRADIENT GLASS (dark) — modern mode
Pure black background with soft blurry violet/blue/magenta gradient blobs (SVG filters or CSS radial gradients + backdrop-filter), rounded glass cards, thin white 1px borders at 20% opacity, Inter or Space Grotesk font.
**Reference:** `references/04-gradient-glass.webp`

#### [4] MONOCHROME RETRO — pixel-art mode
Pure black-and-white, sharp corners (border-radius 0), 1-bit dithering patterns on backgrounds, classic Mac System 1 window chrome, Chicago-style pixel font.
**Reference:** `references/05-monochrome-retro.webp`

#### [5] SOFT GLASS (light) — modern mode
Sky-blue cloud photo background, translucent frosted-glass card with subtle blur and gradient border, elegant serif+sans mix (Fraunces + Inter), rounded 24px corners, minimal shadows.
**Reference:** `references/06-soft-glass-cloud.webp`

**General player layout reference (all skins):** `references/07-music-player-layout.webp`

### 6. SKIN SWITCHING MODES (Settings)

- **Manual**: user picks one skin, stays there
- **Random on startup**: pick a random skin every app launch
- **Beat-adaptive** (default when enabled): analyze current track's mood/tempo and auto-swap skin
  - Sad/calm/ambient tracks (low BPM, minor key indicator) → Soft Glass or Gradient Glass
  - Retro/synthwave/lo-fi vibes → Vaporwave or Monochrome Retro
  - Everything else cycles through Neo-Brutalist and remaining skins
- Beat-mood mapping is **user-editable**: a settings screen where each mood tag maps to a chosen skin
- Beat detection: use `bpm-detective` npm package or a simple energy-based onset detection over Web Audio API's `AnalyserNode`; classify mood from BPM + spectral centroid (basic heuristic, not ML). Cache mood per track in DB after first analysis.

### 7. CUSTOM SKIN BUILDER

- Settings → "Custom skin" screen → color pickers for all `--accent` tokens, font family dropdown, radius slider, pixel-mode toggle
- Save as user skin, appears in skin picker alongside built-ins
- Ability to "remix": start from an existing skin and tweak

---

## LAYOUT (main player screen)

**Top bar:** `[◀ back]  [playlist icon]  [favorites-mode icon]  [⚙ settings]`

**Center column** (top to bottom):

1. `★★★★★` rating stars — empty by default
2. Album cover art — big, square, with subtle skin-appropriate frame
3. Artist name — smaller, muted
4. Track title — larger, prominent
5. Album · Year — subtle line
6. Progress bar with current time / duration
7. Playback controls row: `◀◀   ▶/❚❚   ▶▶   🔀 shuffle   🔁 repeat`
8. **Volume row**: `🔊 [————●————————]` — speaker icon + horizontal slider (see Volume Control section 2b)
9. Emoji playlist carousel with right-chevron to scroll

The layout stays identical across skins; only tokens, fonts, background layers, and per-element styling change. See `references/07-music-player-layout.webp` for the general layout inspiration.

---

## SETTINGS SCREEN

- **Launch at system startup** (desktop only — Tauri autostart plugin)
- **Language**: English (default) / Spanish — use `i18next` with JSON locale files
- **Skin mode**: Manual / Random on launch / Beat-adaptive
- **Beat-to-skin mapping table** (when Beat-adaptive is on): mood → skin dropdowns
- **Custom skin builder** link
- **Library folder path** (desktop) / re-scan library button
- **About / version**

---

## CODE QUALITY REQUIREMENTS

- Strict TypeScript, no `any`, no `@ts-ignore`
- **State**: Zustand for player + settings, TanStack Query for library reads
- **Components**: functional, hooks only, memoized where render cost matters
- **Styling desktop**: CSS Modules + CSS variables (no Tailwind — cleaner for skin swapping)
- **Styling mobile**: `StyleSheet.create` with a `useSkin()` hook returning the current token set
- Split shared logic into `packages/core` so both apps import the same tagging/playlist/skin code
- **Tests**: Vitest for core logic (rating filters, playlist queries, beat classifier, volume curve), skip UI tests initially
- **Accessibility**: proper `aria-label`s on icon buttons, keyboard shortcuts on desktop (Space = play/pause, arrows = seek/skip, ↑/↓ = volume, M = mute)
- **Performance target**: cold start under 2s on desktop, 60fps skin transitions, library scan of 5000 tracks under 30s

---

## DELIVERABLES FOR THIS FIRST PASS

1. Full monorepo scaffold with working pnpm workspaces
2. Desktop app that: scans a folder, plays audio, shows the vaporwave skin, lets you rate tracks, create playlists, adjust volume with the fully-featured slider, and switch between the 5 built-in skins from settings
3. Shared core package with the skin engine, rating logic, playlist queries, volume curve helper, and player state store
4. README with setup instructions (`pnpm install`, `pnpm --filter desktop tauri dev`, etc.)
5. **Do NOT scaffold the mobile app yet** — leave `apps/mobile/` empty with a placeholder README noting it will use React Native + react-native-track-player later. Focus 100% on the desktop app + shared core for this iteration.

---

## STYLE PREFERENCES

- Send only **targeted patches** when I ask for changes later — don't rewrite whole files.
- Keep the vaporwave skin the visual priority since it defines the brand.
- Ask before adding any dependency not listed here.
- **Every UI element** — including the volume slider, rating stars, buttons, and progress bar — must be styled per-skin to feel cohesive and native. Never leave any control looking "default" or generic across skins.
