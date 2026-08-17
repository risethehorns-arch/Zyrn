# ZYRN — Landing page build spec

`SYS.01 — Build spec / V.1.0` · AMM 31.95°N / 35.93°E — EST. 2026

> Source of record. Converted from `zyrn-landing-page-prompt.docx`, uploaded to the
> Claude Design project. Original artifacts kept in `design/`.

Build this page **pixel-faithfully**. Do not invent alternate copy, layout, fonts,
colors, or effects. Where this document is silent, choose the quieter option —
Zyrn's design doctrine is instrument-grade restraint.

---

## Page identity

- **Title:** `ZYRN — Organizations, Engineered`
- **Brand:** uppercase sheared `ZYRN` wordmark (custom component, spec below). No icon fonts, no hexagon.
- **Overall feel:** dark instrument-grade precision site; full-viewport scroll-scrubbed
  video background; Vapor typography with subtle shadows; hairline-bordered panels
  (NOT frosted-glass blobs); mono metadata everywhere; one Pulse accent per viewport;
  the shear as the single signature device.

### Doctrine — governs every ambiguous decision

1. **Silence is the luxury** — 80%+ of any viewport is empty or video.
2. **Metadata as ornament** — the only decoration is real information (coordinates, indices, timestamps, version tags) set in mono.
3. **One Pulse per surface** — `#6E56F8` appears exactly once per viewport.
4. **The shear belongs to the logo only** — never shear photos, headlines, or cards.

---

## Design tokens (exact)

| Token    | Value                      | Use |
|----------|----------------------------|-----|
| Obsidian | `#0E0F12`                  | Page bg, dark panels |
| Vapor    | `#F2F3F5`                  | Primary text on dark |
| Pulse    | `#6E56F8`                  | THE accent. Shear seam, one CTA, live indicators. Once per viewport. |
| Steel    | `#767E8C`                  | Secondary text, mono metadata |
| Hairline | `rgba(242,243,245,0.08)`   | All borders and dividers, 1px |

- Page bg `#0E0F12`; default text `#F2F3F5`; selection `rgba(110,86,248,0.25)`.
- **No frosted glass.** Panels are `rgba(14,15,18,0.6)` + `backdrop-blur(2px)` +
  1px hairline border — a dark veil with a hairline, not a white glass chip.
- **No white/15 chips, no drop-shadow-lg walls.** Text over video gets
  `text-shadow: 0 1px 12px rgba(14,15,18,0.6)` via a utility class, nothing heavier.

---

## Fonts

- Google Fonts: **Space Grotesk** 400/500 (display + UI), **IBM Plex Mono** 400/500 (all metadata, labels, indices).
- Antialiased. Headline tracking `-0.01em`.
- Mono labels always `11px / uppercase / tracking 0.16em / #767E8C`.
- **The wordmark is never typed as plain text** — it is always the shear component.

---

## Assets

Hero scroll video (CloudFront — keep this exact URL as placeholder):

```
https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4
```

- Wrap the video layer in a treatment div: `filter: saturate(0.65) contrast(1.05)`
  plus an Obsidian overlay at 35% so the footage's warm golds cool toward the Zyrn
  palette. A second overlay top and bottom: obsidian → transparent → obsidian at 60%
  opacity — the video emerges from darkness and returns to it.
- **TODO(asset):** regenerate a native Zyrn video later — abstract dark machined
  forms, indigo light, cold mist. Same duration class (~8–12s), 1920×1080. Until then
  the treated placeholder ships.
- Optional local mirrors: `assets/media/hero.mp4`, `assets/media/hero-poster.jpg`.
  Poster must receive the same filter treatment.
- **No portrait photo.** The Access Card replaces any portrait. Zyrn does not show
  faces on the landing page — the brand is the instrument, not the operator.

---

## The shear wordmark (signature — build first)

**Structure:** two absolutely-stacked copies of `ZYRN` (Space Grotesk 500, tracking `0.06em`), each clipped to one half:

- Top copy: `clip-path: inset(0 0 50% 0)`
- Bottom copy: `clip-path: inset(50% 0 0 0)`
- Seam: 2px-tall div in Pulse, vertically centered, 12px overhang each side.

**Props:** `size` (font-size), `progress` (0–1, drives the shear externally), `auto` (self-animates on mount when no scroll binding).

**Shear math (fixed law):**

- Max offset = **10% of font-size** (`0.1em`). Never more.
- Top half `translateX(-offset × progress)`; bottom half `translateX(+offset × progress)`. Always this direction.
- Seam: `scaleX(progress)`, `opacity: progress`.
- `auto` transition: `650ms cubic-bezier(0.83, 0, 0.17, 1)`, fires 300ms after mount,
  shears to `progress = 1` and **stays sheared** (aligned = before, sheared = after;
  it never snaps back).
- `prefers-reduced-motion`: render statically at `progress = 1`.

**Monogram variant:** same two-half clip technique applied to a single `Z` glyph (SVG, stroke Vapor, square caps) with the Pulse seam. Used as favicon, nav mark at mobile widths, and footer stamp.

---

## Global structure

```
relative root (bg #0E0F12)
  ScrollVideo        fixed inset-0 z-0, pointer-events-none (treated video + overlays)
  HairlineGrid       fixed inset-0 z-[1], pointer-events-none
  ScrollReadout      fixed right edge z-40 (desktop only)
  relative z-10 wrapper
    Navbar           fixed top, z-50
    main
      SectionOne     min-h 100svh   — hero
      spacer         80vh, aria-hidden — scrub room (do not remove)
      SectionTwo     min-h 100svh   — capability
      Footer         hairline-top strip
```

- Horizontal rhythm: `clamp(20px, 4vw, 48px)`. Section pad top `110px`, bottom `56–64px`.
- **HairlineGrid:** two vertical 1px lines at `33.333%` and `66.666%` in
  `rgba(242,243,245,0.04)`, hidden below `md`. The page reads as laid on an
  engineer's grid.

---

## Scroll system — this is where the immersion lives

### 1. Scroll-scrubbed video

Fixed full-bleed `z-0`, `overflow-hidden`, `pointer-events-none`. Layers bottom→top:
treated poster → `<video>` (muted, playsInline, preload=auto, object-cover) → `<canvas>`
drawing cached frames. Crossfades `500ms`.

- `progress = scrollY / (scrollHeight - innerHeight)` clamped 0–1.
- **Lerp factor `0.08`** — slower settle reads as mass and machinery rather than UI.
  Each rAF: `smoothed += (target - smoothed) * 0.08`.
- Frame cache: offscreen video, up to **120 frames** (or `duration × 14`, min 30),
  max width **1024px**, extraction starts after visible video `loadeddata` + 300ms yield.
  Canvas draws `ImageBitmap` by smoothed index with object-cover math. DPR `min(dpr, 2)`.
- Fallback: seek visible video to `smoothed × (duration - 0.05)` when delta > 0.04s.
- **Micro-parallax:** canvas draw scale `1.0 + smoothed * 0.04` — an almost-subliminal
  push-in across the full scroll. Center-anchored.
- No autoplay looping. Motion is scroll-driven only.

### 2. The shear is scroll-bound in the hero (signature moment)

`shearProgress = clamp(scrollY / 220, 0, 1)`, lerped with the same 0.08 factor.

- At page top the wordmark sits **aligned and whole**. As the user makes their first
  scroll gesture, the halves shear apart and the Pulse seam draws itself left-to-right
  (`scaleX` origin-left for this instance).
- Once `progress` reaches 1 it **latches** — scrolling back up does NOT un-shear.
  The transformation happened; it does not undo. This is the brand narrative executed
  in scroll physics.
- The nav logo self-shears on load, independently.

### 3. ScrollReadout — metadata as ornament, made live

Fixed vertical rail, `right: 20px`, vertically centered, desktop only (hidden below `lg`),
`z-40`, mono `10px / tracking 0.16em / Steel`, `writing-mode: vertical-rl`.

Content: `ZYRN / SYS.01 — {pct}%` where `{pct}` = `round(smoothed * 100)` padded to
3 digits (`007`, `042`, `100`). Beside it a 1px track `96px` tall in Hairline with a
Pulse fill scaling with progress — **this counts as the Pulse instance for mid-scroll
viewports**. Enforce by giving the rail fill `opacity: 0` until `smoothed > 0.15`.

The page tells you where you are the way an instrument does: with a number.

### 4. Reveal animation

IntersectionObserver, threshold `0.15`, `will-change: transform`.

- Hidden: `translateY(24px)`, `opacity: 0`, `clip-path: inset(0 0 18% 0)`
- Visible: `translateY(0)`, `opacity: 1`, `clip-path: inset(0 0 0 0)`
- Transition `700ms cubic-bezier(0.22, 1, 0.36, 1)`, per-element delay per section.
- The clip component makes text feel machined into place rather than floated in.
  Apply to text blocks and panels only — never images/video.
- `prefers-reduced-motion`: all reveals render visible statically; scrub still functions
  (it is position, not animation) but micro-parallax scale locks at 1.0.

---

## Navbar (fixed, z-50)

- Full width, 1px hairline bottom border, `rgba(14,15,18,0.7)` + `backdrop-blur(6px)`.
- Row: shear wordmark @20px `auto` left | center links (md+) | right cluster.
- Links: `Work`, `System`, `Journal`, `Contact` — `14px`, `#F2F3F5`/85 →
  hover `#F2F3F5`, transition 300ms, gap 40px. `Work` carries superscript `06` in mono
  `10px` Steel.
- Right cluster: mono label `AMM 31.95°N / 35.93°E` (hidden below `xl`, Steel) + CTA
  `Request access` — 4px radius, `1px solid rgba(242,243,245,0.15)`, `8px 20px`,
  hover `rgba(242,243,245,0.05)`. **The nav CTA is hairline, NOT Pulse** — the hero
  owns the viewport's Pulse.
- Reveal delays: logo 0; links `100 + i×100`; right cluster `500`.

---

## Section One — Hero

Full viewport flex column `justify-between`.

**Top row** — left: service index (gap 8px), each delay `150 + i×120`, mono `12px`
uppercase tracking `0.16em` `#F2F3F5`/90:

```
01 / HUMAN CAPITAL
02 / BUSINESS STRUCTURING
03 / AI TRANSFORMATION
04 / WEB & STRATEGY
```

(The numbering is real — these are the four service lines, indexed as a system.)

Right — intro (`max-width 320px`, right-aligned, delay 300), `clamp(18px,1.4vw,20px)`,
line-height 1.65:

> Zyrn builds the operating core of modern firms — people, structure, and intelligence as one system.

**Bottom row** —

Left:
1. Badge, delay 150: `border-left: 2px solid #F2F3F5`, `padding: 6px 0 6px 12px`
   (no background fill), mono `11px` uppercase `#F2F3F5`/80: `BY REFERRAL — 04 SEATS / Q3`
2. H1 lockup, delay 280: scroll-bound shear at `clamp(48px, 6.5vw, 72px)`, followed on
   the next line by static text `Organizations, engineered.` in Space Grotesk 400,
   `clamp(20px,1.8vw,24px)`, `#F2F3F5`/85, `margin-top: 20px`, tracking `-0.01em`.

Right — **Access Card**, delay 420:
- Container: `max-width 320px`, radius 8px, hairline border, `rgba(14,15,18,0.6)`,
  `backdrop-blur(2px)`, padding 20px
- Row 1: mono `NEXT INTAKE` (Steel) + right-aligned mono `Q3 — 2026` (Vapor)
- Hairline divider, margin 16px 0
- Row 2: four `6px` squares, radius 1px — three in `#F2F3F5`/25, one live with
  `seatpulse 2s infinite` — beside mono `01 OF 04 SEATS OPEN` (Steel).
  *The live square is `#F2F3F5` at rest and turns Pulse only on card hover, so the
  hero's single Pulse stays the wordmark seam.*
- Button, margin-top 16px: `Request access` + arrow-up-right 14 — full width, radius 4px,
  bg Vapor, text Obsidian, `10px 16px`, `12px` 500, hover `rgba(242,243,245,0.85)`

---

## Mid spacer

`80vh`, aria-hidden. **Do not remove** — it is the scrub runway between sections.

---

## Section Two — Capability

Same full-viewport flex `justify-between` shell.

**Top row:**
- Left badge, delay 120, hero-badge style: `SYS.02 — INTELLIGENCE LAYER`
- Right copy, delay 220 (`max-width 384px`, right-aligned):
  > Zyrn doesn't advise from the outside. It installs the system and stays until it runs.

**Bottom area** — left column (`max-width 576px`):

1. H2, delay 180, `clamp(48px,6.5vw,72px)` weight 400, line-height 1.05, tracking `-0.01em`:
   ```
   Built once.
   Runs itself.
   ```
2. Body, delay 320 (`margin-top 24px`, `max-width 448px`, `15px`, `#F2F3F5`/70):
   > From org chart to inference layer, Zyrn turns how a firm works into something engineered — measured, versioned, and improving on its own.
3. CTAs, delay 420 (`margin-top 32px`, gap 12px):
   - Primary: `Request access` + arrow 14 — radius 4px, **bg Pulse `#6E56F8`**, white text,
     `10px 20px`, hover `#7d67f9`. *(This is Section Two's single Pulse.)*
   - Secondary: `Read the system doc` — radius 4px, hairline border `rgba(242,243,245,0.15)`,
     `10px 20px`, hover `rgba(242,243,245,0.05)`

Right — capability panel: `max-width 448px`, radius 8px, hairline border,
`rgba(14,15,18,0.6)`, `backdrop-blur(2px)`, padding `0 24px`.

Three rows, hairline dividers except last, each `display: flex; gap: 20px; padding: 20px 0`,
delay `300 + i×110`:

| Index     | Title              | Body |
|-----------|--------------------|------|
| `SYS.02a` | Diagnostic core    | Reads how the organization actually runs — roles, flows, and friction — before touching anything. |
| `SYS.02b` | Structural rebuild | Redesigns the operating model so people, process, and AI hold load in the right places. |
| `SYS.02c` | Live calibration   | Instruments the new system and tunes it against real output, quarter over quarter. |

- Index: mono `11px` tracking `0.16em` Steel, `min-width: 56px`, `padding-top: 4px`
- Title: `17px` weight 500 Vapor + arrow-up-right 16 (`#F2F3F5`/40; on row hover
  `translate(2px, -2px)` and Vapor, transition 300ms)
- Body: `margin-top 6px`, `14px`, line-height 1.6, `#F2F3F5`/60

---

## Footer

Hairline-top strip, `flex justify-between items-center`, padding `20px` + gutter,
mono `10px` tracking `0.16em` Steel:

- Left: Z monogram @14px + `ZYRN — EST. 2026`
- Center (hidden below `md`): `AMM 31.95°N / 35.93°E`
- Right: `V.1.0 / EN — AR`

---

## Interactions / motion checklist

1. Scroll scrub maps page scroll → video timeline, lerp 0.08, with 4% push-in parallax
2. Hero wordmark shears with first 220px of scroll and latches sheared (one-way)
3. Nav logo self-shears 300ms after mount
4. ScrollReadout rail: live 3-digit percentage + Pulse progress fill (desktop)
5. Clip-reveal fade-ups on viewport entry, 700ms, per-element delays
6. Button/link transitions 300ms; capability arrows nudge diagonally on hover
7. Poster → video → canvas crossfades 500ms
8. `prefers-reduced-motion`: shear static at 1, reveals static, parallax off, scrub position-only
9. No looping autoplay anywhere

---

## Responsive rules

- Nav links hidden below `md`; ScrollReadout hidden below `lg`; HairlineGrid hidden
  below `md`; coordinates label hidden below `xl`
- Hero and Section Two stack vertically on mobile, side-by-side from `sm`/`md` as specified
- `min-height: 100vh` plus `100svh` where supported
- Touch: video `playsInline` + muted
- Mobile nav shows the Z monogram instead of the full wordmark below `sm`

---

## Do not

- Do not use white frosted-glass chips anywhere — Obsidian veils with hairlines only
- Do not let Pulse `#6E56F8` appear more than once per viewport
- Do not shear anything except the wordmark / monogram components
- Do not replace Space Grotesk / IBM Plex Mono
- Do not add gradients (except the two Obsidian video-edge fades), glows, or noise overlays
- Do not use exclamation marks or superlatives anywhere in copy
- Do not show faces or stock portraits
- Do not remove the `80vh` spacer
- Do not type ZYRN as plain text in nav, hero, or footer

---

## Acceptance

Top of page: hairline nav with self-shearing logo + indexed service list + intro +
aligned ZYRN wordmark over the treated scroll video, referral badge and Access Card in
place. First scroll gesture: the wordmark shears apart, Pulse seam draws, and latches —
while the video begins scrubbing and the right-rail readout counts. After the spacer:
`SYS.02` badge, "Built once. Runs itself.", dual CTAs with a single Pulse button,
three-row capability panel. Footer stamp with coordinates and version. Every viewport
shows exactly one Pulse element.

`ZYRN — EST. 2026` · `V.1.0 / EN — AR`
