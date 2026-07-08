# STARPLAYER Mobile (not yet scaffolded)

This app is intentionally empty for the first iteration — the desktop app and
`packages/core`/`packages/ui` were the focus. When it's time to build this:

- **Stack**: React Native, bare workflow (not Expo — needed for
  `react-native-track-player`'s native background-audio/lockscreen modules).
- **Playback**: implement the `PlayerBackend` interface from
  `@starplayer/core` (`packages/core/src/player.ts`) on top of
  `react-native-track-player`, mirroring what `apps/desktop/src/lib/audioBackend.ts`
  does for `HTMLAudioElement`. Nothing in `packages/core`'s player store,
  rating, playlist, volume-curve, or skin-engine logic needs to change.
- **Library scanning**: `expo-media-library` (or equivalent) + `music-metadata`
  reading device audio, writing into `react-native-quick-sqlite` using the same
  schema/queries as `packages/core/src/db/schema.ts`.
- **UI**: `packages/ui` was written with `react-native-web` compatibility in
  mind (tokens flow through CSS custom properties on desktop), but its
  components currently render plain DOM elements + CSS Modules. Porting to RN
  will mean swapping the `<div>`/`<button>`/CSS-Modules layer for
  `StyleSheet.create` + a `useSkin()` hook that reads the same `Skin` objects
  from `@starplayer/core` — the token *values* and skin *data* are already
  shared and platform-agnostic.
- **Storage**: swap `localStorage` (volume/settings persistence) for
  `AsyncStorage`.

See the root `README.md` for how the desktop app wires the equivalent pieces.
