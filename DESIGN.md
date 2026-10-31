# Edge Engine — UI Design System

The official visual specification for **Edge Engine**. It covers the main app (`/`, `/links`, 404) and the
standalone diagnostic pages (`/ip.html`, `/dns.html`, `/webrtc.html`, `/claude.html`, `/tools.html`).

The system is built on **Vercel's Geist design language** — ink on a near-white canvas, hairline
structure, one mesh gradient — and then tuned for this product: a single monospace family for every
type role, a light-first theme with an equal dark counterpart, and a spec-sheet rhythm borrowed from
engineering documentation. Where this document and the reference material disagree, **this document
wins**, because it describes what the code actually renders.

Implementation: `src/app/globals.css` (app) and `public/tools.css` (standalone pages). Both expose the
same tokens and primitives.

---

## 1. Principles

1. **Subtraction over decoration.** A page is a sheet of paper with ink on it. If an element does not
   carry information, it does not get a border, a shadow, or a colour.
2. **One ink, one flourish.** Headings, body, primary buttons and borders all come from the same
   near-black. Colour exists only in the hero mesh and in small semantic signals.
3. **Structure is 1px.** Cards, inputs, dividers and table rules are hairlines. Depth is a hairline
   plus, at most, a whisper shadow — never heavy elevation.
4. **The grid is visible.** Monospace type means everything sits on a fixed cell. Labels, values and
   counters align because they share that grid, not because of custom margins.
5. **Spec sheet, not landing page.** Sections are numbered (`01`, `02`, …), headings are uppercase
   eyebrows, endpoints are printed in code blocks with a `$` prompt. The UI reads like a terminal
   readout that happens to be clickable.

---

## 2. Colour Tokens

Never hard-code a hex value in a component; use the token. `:root` holds the light theme, `.dark`
overrides every token.

### Surfaces

| Token           | Light     | Dark      | Use                                 |
| --------------- | --------- | --------- | ----------------------------------- |
| `--canvas`      | `#fafafa` | `#0a0a0a` | Page background, inset wells        |
| `--elevated`    | `#ffffff` | `#111111` | Cards, inputs, buttons, code blocks |
| `--soft`        | `#f2f2f2` | `#161616` | Hover fills, quiet rows             |
| `--ink-inverse` | `#ffffff` | `#0a0a0a` | Text on ink fills                   |

### Text ladder

| Token     | Light     | Dark      | Use                               |
| --------- | --------- | --------- | --------------------------------- |
| `--ink`   | `#171717` | `#ededed` | Headings, values, primary CTA     |
| `--body`  | `#4d4d4d` | `#a1a1a1` | Paragraphs, nav links             |
| `--mute`  | `#8f8f8f` | `#7d7d7d` | Labels, captions, metadata        |
| `--faint` | `#a1a1a1` | `#5e5e5e` | Placeholders, disabled, footnotes |

### Structure

| Token             | Light     | Dark      | Use                               |
| ----------------- | --------- | --------- | --------------------------------- |
| `--hairline`      | `#ebebeb` | `#262626` | Every border, divider, table rule |
| `--hairline-soft` | `#f2f2f2` | `#1c1c1c` | Alternating panels, inset rows    |

### Accents & semantic

| Token         | Light     | Dark      | Use                                  |
| ------------- | --------- | --------- | ------------------------------------ |
| `--link`      | `#0070f3` | `#4d9fff` | Links, focus ring, success, live dot |
| `--link-deep` | `#0761d1` | `#76b4ff` | Pressed link                         |
| `--link-soft` | `#d3e5ff` | `#102a44` | Selection background                 |
| `--violet`    | `#7928ca` | `#a855f7` | Secondary accent (mode tags)         |
| `--magenta`   | `#eb367f` | `#ff4d94` | Tertiary accent (scenario tags)      |
| `--cyan`      | `#50e3c2` | `#50e3c2` | Reserved for illustration accents    |
| `--danger`    | `#ee0000` | `#ff4d4d` | Errors, destructive actions, leaks   |
| `--warn`      | `#f5a623` | `#f5a623` | Warnings, admin badges               |

**Rule:** accents appear only in (a) the hero mesh, (b) chips/tags, (c) verdict states, (d) a 3px
underword highlight. They never fill a large surface and never become chrome.

---

## 3. Typography

One family, everywhere: **Maple Mono CN** (`--font-maple`), for Latin, CJK and code alike. Loaded from
jsDelivr as unicode-range-split woff2 slices — `MapleMono-CN-Regular` (400) and
`MapleMono-CN-SemiBold` (600) only. No `Inter`, no `Outfit`, no second sans.

| Role            | Size                       | Weight | Line height | Tracking   |
| --------------- | -------------------------- | ------ | ----------- | ---------- |
| Display (`h1`)  | `clamp(30px, 4.4vw, 44px)` | 600    | 1.1         | `-0.035em` |
| Heading large   | `clamp(22px, 2.6vw, 30px)` | 600    | 1.2         | `-0.025em` |
| Heading medium  | `18px`                     | 600    | 1.35        | `-0.015em` |
| Label           | `13px`                     | 600    | 1.4         | `0`        |
| Eyebrow         | `10px` uppercase           | 600    | 1.4         | `0.12em`   |
| Body            | `13px`                     | 400    | 1.72        | `0`        |
| Small / meta    | `11.5–12px`                | 400    | 1.6         | `0`        |
| Code / endpoint | `11.5px`                   | 400    | 1.75        | `0`        |
| Numeric value   | `22px`                     | 600    | 1.0         | `-0.03em`  |

Rules:

- **Hierarchy comes from size, weight and the ink ladder** — not from a second typeface.
- Negative tracking stops at `-0.035em`. Vercel's `-2.4px` figure is a proportional-sans value; on a
  monospace grid it collapses letter widths and breaks CJK. Track by `em`, never by `px`.
- Body leading is `1.72` (not Vercel's `1.5`) because CJK glyphs are full-height and need air.
- Uppercase eyebrows carry `0.12em` tracking; monospace caps without tracking read as one blob.
- Ligatures are disabled (`font-variant-ligatures: none`) so `!=`, `=>` and `://` stay legible in URLs.
- Weight is binary: 600 for emphasis, 400 for everything else. Never 500 or 700 — the family is loaded
  at 400/600 only, so anything else re-synthesises and smears the grid.

---

## 4. Space, Radius, Elevation

- **Space** is a 4px scale: `4 · 8 · 12 · 16 · 24 · 32 · 40 · 64 · 96 · 128`. Bands use 56–80px
  vertical padding (`py-14` / `py-16`); card interiors use 16–24px (`p-4` / `p-5` / `p-6`).
- **Container**: `.shell` — `max-width: 1200px`, `padding-inline: 24px` (16px under 640px), centred.
- **Radius** is bimodal, and the choice signals the surface:

  | Token    | Value   | Use                                          |
  | -------- | ------- | -------------------------------------------- |
  | `sm`     | `6px`   | Inputs, nav/app buttons, chips, code blocks  |
  | `md`     | `12px`  | Cards, panels, tables                        |
  | `lg`     | `16px`  | Floating dialog                              |
  | category | `64px`  | Category/tab pills, TTL choices, kernel tabs |
  | pill     | `100px` | Marketing CTAs                               |

- **Elevation**: level 0 is a hairline (default). Level 1 adds `--shadow-whisper`
  (`0 1px 1px rgba(0,0,0,.04)`). Level 2 (`--shadow-float`) is reserved for the node dialog. Nothing
  else floats.

---

## 5. Primitives

`globals.css` ships these classes; compose layout with Tailwind utilities, never re-style a primitive
locally.

| Class                                         | Spec                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `.eyebrow`                                    | 10px/600/uppercase/`0.12em`, `--mute` — every section label                              |
| `.display-xl` `.heading-lg/md`                | The type ladder above                                                                    |
| `.shell`                                      | 1200px container with responsive gutters                                                 |
| `.rule`                                       | 1px full-width hairline                                                                  |
| `.card`                                       | `--elevated` + hairline + 12px; `.card-quiet` for canvas fill                            |
| `.card-float`                                 | 16px radius + `--shadow-float` (dialogs only)                                            |
| `.grid-texture`                               | 48px blueprint grid, masked to the hero                                                  |
| `.mesh`                                       | Hero bloom: 5 radial stops (develop/preview/ship), `blur(72px)`                          |
| `.btn-pill` / `.btn-pill-ghost`               | 40px tall, 100px radius, 14px/600 — marketing CTAs                                       |
| `.btn-square` / `.btn-square-ghost`           | 30px tall, 6px radius, 12px/600 — nav & app chrome                                       |
| `.tab-pill`                                   | 34px tall, 64px radius; `data-active="true"` → ink fill                                  |
| `.input` / `.textarea`                        | 6px radius, hairline, ink focus border + `3px` link ring; `data-invalid="true"` → danger |
| `.code-block`                                 | Canvas fill, hairline, 11.5px mono — endpoints, logs, readouts                           |
| `.chip` (+`-ink/-link/-warn/-danger/-violet`) | 20px tall, 6px radius, 10px/600 uppercase, hairline border                               |
| `.section-head`                               | Hairline-underlined band holding an eyebrow + trailing meta                              |

**Button shape carries meaning**: pills are marketing/primary actions; 6px squares are app controls.
Never mix the two inside one toolbar.

---

## 6. Hero Signature

The only decorative moment on the site, and it is deliberately small:

- `.mesh` — five soft radial stops from the brand gradient family, `blur(72px)`, masked to fade out
  before the first content band. Light theme opacity `1`, dark `0.5`.
- `.grid-texture` — 48px blueprint grid at ~4.5% ink, radial-masked from the top of the hero.
- Hero content is centred: `$` terminal badge with a blinking caret, one display headline with a 3px
  gradient underword highlight at 10% opacity, one lead paragraph, two pills, three mono meta checks.
- Nothing else on the page gets a gradient, glow, or blurred blob.

---

## 7. Page Anatomy

**Workspace (`/`)** — nav (sticky, hairline bottom, pill nav links) → hero → runtime metrics strip
(hairline-divided cells on elevated white) → `01` sources (raw proxies + remote providers) beside a
**sticky** `orchestration` rail (kernel tabs, mode tiles, rule tiles, secret, mirror) → `02` endpoint
spec table + CTA and the resulting endpoint code block → `03` routing path visualisation → `04` tool
grid (1px-gap hairline cells) → footer.

**Link console (`/links`)** — hero → shared access-key card → `01` create (target, optional custom
slug, TTL pills) → result card with copy/open → `02` lookup (public) or admin panel
(`?admin=1`: admin key, slug create, repoint, delete) → activity log rendered as a terminal readout.

**404** — brand mark, `$ edge route --not-found` eyebrow, oversized numeral, one sentence, recovery
buttons, a `$ edge route --resolve <path> → 404` readout, footer.

**Diagnostic pages** — brand bar + pill nav → eyebrow badge → heading → subtitle → verdict banner →
action pill → hairline table or card grid → footer. All colours come from `public/tools.css` tokens.

---

## 8. Motion

- One page-load reveal (`--animate-reveal`: 8px rise, 500ms, `cubic-bezier(.16,1,.3,1)`), used on the
  hero and on result blocks.
- Hover transitions are 160–180ms and change `background-color`, `border-color` or `color` — never
  transforms, never scale, never lift.
- Theme switching uses the View Transitions circular wipe (450ms) and falls back to an instant swap.
- The caret blinks at 1.4s; live dots use a soft opacity pulse. `prefers-reduced-motion` disables all
  of it.

---

## 9. Accessibility

- Focus: `outline: 2px solid var(--link)` with 2px offset on every interactive element; inputs use an
  ink border plus a `3px` link-tinted ring instead of an outline.
- Contrast: `--ink` on `--canvas` is 15.9:1, `--body` on `--canvas` 7.4:1, `--mute` 3.6:1 (metadata
  only). Never put `--faint` on a coloured surface.
- Targets: pills/CTAs are 40px tall, app controls 30px with `0 10px` padding, table rows 44px.
- Icon-only buttons always carry `aria-label` and a `title`.
- Colour is never the only signal: verdicts pair a colour with a glyph and text.

---

## 10. Do / Don't

**Do**

- Reach for a hairline before a shadow; reach for `--canvas` vs `--elevated` before a border.
- Label sections with an uppercase eyebrow and a two-digit index.
- Print machine-facing values (URLs, slugs, keys, counters) in mono with `tabular-nums`.
- Let the ink ladder (`ink → body → mute → faint`) express emphasis.
- Keep one CTA per band; make it a pill.

**Don't**

- Don't introduce a second typeface, an italic, or a 500/700 weight.
- Don't fill large areas with accents, and don't use a gradient outside the hero.
- Don't use rounded rectangles larger than 12px for content (only pills, tab pills and the dialog).
- Don't stack shadows or add glow; don't animate layout properties.
- Don't hard-code hex values — dark mode must come from tokens, not from component overrides.

---

## 11. Differences from the Vercel Reference

| Reference                                | Edge Engine                                          | Why                                                       |
| ---------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| Geist Sans display + Geist Mono eyebrows | Maple Mono CN for every role                         | Product decision: one technical family, full CJK coverage |
| Display tracking `-2.4px`                | `-0.035em` max, tracked in `em`                      | Pixel tracking destroys monospace widths and CJK          |
| Body leading `1.5`                       | `1.72`                                               | CJK glyphs are full-height and need vertical air          |
| Light-only, single theme                 | Light-first + equivalent dark set                    | Users work at night; dark is a first-class theme          |
| Full-height mesh in the hero             | Masked bloom, fading before the first band           | Keeps content bands pure ink-on-paper                     |
| Accent colours only in the mesh          | Accents also tag scenarios, verdicts and admin state | This is a diagnostic tool: semantic colour is information |
| Interchangeable 6px / pill buttons       | Shape is a contract (pill = action, square = chrome) | Prevents ambiguous affordances in dense toolbars          |

---

## 12. Implementation Map

| Concern                        | File                                                           |
| ------------------------------ | -------------------------------------------------------------- |
| Tokens, primitives, base rules | `src/app/globals.css`                                          |
| Standalone-page tokens/styles  | `public/tools.css`                                             |
| Shared chrome                  | `src/components/layout/{SiteNav,SiteFooter,SectionHead}.tsx`   |
| 404 surface                    | `src/components/layout/NotFound.tsx`                           |
| Workspace page                 | `src/app/index.tsx`                                            |
| Link console                   | `src/app/links.tsx`, `src/lib/links.ts`                        |
| Theme resolution               | `src/components/home/usePreferences.ts` + `src/app/__root.tsx` |
| Diagnostic pages               | `public/{ip,dns,webrtc,claude,tools}.html`                     |
