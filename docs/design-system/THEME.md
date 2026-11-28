# Theme system — industrial

Token prefix: `--ll-` · Dark mode: included · Stack: react, vite, typescript

Chosen because: manufacturing language in the docs — dense operational screens, long shifts, shop-floor light.

> **Adopted in `web/src/theme/tokens.css`.** The palette below is now the
> production light/dark contract under LoomLine's existing `--ll-*` names
> (chrome, text, surface-*), not the generator's role names. This directory is
> the generator baseline, not an imported stylesheet. LoomLine keeps its chrome
> and sidebar roles, its existing type/space/radius scales, and explicit light,
> OS-dark and `data-theme` blocks; the two metadata hex values are the
> `theme-color` metas. Those are why the audit still flags one token block and
> two component hex values.

## Audit of the existing theme

Existing custom properties: 89 (e.g. danger, icon, ll-breakpoint-narrow, ll-color-accent, ll-color-accent-fg, ll-color-accent-soft)
[gap] single token block
[ok] accent role
[ok] surface + ink roles
[ok] status roles (danger/success/warning)
[ok] focus ring token
[ok] selection token
[ok] disabled tokens
[ok] overlay token
[ok] reduced-motion
[ok] explicit color-scheme
[ok] dark theme mechanism
[gap] hardcoded hex in component code: 2 — move literal colours into the token layer
[ok] inline colour styles: 0

## Colour

| Role | Light | Dark |
| --- | --- | --- |
| `canvas` | `#f6f7f8` | `#0e1418` |
| `surface` | `#ffffff` | `#151d23` |
| `raised` | `#eef1f3` | `#1c262e` |
| `ink` | `#16202a` | `#e8eef2` |
| `muted` | `#47535f` | `#a8b6c0` |
| `subtle` | `#5f6b76` | `#8b9aa5` |
| `border` | `#d3dae0` | `#2a3741` |
| `strong` | `#9aa7b2` | `#46545f` |
| `accent` | `#0f7f6b` | `#4fd1b5` |
| `accent_contrast` | `#ffffff` | `#08231d` |
| `danger` | `#b3261e` | `#ff8a80` |
| `success` | `#1c6b45` | `#7ad9a8` |
| `warning` | `#8a5a00` | `#f0c060` |
| `info` | `#1a5f8a` | `#8fc8ee` |
| `focus` | `#0b6ea8` | `#7cc4f0` |

Derived roles: `accent-hover` (12% darker/lighter), `accent-soft` (12% tint on surface), and the status `-soft` tints. Selection uses a 22% accent tint.

### Contrast (WCAG 2.1)

| Pair | Ratio | Minimum | Result |
| --- | --- | --- | --- |
| `ink` on `surface` | 16.48:1 | 4.5:1 | pass |
| `muted` on `surface` | 7.86:1 | 4.5:1 | pass |
| `subtle` on `surface` | 5.45:1 | 4.5:1 | pass |
| `accent` on `surface` | 4.92:1 | 4.5:1 | pass |
| `accent_contrast` on `accent` | 4.92:1 | 4.5:1 | pass |
| `danger` on `surface` | 6.54:1 | 4.5:1 | pass |
| `success` on `surface` | 6.48:1 | 4.5:1 | pass |
| `warning` on `surface` | 5.93:1 | 4.5:1 | pass |
| `info` on `surface` | 6.89:1 | 4.5:1 | pass |
| `focus` on `canvas` | 5.14:1 | 3.0:1 | pass |

<details><summary>Dark-mode ratios</summary>

| Pair | Ratio | Minimum | Result |
| --- | --- | --- | --- |
| `ink` on `surface` | 14.57:1 | 4.5:1 | pass |
| `muted` on `surface` | 8.21:1 | 4.5:1 | pass |
| `subtle` on `surface` | 5.90:1 | 4.5:1 | pass |
| `accent` on `surface` | 9.03:1 | 4.5:1 | pass |
| `accent_contrast` on `accent` | 8.77:1 | 4.5:1 | pass |
| `danger` on `surface` | 7.47:1 | 4.5:1 | pass |
| `success` on `surface` | 10.00:1 | 4.5:1 | pass |
| `warning` on `surface` | 10.08:1 | 4.5:1 | pass |
| `info` on `surface` | 9.47:1 | 4.5:1 | pass |
| `focus` on `canvas` | 9.73:1 | 3.0:1 | pass |

</details>

Status is always **text + icon + colour**; colour alone never carries meaning.

## Typography

- Sans: `"IBM Plex Sans", "Inter", system-ui, -apple-system, sans-serif`
- Mono: `"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace`
- Scale: 12 / 14 / 16 / 18 / 22 / 28 / 36 px (`text-xs` … `text-3xl`).
- Body 16 px, line-height 1.5; dense tables may use `text-sm` at 1.5.
- Self-host fonts with `font-display: swap`; never block first paint on a CDN.
- Max two families and three weights per screen.

## Space, radius, elevation, motion

- Space: var(--ll-space-1), var(--ll-space-2), var(--ll-space-3), var(--ll-space-4), var(--ll-space-5), var(--ll-space-6), var(--ll-space-7), var(--ll-space-8).
- Radius: var(--ll-radius-sm), var(--ll-radius-md), var(--ll-radius-lg), var(--ll-radius-pill).
- Elevation is for overlays only; page surfaces use borders, not shadows.
- Motion: var(--ll-duration-fast) for hover, var(--ll-duration-base) for enter/exit, var(--ll-ease-standard); honour `prefers-reduced-motion` (already in tokens.css).

## UI shell

```html
<a class="skip-link" href="#main">Skip to content</a>
<header class="app-header"> … brand lockup · primary nav · account menu … </header>
<div class="app-body">
  <nav aria-label="Primary"> … </nav>          <!-- collapses to a drawer < 900px -->
  <main id="main" tabindex="-1"> … page … </main>
  <aside aria-label="Context"> … optional … </aside>
</div>
<footer> … </footer>
```

- One `<main>` per page, one `<h1>`; header height `layout-header`.
- Skip link is the first focusable element and targets `#main`.
- Content width `layout-content`; prose `layout-prose`; gutter `layout-gutter`.
- Navigation is text-first; icons never replace a label without `aria-label`.

## Page templates

| Page | Structure | Notes |
| --- | --- | --- |
| List | header (title + primary action) → labelled filters → live region → table with caption | empty, loading and error states in the same slot |
| Detail | back link → title + status badge → meta grid → sections → sticky action bar | destructive actions separated and confirmed |
| Form | single column ≤ 680 px → field groups → inline errors → primary action | labels above fields; no placeholder-only labels |
| Auth | centred card ≤ 400 px → mark + wordmark → one column | no app navigation before sign-in |
| Settings | section nav (≥ 900 px) → stacked sections | save is explicit; unsaved-changes guard |

## Alerts and feedback

| Pattern | Markup | Behaviour |
| --- | --- | --- |
| Field error | `<p class="field-error" id="x-error" role="alert">` | input gets `aria-invalid` + `aria-describedby`; focus first invalid field |
| Page banner | `<div role="alert">` error · `role="status"` success | never auto-dismiss an error; dismiss button has an accessible name |
| Toast | `role="status"` polite, `role="alert"` assertive | one at a time; 6 s for success, persistent for error |
| Confirm | `role="dialog" aria-modal="true"` + labelled title | focus trap, Escape cancels, focus returns to the trigger |
| Loading | `aria-busy="true"` + `role="status"` text | spinner is decorative (`aria-hidden`); state is announced |

## Component states

- **Default / hover / active**: background shifts by token, never by a raw hex.
- **Focus-visible**: 2 px `color-focus` ring, 2 px offset; never removed.
- **Disabled**: `disabled` or `aria-disabled` + `color-disabled-*`; still readable.
- **Loading**: keep width stable, disable the action, announce the state.
- **Selected**: accent-soft background + 3 px accent edge, not colour alone.
- **Error**: danger border + field message + `aria-invalid`.

## Usage rules

1. Components use only semantic tokens (`var(--ll-color-surface)`), never raw hex.
2. One token source: this file. A per-component palette is drift.
3. New token ⇒ new role and a line in this guide; otherwise reuse.
4. Tables, badges and alerts share the same status recipe.
5. Any animation must have a reduced-motion path.

## Adoption checklist

- [ ] Map the existing prefix to the new prefix (or keep `--ll-`).
- [ ] Replace hardcoded hex and inline colour styles.
- [ ] Add shell landmarks and the skip link.
- [ ] Convert one list, one detail and one form page before the rest.
- [ ] Re-run `css_stack_standards` and `ux_architecture`; both should improve.
- [ ] Record the chosen style and palette in the design-system doc or an ADR.

Generated CSS: `tokens.css` (202 lines).
