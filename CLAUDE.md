# ZYRN

Brand site for Zyrn — an org-engineering firm (human capital, business structuring,
AI transformation, web & strategy). Amman, JO. Positioning: *Organizations, engineered.*

The full authored brief lives in `docs/build-spec.md`. **Read it before any visual
change.** This file is the short operative version.

## Where the rest of this lives

Three sections moved out of this file on 2026-08-30 so that opening Claude
Code inside this repo does not load 73,000 characters before you have asked
anything. Nothing was deleted; each one loads when it is relevant.

- **The pages** — what every .html file is, what it argues, and the
  non-obvious reasons behind each: `.claude/rules/pages.md`. Loads
  automatically whenever an .html file in this repo is touched. That includes
  the one routing gotcha worth knowing up front: **`services.html` lives at
  the ROOT, not at `services/index.html`**, because `routeFor()` keys on the
  last path segment and a directory URL yields `''` — which is already the
  landing page's key.
- **The signature instruments** — every scroll instrument, how it is driven,
  and the history of the ones that were deleted: `.claude/rules/instruments.md`.
  Loads whenever a module, a script or `svc-modules.css` / `case.css` is
  touched. Read it BEFORE building a new instrument; four of them have already
  been rebuilt, and the reasons are all in there.
- **Open items and settled questions** — `docs/decisions.md`. Not
  auto-loaded. **Read it before re-opening a design question**: several
  entries exist because something was tried, rejected, and would otherwise be
  tried again.

The rules that follow in THIS file are the ones that apply everywhere, all the
time — tokens, hard rules, doctrine, and the verification traps. Those stay.

## Preview

```
python3 -m http.server 8000       # run from the project root
```

Then `http://localhost:8000/index.html`. For phone testing use this PC's LAN IP or a
Cloudflare quick tunnel — see the note in memory about which link to send.

## Port notes — where `index.html` deliberately differs from the `.dc.html`

Checked against `support.js`, the Claude Design runtime the `.dc.html` imports.

- **`style-hover="…"`** is not a plain attribute. The runtime's `collectProps` strips
  the `style-` prefix and calls `pseudoClass(name, css)`, which mints a `.scpN:hover{…}`
  rule with `!important` forced onto every declaration — it has to, because the base
  styles are inline and inline beats a class selector. Our port keeps base styles in
  real classes, so ordinary `:hover` rules achieve the same thing without `!important`.
  All five hover states from the source are implemented.
- **Box model.** The runtime injects no reset (`BASE_CSS` is only editor chrome —
  placeholders, streaming shimmer, error badges), so the `.dc.html` renders under
  content-box, where the access card's `width:100%` button spills 16px into the card's
  padding on each side. The spec's declared stack is Tailwind, whose preflight sets
  `border-box` globally and whose `max-w-xs` means 320px total. We use border-box; the
  `.dc.html`'s spill is a missing-preflight artifact, not the intent.
- **Capability arrows nudge on row hover, not arrow hover.** The source attaches
  `style-hover` to the arrow `<span>` itself; the spec says `group-hover`. We followed
  the spec. The rows are also `<a>` elements here, since the arrow implies a link.
  Related: the source's helmet carries `a:hover{color:#FFFFFF}`, which is inert there
  (its only anchors are the nav links, whose `!important` pseudo-class wins). It is
  deliberately not carried over — it would push whole capability rows to pure white,
  which is neither in the palette nor in the spec.

## Three further departures — now SITE-WIDE

Adopted 2026-08-17 when the field replaced the video bed on every page. They are
in force everywhere except `brand.html`, which is exempt from Departure 4 because
it has to be able to print the accent. Full reasoning in
`docs/spec-presence-field.md` §0, and they are documented for the reader in
`brand.html` §08.

3. **Additive light is permitted there.** "No glows, no noise" exists to stop
   decorative glow on a flat page; on a surface whose entire medium is emitted
   light there is no flat page to protect.
4. **The field is the Pulse — with one exception: THE MARK.** Implemented in
   `field.css` by remapping `--pulse` to Vapor, plus explicit fixes for the
   v1.0 rules that wrote Pulse as a raw `rgba()` (`::selection`, the glass
   tint's 2% stop). No button, rule or hover state prints the accent.
   **The wordmark does.** The brand kit is explicit — *"Seam: scaleX(progress),
   2px, Pulse, 12px overhang each side"* (`brand.html` §03) — and the owner
   asked for it back in the kit colour (2026-08-17). The seam, the monogram
   seam and the glitch's scan slice use `--pulse-mark: #6E56F8`, a token that
   exists **only** for the mark because `--pulse` itself is remapped. Nothing
   else may use it. To revert the whole departure, delete that one block.
6. **The ramp may leave the four tokens — as light only.** The shipped ramp is
   `vivid`: green-teal `#5FE3B0` → cyan `#33C9DE` → **Pulse `#6E56F8`** → Vapor.
   The two cold stops are not brand ink and must never appear in the DOM; they
   exist so the field travels through hue rather than only through luminance.
   Pulse stays the anchor and the dominant stop. The original in-palette ramp is
   one word away: `initField({ ramp: 'strict' })` — Steel → Pulse → Pulse+ →
   Vapor. Requested directly by the owner (2026-08-17) against a reference
   image; it supersedes the spec's "no teal, no second accent."
   Consequence: the bloom ceiling of 0.35 went with it. Vivid runs 0.46, because
   a ramp carrying real chroma needs the lift to actually glow.
5. **The hero's count is read, not typed.** SYS.01 states the live particle count
   as mono metadata under the lockup (`.lockup__live`), and the stats strip reports
   frame budget, cold start and fps off the running sim. If the perf governor steps
   the field down, both change with it. Any value that cannot be measured shows an
   em dash — never a plausible constant. Doctrine rule 2 taken to its conclusion.

## Two owner-authorised departures from the original spec

Both were requested directly. They override `docs/build-spec.md`, which still carries
the original prohibitions — read that file knowing these two lines are superseded.

1. **Glass is now permitted** (spec said "no frosted glass"). The implementation is
   deliberately not generic glassmorphism: obsidian-tinted fill, a specular hairline
   top edge, a float shadow, and idle drift on coprime durations. No white chips.
   Tokens: `--glass-tint` / `--glass-blur` / `--glass-edge` / `--glass-spec` /
   `--glass-lift`. If you add a panel, use them rather than inventing a new surface.
2. **The wordmark glitches** (spec said the shear latches and never snaps back). The
   latch is intact — the glitch is applied to a `.glitch` *wrapper*, never to the
   halves, so the sheared state underneath is untouched. It is a transmission artefact
   on an already-sheared signal, not a reversal of it.

`ui.js` schedules the glitch at randomised intervals with occasional double-taps; a
fixed CSS interval reads as a metronome. Both effects opt out under reduced motion.

**Verifying animations headlessly:** `--virtual-time-budget` races through short
animations before any screenshot lands, so a running glitch can never be captured.
Pin the keyframe values statically with `!important` and screenshot that instead.

## Design doctrine — governs every ambiguous decision

1. **Silence is the luxury.** 80%+ of any viewport is empty or field.
2. **Metadata as ornament.** The only decoration is real information — coordinates,
   indices, timestamps, version tags — set in IBM Plex Mono.
3. **One Pulse per surface.** `#6E56F8` appears exactly once per viewport. Hero = the
   wordmark seam. Mid-scroll = the readout rail fill. Section two = the primary CTA.
4. **The shear belongs to the logo only.** Never shear photos, headlines, or cards.

When the spec is silent, choose the quieter option.

5. **Another firm's brand is shown, never adopted — THE VITRINE.** Added
   2026-08-19, when `brand.html` and `lumina.html` both began printing
   Lumina's palette and Lumina's two typefaces.

   Every foreign colour and every foreign face lives inside `.vit`
   (`assets/css/case.css`): a bounded frame with a mono caption naming
   whose surface it is. Inside it, their system applies. Outside it, Zyrn
   is untouched — Obsidian, Vapor, Space Grotesk, IBM Plex Mono, hairlines,
   one Pulse. Lumina's faces are bound to `--font-lum-display` /
   `--font-lum-sans` so nothing can reach them by accident, and both fall
   back to a stock serif/sans so a blocked font request degrades to the
   right SHAPE rather than to Space Grotesk.

   This is the rule already stated in `footer.css` and mirrored in Lumina's
   own `zyrn-credit.css` — *another firm's mark is not recoloured to fit
   ours* — extended from a logo to a whole brand. It is also why a specimen
   of someone else's kit set in OUR typeface would be worthless: it would
   be a picture of the wrong thing.

   `brand.html` §03 and `lumina.html` §03 are the reference implementations.
   Do not "harmonise" a vitrine with the page around it.

## Tokens

| Token    | Value                    |
|----------|--------------------------|
| Obsidian | `#0E0F12`                |
| Vapor    | `#F2F3F5`                |
| Pulse    | `#6E56F8`                |
| Steel    | `#767E8C`                |
| Hairline | `rgba(242,243,245,0.08)` |

Type: Space Grotesk 400/500 (display + UI), IBM Plex Mono 400/500 (all metadata).
Mono labels are always `11px / uppercase / tracking 0.16em / Steel`.

## Hard rules

- No frosted glass. Panels are `rgba(14,15,18,0.6)` + `blur(2px)` + a 1px hairline.
- No gradients beyond the two Obsidian edge fades. No glows, no noise. — SUPERSEDED
  by Departure 3 for the field itself; still binding on every DOM element.
- Never type ZYRN as plain text in nav, hero, or footer — always the shear component.
- Never replace the two typefaces.
- No exclamation marks or superlatives in copy.
- No faces, no stock portraits.
- **Adding or removing a section on `index.html` re-anchors the field.**
  The `program` stops are measured section centres as scroll progress, so a
  new section moves everything below it. Done once already: the proof band
  went in between SYS.03 and SYS.04 on 2026-08-19 and every stop after
  SYS.02 changed. Re-measure at 1440x900 AND 390x844 and take the mean —
  do not nudge by eye. The comment above `program:` in `index.html` carries
  the current measurements.
- Do not remove the `.runway` spacers — they are the beat between scenes, where
  only the field is on screen. Do not inflate them either: at the spec's
  `80vh + 3x55vh` they were 1973px of a 6204px page, so a third of the site was
  blank scrolling and it read as a broken page. Now `30vh` / `18vh` (671px,
  13.7%). If you change them, re-measure the section centres and re-anchor the
  field program in `index.html` — the two are coupled.
- **SYS.00, THE ENTRANCE, IS NOT NEGOTIABLE.** Owner-locked 2026-08-18:
  "i want it and that should not be changed again at all." The mark assembles
  in the centre of the viewport — top half in from the RIGHT, bottom half in
  from the LEFT, the Pulse line then arriving from the right to slice it, then
  the glitch, then a FLIP into the hero lockup. `assets/js/intro.js` +
  `assets/css/intro.css` + the `#intro` block in `index.html`. Do not remove
  it, do not restyle it, do not "simplify" it, and do not move it to another
  page. If a change would touch it, stop and ask.
  Three things about it that read as breakage when nothing is broken:
    1. It is on `index.html` ONLY. It is the entrance to the site, not a
       per-page animation, and `field.js`'s continuity handoff deliberately
       suppresses it when you arrive from another page.
    2. It plays ONCE PER TAB SESSION (`zyrn:seen-intro`). A reload in the same
       tab will not replay it.
    3. `?intro=1` forces a replay — use that when reviewing. It overrides the
       repeat and handoff gates only; `prefers-reduced-motion` still wins.
  Gating is covered by `introtest.py` (plays / suppresses / replays). If you
  verify it by screenshot, sample at ~1s: it removes itself 240ms after it
  finishes, so a completed run and a suppressed one look identical later.
- The hero shear latches: once sheared it never un-shears.
- **Both marks are the same component.** The hero mark used to be scroll-bound
  (`.shear--hero`, inline transforms written by `main.js` every frame), so at
  scroll 0 it sat aligned while the nav mark was already sheared — the two read
  as two different logos. Both are now `.shear--auto` + `.is-sheared`, applied
  on one 300ms beat by `shearMarks()`. Owner-requested 2026-08-17. This
  supersedes `docs/build-spec.md`'s scroll-bound hero shear; the shear law
  itself is unchanged, and `.shear--hero` in `styles.css` is now unused.

## The glitch (rebuilt 2026-08-17)

Four layers, all applied to the WRAPPER or to clones — the shear halves
underneath are never touched, so the latch survives every burst:

1. **jolt** — the wrapper kicks and skews, harder than v1.0's single nudge
2. **chroma** — a Pulse/cyan text-shadow split, flickering through the burst
3. **slices** — two cloned ghosts, clipped into bands and thrown sideways,
   tinted `--pulse-mark` and `#33C9DE` (the two hues the field already emits)
4. **scan** — the v1.0 Pulse line plus a cyan one running the opposite way

`ui.js` clones the ghosts **at fire time**, not at init, so they snapshot the
mark's current shear state — the hero's halves carry inline transforms from
`main.js`, and a stale clone would glitch an un-sheared wordmark over a sheared
one. It strips `id`s off the clone (`#navMark`/`#heroMark` must not duplicate)
and positions each ghost with `src.offsetLeft/offsetTop`: an absolutely
positioned clone does not land where an inline-block original sits on the
baseline, and assuming `top:0` gives every slice a vertical offset the
keyframes never asked for.

Scheduling: quiet gaps of 1.8–5.2s, 62% chance of a double and 22% of a
triple, and 42% of fires are a 130ms `micro` (chroma + small kick, no slices)
rather than a full 300ms burst. Off-screen marks never fire.

**Verifying it headlessly:** `--virtual-time-budget` races through a 300ms
animation before any screenshot lands, and `main.js`'s endless rAF chain
starves `setTimeout` so a delayed probe never runs either. Use
`_probe_mark.html`-style isolation instead: no `main.js`, build the ghosts
synchronously, and freeze each copy with
`animation-play-state:paused; animation-delay:-Nms !important`.

## Page continuity (added 2026-08-18)

Navigation between field pages no longer looks like two documents. `field.js`
owns internal links now; `ui.js`'s obsidian veil is retired.

- **leaving** — the field morphs to whatever formation the DESTINATION opens on
  (`ROUTES` in `field.js`), only the CONTENT fades, and the canvas is never
  touched. 430ms, then navigate.
- **landing** — the incoming page reads a short-lived `sessionStorage` handoff
  and builds its particles **already settled** in that formation instead of
  assembling them from a shell, then fades its content in.
- Because the field is deterministic (same seed everywhere), the bed is in the
  same place on both sides and the navigation reads as one surface changing
  channels.
- The handoff has a 4s TTL on purpose: a stale one from a back button hours
  later must not suppress the cold-start assembly.
- `body.is-field-ready` is added once the bed is live. It is the only reliable
  thing to wait on when testing, because `boot()` is async.

**If you add a page with a field, add it to `ROUTES`.** A page that is not in
the map is left to the browser and navigates normally — correct behaviour, but
it will blink.

## The footer (added 2026-08-18)

`assets/css/footer.css` + `assets/js/footer.js`, on all seven pages. Three
things in it are worth not breaking:

- **The live Amman clock** is computed in `Asia/Amman`, not in the visitor's
  zone — it says something true about the firm rather than echoing the
  reader's own system clock back at them. Doctrine rule 2, literally.
- **`data-keepout` on `.sitefoot__in` is load-bearing.** Without it the
  column links fight the field behind them and the footer is unreadable.
- **The Lumina mark is a deliberate palette exception.** `assets/media/
  lumina-logo.png` links out to lumina-jo.com carrying Lumina's own
  treatment — the two drop-shadows and the hover lift are lifted verbatim
  from that site's `.mark-img` rule, amber glow included. It is the one
  place on this site where a foreign hue is printed, and that is correct:
  another firm's mark should not be recoloured to fit ours. Do not
  "harmonise" it.

## Scroll layer (added 2026-08-17)

- **Section index rail** (`.sysnav`, landing only) — the five SYS numerals down
  the left edge, the one owning the middle of the viewport lit. Numerals only:
  labels widened it into the content column, and the section names live on
  `aria-label`. It has its own lane — `.section`/`.footer` get `padding-left:92px`
  above 1180px. Hidden below that.
- **Kinetic headlines** — `data-kinetic` on an element makes `main.js` split it
  into per-word spans with a 55ms cascade. It walks child nodes rather than
  touching innerHTML, so `<br>` survives. The CSS keys off `.is-in` OR `.is-kin`,
  because the flat fallback and the reduced-motion path each set only one — key
  it off `.is-kin` alone and every kinetic headline stays invisible with `?nogl=1`.
- **Camera choreography** — the dolly is driven by `transit = sin(π · mix)`, which
  peaks mid-morph and is exactly zero on a settled formation, so the camera pulls
  back to take in a change and closes on the result.
- **Scroll velocity moves the ramp** — fast scrolling pulls the breakpoints down,
  so more of the field sits on the hot stops. The colour reacts, not just the shape.

## The phone menu (rebuilt 2026-08-18)

`assets/js/nav.js` + the `.navsheet` block in `field.css`. Below 900px the nav
link row is hidden, so this is the whole navigation.

**Nothing in it is authored twice.** Both levels are cloned out of markup the
page already has — the top level from `.nav__links`, the four lines from the
footer column headed "Lines". Those hrefs already carry the right relative
depth for whichever page they are on (`../services/…` inside `services/`), so
a clone inherits correct routing and there is no second copy to drift. If you
are tempted to hard-code the menu, this is why it is not.

- **Services is a disclosure.** The label navigates to `services.html`; the
  chevron beside it expands the four lines in place. Two separate 44px
  targets — a single row that either navigates or expands depending on where
  the thumb lands is a coin toss on touch.
- The submenu animates on `max-height`, not `grid-template-rows: 0fr→1fr`.
  Four rows is a knowable ceiling and max-height animates everywhere.
- Scoped selectors matter here: a bare `.navsheet__list a` also matches the
  four links inside the disclosure and sets them at 34px. Top-level rows are
  `.navsheet__list > a` and `.navsheet__row > a`.
- The sheet is `overflow-y:auto` with the list centred by `margin-top:auto`,
  NOT by `justify-content:center` — centring a flex child that overflows
  clips its top and it can never be scrolled back to.
- `main` gets `inert` while the sheet is open. `main`, not `.shell`: the
  toggle lives outside `main`, and making its own ancestor inert would leave
  no way to close the menu.
- **The sheet starts BELOW the bar, not at `inset:0`.** `top:var(--navh)`,
  measured in `nav.js` on open and on resize. When the sheet covered the
  full viewport the toggle — which has morphed into an X, and is a phone's
  only close control — was painted underneath it and could not be tapped:
  the menu opened and then trapped you until you picked a link.
  Raising the nav with `z-index` CANNOT work and was tried first. `.shell`
  is `position:relative;z-index:10`, so it is a stacking context, and
  `.nav` inside it can never paint above a sheet that is a child of `body`
  at 55. Moving the sheet into `.shell` instead would put a `position:fixed`
  element under an ancestor that takes a transform during page transitions,
  which silently re-anchors it. Not covering the bar is the fix with no
  trap in it. `body.is-navopen .nav` also takes the sheet's own 94%
  obsidian so the two read as one surface.
- Opening now forces a reflow (`void sheet.offsetHeight`) before adding
  `is-on`. The sheet is genuinely `display:none` when closed, and going
  none→flex and adding the class in one task leaves the opacity transition
  no start state to move from.

## Typography — widows are a defect, and they are measurable

A last line holding one word reads as broken rather than as typesetting:
"PHONE" alone under a label, "it." alone under a quoted brief, "was."
alone under a display line. Reported from a phone, and a sweep of one
page across eight viewports found **74 of them** — so it was never a
property of those blocks. It is a property of every measure on the site
that happens to be narrow, and it cannot be authored away one string at
a time, because copy that sits perfectly at 1440 orphans at 393 and the
widths in between are continuous.

Two layers, both site-wide:

- `text-wrap: pretty` on body copy and `balance` on headings, quotations
  and mono metadata (`styles.css`). Right tool, honoured by the engine
  where it is supported.
- `setupWidows()` in `main.js` binds the last two words of every text
  block with a non-breaking space. This is the guarantee: one U+00A0 is
  deterministic in every browser. It touches only the LAST text node, so
  markup inside a sentence survives; it skips `<code>`, `<pre>` and
  `[data-kinetic]`; and it skips any pair long enough to overflow a
  320px column, because a widow is a blemish and a horizontal scrollbar
  is a defect.

`orphan2.py` + `orphan.js` measure it. Line boxes are read EXACTLY, by
wrapping every word in a span and grouping by top edge — Range rects
were the first attempt and they lied, because pseudo-element content and
inline children split one line into several rects. **Split on whitespace
EXCEPT U+00A0**: JavaScript's `\s` matches the non-breaking space, so a
naive `/\s+/` tears apart the very binding under test and every run
reports the unbound layout. Result now: 74 → 16, and every survivor is a
two- or three-word last line, which is an ordinary ragged edge. Zero
single-word widows on any page.

Numbers and their units are not sentences: `.proof__nums > span` takes
`white-space:nowrap` so "00 build steps" cannot break after "build".

## A backtick inside a shader comment ends the JavaScript string

The GLSL in `field.js` lives in template literals. A backtick anywhere inside
one — including inside a `//` comment written for a human — CLOSES the string,
and everything after it is parsed as JavaScript until the next backtick
reopens it. The file's backtick count stays EVEN, so it looks balanced; what
you get is a runtime `SyntaxError` naming some innocent identifier in the
middle of the shader, and `node --check` does not catch it.

Cost one cycle on 2026-08-30, from a comment reading ``the old line was `col
+= ...` `` inside POINTS_VS. Quote shader identifiers with plain words or
single quotes in those comments. Never a backtick.

## The field answers presence, scroll, AND acts — v2.1, 2026-08-30

Three behaviours were added and one was corrected. Full account in
`docs/spec-presence-field.md` §6b; the parts that constrain future work:

- **`P.w` is HEAT, not a twinkle phase.** Twinkle is stateless now (clock +
  seed). If you need another per-particle channel, this one is taken — the
  simulation has no other spare component and adding a third GPGPU variable
  costs a texture and a pass.
- **Only the POSITION pass can write `P.w`**, so the pointer and shock
  uniforms are shared INTO it from the velocity pass by reference. They are
  the same uniform objects, not copies. Do not duplicate them; two sources of
  truth for the pointer ray is a bug waiting for a frame where they disagree.
- **The shock is deliberately small.** It was tuned DOWN from a build that
  worked and looked wrong — a viewport-filling white ring over the hero. If
  you make it bigger, re-read doctrine rule 1 first.
- **`uSpeedTint` is a RAMP OFFSET now, not an additive tint.** The old 0.09
  and the new 0.26 are not comparable numbers; one was added to every channel,
  the other is a distance along a 0..1 palette.
- Everything above was measured: 90,000 points, 2.71ms median, p95 3.99,
  governor rung 0, unchanged across all nine pages that carry a field.
  `docs/gpuprobe.py` and `docs/play.py` are how — the second drives real
  pointer input over CDP and photographs the wake and the shell, because none
  of this exists in a static screenshot.

## Five service pages, five instruments, one scale — 2026-09-01

All five signature instruments were rebuilt onto one shell at one size,
and a fifth service page was added. The parts that constrain future work:

- **`--righ` is the size of every instrument on the site**, and every
  geometry inside one is a ratio of it. Full account in
  `.claude/rules/instruments.md`, which loads whenever a module or
  `svc-modules.css` is touched. Do not add a pixel constant to an
  instrument; add a ratio.
- **`perspective` is a ratio too.** It was `1500px` flat and it was tuned
  against a stack a third smaller than the current one. A camera that does
  not step back when the subject grows overflows the stage, silently,
  because a pinned stage cannot be scrolled to reveal what it clipped.
- **`docs/rigfit.py` is the check**, and it replaces `stkfit.py` (which
  only knew about the stack). Nine window sizes, eight progress values,
  projected unions against the head, the note, the rail and the window
  edges. Run it after any geometry change. `docs/rigshot.py` takes the
  pictures.
- **`services/crm.html` is the fifth CHANNEL, not the fifth LINE**, and
  the distinction is load-bearing rather than pedantic. "Four lines, one
  system" is geometry on this site: the core instrument draws four arcs on
  the diagonals and the matrix authors sixteen named readings for the
  subsets of four. Making the CRM line 05 would mean re-cutting that ring
  into five 72-degree arcs — putting a 168px label straight down the
  bottom of a PINNED stage — and inventing sixteen more coverage claims
  nobody has made. So the tab strip, the footer, the palette, the sitemap
  and both index pages carry five; the core, the matrix and every "four
  lines" sentence are untouched and still true. See `docs/decisions.md`.
- **The tab strip is five wide above 1023px and its marker is `100% / 5`
  stepped by whole multiples of itself** — those two numbers move
  together. Below 1023px the strip WRAPS, where a marker positioned by
  translateX cannot be right for any cell, so it becomes an edge on the
  active cell instead. That needed `position:relative` on `.tab` scoped to
  that media query ONLY; adding it globally parks every desktop marker at
  x = 0.
- Everything the CRM page prints about the product was counted out of the
  repository or read out of its sync code. The four guarantees on the
  prism's fourth face are the four that `website-sync.ts` actually
  enforces, not four written for the page.

## An entrance is not a scroll animation — 2026-09-01

`.rk` and `.wp` — the case windows on `lumina.html` and `thehub.html` —
faded in from `opacity: calc(0.2 + 0.8 * var(--in))` with `--in` driven by
TRACK PROGRESS, over `ramp(p, 0.00, 0.10)`. On a 1200vh track that is
**110vh of scrolling** at partial opacity with a 90,000-particle field
pouring through the window; before it, while the section is still arriving,
`_track.js` clamps `p` to the pinned stretch so the value is a CONSTANT
0.2 for another whole viewport. Two screens of murk in front of the one
thing those pages exist to show, on a site whose argument is that it builds
immersive scroll work.

It could not be retimed, because nothing can animate during the approach.
So: `revealOnce()` in `_track.js`, an IntersectionObserver that flips
`--in` to 1 the first time the element is on screen, with the easing in
CSS. Under a second, once, never dimmed again.

**The rule: if a thing should be visible while the reader is looking at
it, do not spend scroll on making it visible.** Scroll progress drives
what the instrument DOES; entrances belong to the reveal system.

The same change removed the tail fade (`- 0.55 * ramp(p, 0.94, 1.00)`),
which dropped the window to 45% for the closing frames of the
demonstration.

## The nav bar — centred by grid, and lit by the field

- **`justify-content:space-between` does not centre the middle child.** It
  centres it in the space the OUTER two leave, and on this bar those are
  the mark (~90px) and the end group (~430px) — so the link row sat
  **260px left of the viewport centre** at 1440. `.nav__row` is
  `grid-template-columns:1fr auto 1fr` now, which puts it on the real
  centre line at every width. `docs/navprobe.py` measures it.
- **The link row and the phone toggle must swap at the SAME width.** The
  toggle appeared at 899px and the row hid at 767, so between them the bar
  carried both and the links overflowed the end group by 648px. Both are
  899 now. If you move one, move the other.
- **The active tab is marked by a light travelling around it, and the
  light is the field's own.** `field.js` samples ITS OWN RAMP — the same
  array the shader reads — at the page's current scroll position and
  publishes three consecutive stops as `--fld-1/2/3` on `:root`, every
  twentieth frame. The nav paints a conic arc in those colours. Scroll and
  the light drifts green-teal → cyan → Pulse → Vapor, because that is the
  journey the particles are making behind it.

  **OWNER-REQUESTED DEPARTURE, and it is the third one.** The hard rules
  forbid gradients on DOM elements and glows; this is one conic arc and
  one 22px glow, on ONE element at a time. Asked for directly: *"a light
  from the particles behind that goes around the chosen tab"*. Held to the
  live tab only — never two at the same strength.
- **A page the nav has no link to still has an OWNER on the bar.** There is
  no "Lumina" tab and no "CRM" tab, but every page is reached THROUGH a
  tab, and `setupNavHere()` in `main.js` maps the leaf name to the entry a
  reader would have used. Without it the light goes out on eight of the
  twelve pages, which reads as the bar having broken.
- `@property --beam` is what lets a conic angle animate at all. Without it
  the arc sits still — degraded, not broken.

## `exercise.py` was blind to the wipe

Its selector was `.sig__track,.rk__track,.rb__track,.in__track`, so
`.wp__track` — one of the two instruments on `thehub.html` — had never once
been stepped 0→1 by the thing whose whole job is stepping instruments
0→1. Fixed 2026-09-01, and the tool now lives in `docs/` rather than only
in a job tmp dir. **If you add an instrument with a new track class, add
it to that selector in the same commit.**

## A stylesheet that does not arrive looks like a broken design

2026-09-01. The owner opened `services/website-design.html` and saw the
stack with no styling at all — six layers in normal flow, the key rail
numbered `1. 2. 3.`, unclipped panels sprawling across an ultrawide
window. It read as a catastrophic layout bug.

The page was fine. The same bytes rendered correctly in a clean browser at
1440x900 AND at 2560x1240, the server was returning the current file, and
`svc-modules.css` parsed with 195 rules and balanced braces. The browser
simply did not have it.

**That failure mode is invisible as a network problem and total as a
visual one**, because every `.sig`, `.rig` and `.stk` rule lives in that
one file while `.tabs` and the readout live in `styles.css` — so the
chrome looks perfect and the instrument looks destroyed.

`Cache-Control: no-store` from `docs/serve.py` protects the NEXT request
and does nothing for a tab that already parsed an old copy — and nothing
at all on GitHub Pages, which applies its own cache lifetime, so the live
site carries the same exposure on every push.

**`docs/stamp.py` is the fix.** Every local `href`/`src` on a `.css` or
`.js` carries `?v=<8 chars of that file's own content hash>`. Identical
bytes keep the same URL and stay cached; one edited byte is a new URL that
cannot be served from anywhere stale. 147 links across 13 pages.

    python docs/stamp.py           # rewrite
    python docs/stamp.py --check   # exit 1 if anything is out of date

**RUN IT AFTER TOUCHING ANY CSS OR JS AND BEFORE COMMITTING.** A stale
stamp is worse than none, because it looks deliberate.

Diagnosing this class of thing: dump `document.styleSheets` with each
sheet's `cssRules.length`. A sheet that failed shows `-1` or is absent
entirely, and one that parsed shows its real rule count — which
distinguishes "did not arrive" from "arrived and is wrong" in one read.

## Every pinned track has an exit — 2026-09-01

Nine tracks across six pages hold a reader for six to twelve viewport
heights. That is the point of them, for a reader who wants it. Someone who
came for the pricing and met a 1200vh rack had no way out but to keep
wheeling, and **a scroll section you cannot leave is a toll booth rather
than an experience.**

`modules/skip.js` injects one control into every pinned stage —
`.sig__track, .rk__track, .wp__track, .rb__track, .in__track` — visible
only while its track is on screen, and it puts you past it. **If you add
an instrument with a new track class, add it to that selector**; a control
that exists on eight pages and silently does nothing on the ninth is the
exact class of bug this site has been bitten by before, which is also why
it is injected once rather than authored nine times.

It routes through `window.__zyrnScrollTo`, published by `field.js`, which
is now **the only sanctioned way anything moves the page**. `scroll-behavior`
is `auto` here on purpose, so a bare `window.scrollTo` would jump instantly
on a site whose whole argument is the quality of its scrolling.

`docs/skiptest.py` verifies it with REAL mouse events at the button's own
centre plus a hit test — `el.click()` would happily pass on a button buried
under an overlay, which is how the ghost sheet survived a day.

## The room: pointer and scroll velocity, measured once

`_track.js` now measures two signals per frame for the whole page, because
both are properties of the READER rather than of any instrument:

- **`px, py`** — the pointer, -1..1 from the viewport centre, eased
- **`vel`** — page speed, smoothed and clamped

`onNear(track, cb)` fires EVERY frame while a track is near — as opposed
to `onTrack`, which only fires when progress changes. The lean has to keep
easing while the reader holds still, which is precisely when a
progress-only callback stops being called.

Every 3D scene adds `--px / --py / --lean` as the LAST terms of its
transform, so they modify a composition that is already correct rather
than being part of how it is built. **Two and a half degrees is the whole
budget.** Inert under reduced motion, and inert on a coarse pointer, where
reading the last touch point would leave a scene stuck wherever a finger
landed.

**`PARALLAX=1 python docs/rigfit.py …` is how the fit is checked**, and it
matters: headless never moves a pointer, so a plain run measures the scene
at rest and says nothing about the state a reader puts it in. Pinned to a
corner at every viewport: ALL CLEAR.

## The beam, v2 — and where it may not go

Brighter on the owner's note: the lit sweep runs 170 degrees rather than
124, it carries a **Vapor core** at its head so there is a specular hot
point instead of an even wash, and `filter: drop-shadow` blooms it. That
filter works on the alpha RESULT of the mask, so the glow comes off the
visible arc rather than off the box — which is the whole difference
between light and a coloured border.

Worn by `.nav__link`, `.btn--hairline`, `.cmdkbtn`, `.rk__out` and
`.skip`. **`.tab` and `.visit` are deliberately excluded**: the tab already
has its Pulse marker and lives inside an `overflow:hidden` housing that
clips the bloom into a hard edge, and `.visit` has its own travelling
hairline. Never two arcs at full strength on one screen — the live tab is
the page's statement of where you are, everything else answers the pointer
at a third.

## Kill stale headless Chrome before you believe a probe

Every tool here launches Chrome on a FIXED `--remote-debugging-port` and
attaches to whatever answers. Runs that crash or are interrupted leave
the process alive holding that port — and the next run silently attaches
to the OLD browser, showing a page loaded before the change under test.

This cost hours. Forty-one orphaned Chromes had accumulated, and a fix
that was demonstrably present in the DOM measured as having no effect,
repeatedly and consistently, across four rewrites of the probe. The
readings were not noisy, they were confidently wrong, which is worse.

    Get-Process chrome | Where-Object { $_.MainWindowTitle -eq '' } |
      Stop-Process -Force

Run that before any measurement session. If a probe reports that a
change you can see in a screenshot had no effect, this is the first
thing to check, not the fourth.

## "The page loaded clean" is not "the page works"

`check.py` navigates and listens. Every signature instrument on this site is
scroll-driven, and `_track.js` seeds each client with `cb(0)` — so a bug that
only fires at p>0 never runs during that check.

It cost a real crash. `rebase.js` declared `const stage` for the stage
ELEMENT at the top of `initRebase`, and then `const stage = p < CUTS[0] ? 0
: ...` for the stage INDEX inside `draw()`. The inner one shadows the outer
for the whole function body, so the tail of `draw()` called
`.style.setProperty` on a number and threw on every frame the instrument was
on screen. The page reported clean because at p=0 that index is 0, which is
falsy, so the guarded block was skipped — and it looked fine until someone
scrolled to it.

**`exercise.py` is the fix**: it finds every track on a page, steps each one
0 → 1 with the negative-margin trick, and collects exceptions the whole way.
Run it alongside `check.py` after touching any instrument.

Related, and also measurable: **dead scroll**. `motion.py` steps a track
through 21 progress values, records the instrument's visible state at each,
and reports how many steps produced a change plus the longest run that
produced none. That longest run IS what a reader experiences as "nothing is
happening". The re-base scored 9 dead steps of 20 before its retiming and 1
after; the rack scores 0.

## Verifying mobile — the checks that would have caught the ghost sheet

A screenshot proves layout and nothing else. Three checks, all cheap, all
now standing:

1. **Hit test the viewport.** Sample a grid with `document.elementFromPoint`
   and count how many points reach the page rather than an overlay. The
   ghost sheet scored 100% swallowed on every page and looked perfect in
   every screenshot.
2. **Tap with real touch events.** `Input.dispatchTouchEvent`, not
   `el.click()` — `el.click()` dispatches straight at the node and skips
   hit testing, so it "proves" that a completely buried control works.
   This is how the open menu's unreachable close button was missed.
3. **Measure tap targets.** 44px minimum. The footer's Lumina mark was a
   21px-tall target even after it became reachable; it now takes coarse-
   pointer-only padding with an equal negative margin, so the hit box is
   45px while the laid-out box is unchanged.

Also worth re-running after any layout change: `document.scrollWidth` vs
`innerWidth` for horizontal overflow, and the children-union measurement
for pinned stages described above.

## The index — ⌘K (added 2026-08-18)

`assets/js/cmdk.js` + `cmdk.css`, on all eleven pages. Fifteen destinations:
the pages, the four landing scenes, and the mailto.

- **Every result is a real `<a>` in the document.** `field.js` owns internal
  links — it morphs the bed to the destination's opening formation before
  navigating — and it listens on `document`. Enter calls `row.click()` so the
  event bubbles into that handler. Assigning `location.href` would make the
  palette the one place on the site where navigation blinks.
- Opens on ⌘K / Ctrl-K, on bare `/`, from the `⌘K` chip in `.nav__end`, and
  from the first row of the phone menu sheet (`[data-cmdk]`, injected by
  `nav.js` — the two files talk through the DOM, not through an import).
- Scoring is prefix > substring > keyword bag > subsequence. Twelve items do
  not justify a fuzzy-match dependency.

## Two ordering bugs fixed 2026-08-18 — do not reintroduce

1. **The import map must precede every `<link rel="modulepreload">`.** A
   modulepreload IS a module load: Chrome resolves the preloaded module's own
   imports at preload time. With the map below the preloads,
   `GPUComputationRenderer`'s bare `import ... from 'three'` had nothing to
   resolve against and all eight pages logged
   `Failed to resolve module specifier "three"`. The field still ran (the
   real import later found the map) so nothing looked broken — the preload
   was simply wasted. If you add a page, put the map first.
2. **`[hidden]` loses to any class that sets `display`.** Closed globally
   on 2026-08-19 with `[hidden]{display:none!important}` in `styles.css`,
   after the same bug shipped twice.

   First instance: `.mx__go` is `display:inline-flex`, so `el.hidden = true`
   did nothing and the matrix's single-line shortcut stayed on screen for
   every selection. That was fixed per-element — which fixed the instance
   and not the class of bug.

   Second instance, and much worse: `.navsheet` is `display:flex` and
   `position:fixed;inset:0;z-index:55`. The CLOSED phone menu was therefore
   a full-viewport invisible overlay on every page, and it swallowed
   **100% of taps below 900px** — measured, not estimated. Nothing on a
   phone was clickable. It still SCROLLED (the sheet's own content is
   shorter than the viewport, so touch scrolling chained to the page),
   which is exactly why it was reported as "the Lumina logo doesn't open"
   rather than "the mobile site is dead".

   Two things let it survive this long, and both are now part of the test
   routine below: screenshots cannot see it, and `el.click()` bypasses hit
   testing entirely. Only `document.elementFromPoint` and real
   `Input.dispatchTouchEvent` taps find it.

**Every CTA on the landing page was dead** until 2026-08-18. All four
"Request access" controls on `index.html` — nav, hero access card, SYS.02, and
the removed "Read the system doc" — were ported from the Claude Design source
as `<button type="button">` with no `href` and no handler, so the entire
conversion path on the home page did nothing. They are `<a href="#sys-05">`
now, matching the seven instances on the other pages; SYS.05 itself keeps the
mailto. **`index.html` should contain no `<button>` at all** — if one appears,
it is almost certainly a control that does nothing.
"Read the system doc" was removed outright at the owner's direction
(2026-08-18) — there is no system doc, so the button could not be wired.

~~Still open: the three `.cap__row` links in SYS.02~~ **RESOLVED
2026-08-21** — the destination was never decided because there is nothing
to decide: they are phases, not products. The affordance was removed
rather than a destination invented. See the note further down.

Also fixed the same day, both shipped-and-live: the Lumina mark in the footer
of all four `services/*.html` pointed at `assets/media/lumina-logo.png`, which
resolves to `/services/assets/...` and 404'd; and `.sig__stage` had no
horizontal gutter, so every instrument's step readout and note sat flush
against the viewport edge.

## Class-name collisions — check before you name a block

`.spec` was already taken TWICE (`styles.css`, a definition row with
`align-items:baseline`; and `svc-modules.css`, the brand-kit page's
specimen instrument) when the Lumina specimen on `lumina.html` was named
`.spec` as well. `case.css` loads last so it won `display`, but
`align-items:baseline` leaked through from `styles.css` and collapsed an
empty `<span>` — the cyan plinth bar — to **zero width**. It painted
nothing, with a correct background, height, opacity and display.

The Lumina specimen is `.lspec*` now. Before naming a new block, grep the
existing sheets for the stem. All of `styles.css`, `service.css`,
`svc-modules.css`, `field.css` and `footer.css` are loaded together on
most pages, and a partial override is far harder to see than a total one.

## The share card

`assets/media/og.jpg`, 1200×630, built by `docs/og-card-source.html`
(a standalone page rendered headless at 2× and downsampled to 1200×630). It is NOT a screenshot of the
site — the old one was, and a whole landing page reduced to preview size is an
unreadable smudge.

- It renders the **same** torus the site does: `buildTargets`'s S3 branch and
  the vivid ramp are ported verbatim, including the S1/S2/S4 draws that are
  discarded, so the RNG stream lands on the numbers the site gets.
- The lockup is nudged down so the mark's Pulse seam sits on the torus's
  horizontal axis. The cut in the wordmark and the equator of the core are
  the same line.
- Text keeps its contrast the way the shader does it: one keep-out rect per
  LINE, alpha pulled to 0.20 inside them. One rect big enough for the whole
  lockup also covered the bottom third of the ring.
- The whole lockup sits inside the centred 630×630 square, because some
  clients crop a link preview to a square thumbnail.
- **`og:image` carries `?v=2`.** Scrapers cache by image URL; WhatsApp and
  LinkedIn will both keep serving the old bytes without it. Bump it again if
  the card is ever recomposed. WhatsApp also caches the whole preview per
  page URL — sharing `zyrn.org/?v=2` once forces a fresh scrape.

