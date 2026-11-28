# Logo brief — Loomline

Domain: **manufacturing** (signals: manufacturing 638, developer tools 130, logistics 56)
Audience: inventory managers bear the recording cost; production planners and
Intent: NOT RECORDED — ask before drawing
Suggested visual character: durable and geometric — sturdy strokes, squared joins, no gradient

## Questions to settle first

1. Who should recognise the mark first — buyer, operator, or developer?
2. What one promise must the mark imply (speed, control, craft, trust)?
3. Which words must the brand avoid (cheap, clinical, playful, corporate)?
4. Is there an existing wordmark, colour or symbol that must be kept?

## Concept territories

### A. Monogram — “LL”
- Geometry: LL built on a 32 px grid from two or three primitives;
  shared stroke weight; no enclosing circle unless it earns its place.
- Wins when: the name is said aloud and the mark must survive at 16 px.
- Risk: generic — differentiate with one cut, overlap or counter-shape.
- Variants: solid, outline, single-path monochrome.

### B. Domain object — a shuttle, beam or interlocking joint
- Geometry: reduce a shuttle, beam or interlocking joint to at most three shapes; one accent fill,
  one ink shape; no literal illustration or tiny details.
- Wins when: the mark should explain the category without a tagline.
- Risk: cliché if the object is drawn, not abstracted — remove one detail twice.
- Variants: positive, negative-space, monochrome.

### C. Motion / flow mark
- Geometry: a single axis of movement (arrow, current, route, pulse) bent
  once; the bend is the distinctive idea, not the arrowhead.
- Wins when: the promise is speed, flow or coordination.
- Risk: reads as a generic arrow — make the bend asymmetric and ownable.
- Variants: horizontal lockup, square crop, animated draw-on (≤ 600 ms).

## Drawing contract (SVG)

- `viewBox="0 0 32 32"`; geometry snapped to a 1 px grid; 2 px padding.
- Mark is one to three paths; no `<text>`, no embedded raster, no filters.
- Monochrome file uses `fill="currentColor"`; colour file uses at most two
  brand tokens plus ink.
- Survives 16 px: remove the smallest detail rather than thin the stroke.
- Corner radius and stroke weight stay consistent across mark and wordmark.
- Wordmark is separate lettering or an outlined font — never live text.

## Visual prompt (after a territory is chosen)

- “Minimal manufacturing logo, durable and geometric — sturdy strokes, squared joins, no gradient, abstract a shuttle, beam or interlocking joint, flat vector,
  two colours, no gradient, no text, centred on 32 px grid, high contrast.”
- “Same mark as a single-path monochrome silhouette, legible at 16 px.”
- “Horizontal lockup: mark left, geometric sans wordmark right, equal optical weight.”

## Platform asset matrix

| Asset | Size | Format | Rule |
| --- | --- | --- | --- |
| Master mark | 32 × 32 viewBox | SVG | one file, no text, 8 px safe area |
| Monochrome mark | 32 × 32 | SVG | single path, `currentColor`, no gradient |
| Horizontal lockup | mark + wordmark | SVG | mark height = cap height; 0.5× gap |
| Stacked lockup | mark above wordmark | SVG | centred; for square placements |
| Favicon | 16 / 32 / 48 | ICO + SVG | test at 16 px; drop detail, not the silhouette |
| PWA icon | 192 / 512 | PNG | opaque background, no transparent halo |
| Maskable icon | 512 | PNG | mark inside the centre 80% safe zone |
| Apple touch icon | 180 | PNG | opaque, no rounded corners (OS masks it) |
| Social / OG card | 1200 × 630 | PNG | mark + wordmark + one-line promise |
| Avatar | 512 | PNG | circular-safe: mark centred within 70% |
| Email signature | 400 × 120 | PNG | light background only, 2× for retina |

## Existing asset audit

[gap] favicon (.svg/.ico)
[gap] apple-touch-icon 180 px
[gap] web app manifest with icons
[gap] social / OG card 1200 × 630
[gap] scalable marks with viewBox (0/0 SVG in public)

## Acceptance checks

- [ ] Recognisable at 16 px and at 512 px without redrawing.
- [ ] Works in one colour, on light and dark, and over a photo.
- [ ] Maskable icon keeps the mark inside the centre 80% safe zone.
- [ ] Favicon SVG has a `viewBox`; ICO fallback exists for old clients.
- [ ] Lockups use the same mark proportions as the master.
- [ ] Social card carries mark + wordmark + one-line promise, readable at thumb size.
- [ ] Mark is not colour-only: silhouette alone identifies it.

## Agent handoff

1. Present territories A–C with one sketch each; let the human choose.
2. Draw the chosen mark as SVG in `public/`; add the monochrome variant.
3. Export the matrix above; wire favicon, manifest and OG meta tags.
4. Record the choice and its rationale in the design-system doc or an ADR.

## Intent (inferred — confirm)

The brief reported `NOT RECORDED`. The following is read from README.md and
`web/src/theme/tokens.css`, not invented as user research:

- **First recogniser:** the production planner and shop-floor operator, before
  buyer or developer. The mark sits beside operational screens all shift.
- **Promise:** “Every order on the floor, in one line.” One place to see intake,
  state and routing — the name itself is the promise.
- **Avoid:** cheap, clinical, playful, corporate; literal loom/shuttle
  illustration; gradients and fine detail that die at 16 px.
- **Keep:** the LoomLine name, navy chrome `#10324a` and greensea accent
  `#0f7f6b` already shipped in the tokens.

## Decision

Territory A, woven into B: a white **L** (the warp) with a mint **weft thread**
passing behind it, on the navy chrome tile. The over/under break is the
distinctive idea; the silhouette is a plain L, so it survives 16 px. The tile
matches the app header, and the lighter mint is the dark-surface tint of the
accent (`#7ad9c4`, 7.96:1 on navy; the L is 11.68:1).

- Primary tile: `logo.svg`; transparent marks: `logo-mark.svg` (light),
  `logo-mark-inverse.svg` (chrome), `logo-mono.svg` (one path, `currentColor`).
- Lockups: `logo-lockup{,-inverse}.svg`, `logo-stacked{,-inverse}.svg`. Wordmark
  is outlined DejaVu Sans Bold (system fallback for Segoe UI) at 20 px / 0.4
  tracking; no `<text>` in any mark.
- Platform set in `web/public/`: `favicon.svg`, `favicon.ico` (16/32/48),
  `icon-192.png`, `icon-512.png`, `maskable.svg` + `maskable-512.png`,
  `apple-touch-icon-180.png`, `avatar-512.png`, `og-1200x630.png`,
  `site.webmanifest`.
- Wired in `web/index.html`: icon/apple-touch links, manifest, theme colour,
  Open Graph and Twitter card.

## Verification

- All 10 SVGs parse; the mono file has one path, `currentColor`, no hex.
- PNG/ICO dimensions: 192, 512, 512, 180, 512, 1200×630; ICO carries 48/32/16.
- Maskable geometry stays inside the 80% safe circle (worst extent 10.20 of
  12.80 units); apple-touch and OG are opaque.
- Manifest paths and every head reference resolve; `npm run build` passes and
  copies the set into `dist/`.
- 16 px render inspected (legible, no thin strokes) and the 512 px tile, both
  lockups and the OG card reviewed.

## Open

- Confirm the inferred intent and promise line above; if they change, only the
  OG copy moves, not the mark.
- Outline a licensed brand font when one exists; DejaVu is the documented
  fallback, not a brand font.
- The app header still shows the text wordmark only. `logo-mark-inverse.svg` is
  ready to sit beside it if the header should carry the mark.
