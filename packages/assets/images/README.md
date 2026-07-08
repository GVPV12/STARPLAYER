# Skin background images

This iteration renders all skin backgrounds procedurally (CSS gradients, CSS
animations, and inline SVG in `packages/ui`'s `BackgroundLayer` components) so
the app doesn't depend on binary art that hasn't been produced yet:

- **Vaporwave** — animated pixel star field, drawn on `<canvas>`.
- **Neo-Brutalist Cute** — flat warm background + CSS-drawn pixel cat/sandwich accents.
- **Gradient Glass** — CSS radial-gradient blur blobs.
- **Monochrome Retro** — 1-bit dithered background via a repeating SVG pattern.
- **Soft Glass** — CSS sky gradient + drawn cloud shapes (stand-in for a real photo).

Drop real assets here when ready (e.g. `starmoon-mascot.png`,
`soft-glass-sky.jpg`) and swap the corresponding `BackgroundLayer` variant in
`packages/ui/src/backgrounds/` to use them — see the reference images in
`references/` at the project root for the target look.
