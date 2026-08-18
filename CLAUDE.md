# ZYRN

Brand site for Zyrn — an org-engineering firm (human capital, business structuring,
AI transformation, web & strategy). Amman, JO. Positioning: *Organizations, engineered.*

The full authored brief lives in `docs/build-spec.md`. **Read it before any visual
change.** This file is the short operative version.

## Layout

```
index.html              live landing page — plain HTML/CSS/JS, no build step
                        five scenes: SYS.01 hero · SYS.02 capability · SYS.03 service
                        lines · SYS.04 readiness index · SYS.05 access. Capped at five
                        deliberately — see docs/strategy.md §4. It OPENS on the
                        torus (S3 CORE) because the hero lede is "Zyrn builds the
                        operating core" — then S3 → S1 (the core opens into four
                        arms, one per line, as SYS.03 arrives) → S3 (SYS.04's
                        ladder climbs from emergent back to engineered) → S4.
                        Also carries the section index rail and the stats strip.
assets/js/field.js      SYS.07 — THE BED, on every page. A 90k-point GPGPU particle
                        simulation; there is no asset behind it. One shared engine,
                        per-page `program` (which formations, at which scroll
                        positions) and `channel` (tilt + spin), so moving between
                        pages reads as one instrument changing channels.
                        Spec: docs/spec-presence-field.md.
                        Capture flags — headless verification only works with these,
                        because a real-time sim is still mid-flight when a headless
                        screenshot lands: ?freeze=S1|S2|S3|S4 · ?p=0.28 · ?probe=1 ·
                        ?nogl=1 · ?particles=N · ?coarse=1 · ?debug
assets/css/field.css    the page layer for the field: mounts the canvas, enforces
                        Departure 4 site-wide, adds the stats strip and flat fallback.
foundation.html         SYS.00 — what the firm is, the mission, who it is for, and
                        the founder. Its motion is deliberately quieter than the
                        service instruments: the mark's own language (a shear on
                        the founder's name, one Pulse slice across the credential
                        row) and nothing that pins the scroll.
                        The founder is Yazan Tarawneh, set in the shear
                        component — both .shear__half spans must carry identical
                        text or the clip-and-offset breaks. Carries JSON-LD
                        Organization + founder.
services.html           SYS.03 — the index for the four lines, and the nav slot
                        `Brand` used to hold. It has to belong to both
                        neighbours: the landing page's scene rhythm above it,
                        the service pages' hero/tabs/footer below it. Carries
                        its own signature instrument (THE CORE), the four
                        lines as full rows, and the combination matrix.
                        Field program S3 → S1 → S1 → S3: one system, opened
                        into four, recombined. It lives at the ROOT, not at
                        services/index.html, because `routeFor()` keys on the
                        last path segment and a directory URL yields '' —
                        which is already the landing page's key.
brand.html              SYS.06 — HOW WE PRESENT A BRAND KIT. Rewritten 2026-08-19
                        at the owner's direction: it used to document Zyrn's
                        OWN brand, which is inward-facing and makes no argument
                        to a buyer. It now covers the deliverable generally —
                        four properties, seven parts, the handover — with a
                        worked example that is deliberately NOT Zyrn: Lumina's
                        palette, type, mark, motion and layout, in vitrines.
                        Still a document rather than an experience (legibility,
                        not atmosphere), and still reachable from the footer's
                        "The firm" column, labelled "Brand kit — the method" so
                        it cannot be confused with the SERVICE line of the same
                        name two columns over.
                        The previous page survives in two places, and NOT in
                        the repo working tree: `_archive/` is gitignored, so
                        the local copy at
                        _archive/brand-zyrn-doctrine-v2.html exists on this
                        machine only. In a fresh clone, recover it with
                        `git show 59ace3c:brand.html`. Either way nothing was
                        lost — Zyrn's own doctrine is operative in THIS file,
                        which is where it was always enforced from.
duk.html                SYS.08 — DUK, our own open-source agent, IN
                        DEVELOPMENT. It is NOT released, and the page is
                        written to hold that line: status chip in the hero,
                        a §06 that says plainly there is no public build, no
                        launch date, no waiting-list counter. Ambition about
                        DESIGN INTENT is fine and deliberate; claims about
                        adoption, benchmarks or dates are not, and none are
                        made. **The one soft number is the five-pip progress
                        bar in §06, set to 2/5 — the owner should confirm or
                        change it.**
                        Identity: named for the rubber duck (explain the
                        problem out loud and you find it yourself), and the
                        whole product thesis is "it asks before it answers".
                        The mark is a listening aperture, three arcs turning
                        at different rates — deliberately NOT a picture of a
                        duck. No new hue: Duk is ours, so it takes Obsidian,
                        Vapor and mono like everything else, and gets its
                        energy from motion. Its instrument is THE
                        INTERROGATION (see below).
lumina.html             SYS.07 — CASE 01. The site's first and only piece of
                        proof. Lumina (private real-estate advisory, Amman) is
                        a Zyrn client; this is their brand kit and website, and
                        the fact that the whole palette was later replaced
                        without a component being rebuilt. Root level, not
                        work/lumina.html — `routeFor()` keys on the last path
                        segment. Two instruments, see below.
services/*.html         four service pages, one per line, in this order:
                        01 website-design · 02 brand-kit · 03 business-structuring
                        · 04 ai-transformation ("AI adoption & transformation").
                        Generated from ONE template — keep them in sync; edit all
                        four or none. Each carries the same field + grid, plus its
                        own SIGNATURE INSTRUMENT (see below).
                        Human capital and Web & strategy were retired 2026-08-18
                        at the owner's direction; both are in
                        _archive/retired-services/ and can be restored as a fifth
                        and sixth line without rework.
assets/js/modules/      the signature instruments, one per service page:
                        _track.js    shared rAF scroll-progress plumbing
                        build.js     01 — a surface assembling itself, five stages
                        specimen.js  02 — the brand kit, operable
                        graph.js     03 — decision rights, rewired on scroll
                        readiness.js 04 — the index climbing 00 to 04
                    core.js      services.html — the set's own instrument
                    matrix.js    services.html — the combination matrix
                    rack.js      lumina.html — two device frames with the real
                                 Lumina site scrolling inside them, at
                                 different rates
                    rebase.js    lumina.html — nine real tokens moving between
                                 two real palettes, interpolated in OKLab
                    interrogate.js
                                 duk.html — twenty-two candidate causes cut
                                 down to one constraint by four questions
assets/css/svc-modules.css
                        styling for all four instruments.
assets/css/styles.css   all styling, tokens at :root (incl. the glass + glitch systems)
assets/css/brand.css    brand-page-only document layout
assets/css/service.css  service-page layer (hero, module cards, phases, signals)
assets/css/services.css services.html only — the core diagram, the line rows
                        and their four glyphs, the matrix
assets/css/case.css     lumina.html — the case layout, both instruments, and
                        THE VITRINE (see doctrine below)
assets/css/proof.css    index.html only — the "In production" band. Split
                        out of case.css so the landing page does not pull two
                        pinned instruments and Lumina's two typefaces to
                        style two cards
assets/css/duk.css      Duk's mark and page. Loaded on duk.html AND on
                        index.html, because the band carries the live mark
                        and nothing else should own that component
assets/js/cmdk.js       THE INDEX (⌘K) — on every page. See below.
assets/css/cmdk.css     its housing
assets/js/ui.js         shared on every page: irregular glitch scheduling + page
                        transition veil
assets/js/main.js       DOM runtime (hero shear · readout rail · reveals)
                        — dt-based smoothing (k=5/s ≡ spec's 0.08@60Hz). The video
                        scrub, frame cache and decoder handling that used to live
                        here are GONE with the bed; this file no longer touches a
                        canvas or a video element.
                        NEVER pass desynchronized:true to getContext anywhere in
                        this project — it hard-froze the renderer on this machine.
assets/media/           icons, the share card, the Lumina mark.
assets/media/work/      the case-study captures — five stitched strips of the
                        LIVE www.lumina-jo.com (hero, room, invest, listings,
                        services) plus a mobile strip and the landing-page
                        card. Taken at 2x/3x and finished with a light
                        contrast/saturation/unsharp pass so they survive
                        being scaled into a device frame; the first pass was
                        noticeably soft. ~1MB total, all lazy but the first.
                        Rebuild with the capture scripts, not by hand — the
                        instrument strips depend on the measured pinned-track
                        ranges, and the flat ones on hiding fixed elements so
                        the nav does not repeat once per band.
design/                 source of record from Claude Design (.dc.html) — reference only, never served
docs/build-spec.md      the authored brief (v1.0 — written for the video bed)
docs/spec-presence-field.md
                        the field's spec: formations, physics, the three departures,
                        performance budget, acceptance list
docs/strategy.md        positioning research, where each finding landed, and the
                        sourced third-party stats awaiting sign-off before going public
```

**Steel is a panel colour.** `#767E8C` disappears against the open field — mono
metadata sitting directly on it takes Vapor at 0.6–0.9 alpha plus the veil shadow
instead. Steel is correct inside panels, where the obsidian veil backs it. This
still bites: `.lockup__live` and `.stats__l` are Vapor for exactly this reason.

**Do not nest a `[data-reveal]` inside another one.** The parent's reveal
clip-path is `inset(0 0 18% 0)`, which hides the bottom band of its own box — a
nested observer target sitting in that band never registers as visible and never
reveals. Let children inherit the parent's reveal instead.

`design/*.dc.html` is Claude Design's own format (`<x-dc>`, `DCLogic`) and does not
run standalone. `index.html` is the faithful vanilla port and is the thing we build on.

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

## Signature instruments (added 2026-08-18)

One per service line, all on the same shape: a 340vh track, a stage pinned with
`position:sticky`, a mono step readout, and a note that swaps per stage.
`_track.js` gives each one a 0..1 progress on rAF — not on a scroll event,
because Lenis drives scrolling on rAF and a scroll listener would lag the field
by a frame or two. One shared loop serves the page and parks when nothing is on
screen.

- **build** — five stages, driven by a single `[data-stage]` attribute on the
  frame. CSS does the rest, so a stage change is one attribute write.
- **specimen** — three cross-faded panels. The chips report the real hex and the
  real rule, and the mark runs the actual shear component, not a picture of one.
- **graph** — two authored layouts lerped by scroll. Deliberately NOT a force
  simulation: a layout that settles differently every load is the wrong thing
  for an argument you want to make twice.
- **readiness** — five dimensions at authored rates, so the constraint is
  obvious on sight. They converge over the last 40% because that is what the
  engagement does. Without the convergence the index caps at the constraint's
  rate and never reaches the Level 04 the copy promises.

Two more on `lumina.html`, same shape:

- **rack** — a TOUR OF FIVE PAGES of the live Lumina site in one window.
  Scroll and the window scrolls the page it is showing; keep going and it
  hands over to the next. Rebuilt 2026-08-19: v1 was one page in a small
  frame, and the owner's note was that it was too small and showed too
  little to make anyone want to go and look.
  Two of the five are Lumina's own scroll instruments — `/room` furnishes
  an empty wireframe room as you scroll, `/invest` puts a building up floor
  by floor. Their frames were captured at even progress across each pinned
  track (`.room-pin` 4140px, `.build-pin` 3420px), so the window REPLAYS
  their animation rather than describing it. That is why those two strips
  stack whole bands and the flat pages stack cropped ones.
  **The window is sized by HEIGHT, not width** (`--winh`, then width from
  the 16:10 ratio). A pinned stage cannot scroll, and a 16:10 box given the
  full column width is ~840px tall on a 1440x900 screen and simply hangs
  off the viewport. Height first is the only way it can be big.
  **Lumina's instruments are desktop-only** — probing `/room` and `/invest`
  at 390x844 returns no sticky element at all. So the desktop window leads
  on phones too, bled to the screen edges, with the phone frame demoted to
  an overlapping inset. An earlier pass had that backwards.
- **rebase** — nine real tokens moving between two real Lumina palettes.
  **Retimed 2026-08-19 because the pacing was wrong and the owner felt it:**
  "scrolling but barely anything changing, and then it just goes to the one
  below". v1 ran the sweep from 0.22 to 0.76 of a 400vh track, so 46% of it
  — about 1800px of scrolling — was motionless. It is a 320vh track now,
  the sweep occupies 0.05 to 0.86, and the two remaining ends do something:
  the head brings both panels in, the tail locks the result with a dated
  stamp. A scan line rides the wave down the column, and each chip lights
  and scales on `t*(1-t)`, which peaks at the midpoint of that token's
  travel and is zero at both ends — so a chip is lit exactly while it is
  changing, with no keyframes and no timers.
  **Interpolated in OKLab, and that is not decoration**: the headline move is
  `#D6BF9E → #FFB25A`, a hue rotation as well as a saturation jump, and a
  channel-wise sRGB lerp routes the midpoint through a dead khaki that was in
  neither palette and reads as a bug. Every hex printed on screen comes from
  the same interpolation that paints the swatch, so the readout cannot drift
  from the colour.

One on `duk.html`:

- **interrogate** — twenty-two candidate causes for a stated problem, cut to
  one by four questions. Authored, not simulated, for the same reason as
  `graph.js`: a demo that lands somewhere different every load cannot make
  an argument twice. It is also honest about what it is — this is what Duk
  is DESIGNED to do, demonstrated, not a recording of a shipped product.
  **Label collisions are solved by a relaxation pass, not by tuning the
  seed.** Twenty-two labels 90–140px wide sit ~16 degrees apart on a ring;
  banding the radii helped and did not finish it, and the field is a third
  the size on a phone where every near-miss became a hit. So the seeded
  angles are a starting point and a deterministic pass pushes overlapping
  pairs apart until nothing intersects — once per resize, not per frame.
  Two traps it cost: `flex-direction:row-reverse` does NOT make a box
  extend leftward (the box still starts at `left:50%`; use `right:50%`), and
  a node anchored by one edge does not land centred when it scales up — it
  put the surviving label off the right of a phone screen until the target
  position accounted for the box's own half-width.

**Testing them headlessly:** do not scroll. Headless paints reliably at scroll 0
and `window.scrollTo` fights Lenis. `_track.js` derives progress from the track's
rect, so pulling the track up with a negative `margin-top` produces any progress
value with the document still at scroll 0. **Hide the preceding siblings when you
do** — the negative margin drags the track up over content still sitting at its
natural position, and the overlap looks exactly like a layout bug that is not
there.

**A pinned stage cannot scroll.** Anything taller than `100svh` is unreachable,
and the note under each instrument is the copy that says what the stage means.
Measure the union of the stage's CHILDREN — `scrollHeight` lies here, because a
flex column with `justify-content:center` reports its own height even when the
content overflows past both edges.

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

`assets/js/cmdk.js` + `cmdk.css`, on all ten pages. Fourteen destinations:
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

Still open: the three `.cap__row` links in SYS.02 (Diagnostic core, Structural
rebuild, Live calibration) are `href="#"`. They carry an arrow, so they read
as links and currently jump to the top of the page. They need a destination
decided rather than invented.

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

## Open

- ~~`TODO(asset)` — hero video~~ **CLOSED 2026-08-17.** There is no video anywhere
  on the site. The field renders its own subject, so there is nothing to source.
- ~~No favicon yet~~ CLOSED 2026-08-18 — `assets/media/icons/`, built by
  `icons.py` from the same `M4 5h12L4 15h12` path, seam dropped at 16px.
- Nav below `sm` should swap the full wordmark for the Z monogram.
- ~~`Journal` unrouted~~ RESOLVED 2026-08-18: the nav slot now goes to
  `foundation.html`. Journal is no longer in the nav at all. Per docs/strategy.md it is the credibility
  engine for a referral-only firm — strongest candidate after the readiness assessment.
- Domain is **zyrn.org**, registered at Spaceship. `CNAME` in the repo root binds
  GitHub Pages to the apex; canonicals, `og:url` and `sitemap.xml` all point at
  `https://zyrn.org`. If the host ever changes, those three plus `robots.txt`
  and the `mailto:access@zyrn.org` in SYS.05 all need updating together.
- Verify a deploy against `https://risethehorns-arch.github.io/Zyrn/`, not the
  custom domain — Pages serves a push immediately, DNS lags.
- SYS.03's four lines now link to `services/*.html`, and `services.html`
  indexes them. The nav is Work / Foundation / System / Services /
  **In production** / Contact — the last one added 2026-08-19, pointing at
  `index.html#production`. `nav.js` clones `.nav__links` for the phone
  sheet, so it appeared there on its own.
- Service pages still have no per-service proof, but `lumina.html` closes
  out to both relevant lines and `brand.html` §04 links into it. The two
  service pages that Lumina evidences (website-design, brand-kit) do not
  yet link TO the case.
- ~~No proof anywhere on the site~~ **CLOSED 2026-08-19.** `lumina.html`
  (SYS.07 — CASE 01) is the case study, and the proof band on `index.html`
  between SYS.03 and SYS.04 is its entry point. Every number on both is
  counted from the Lumina repo rather than asserted: 14 pages, 5,461 lines
  of CSS, 7,228 of JS, 3 self-hosted faces, a CSP pinned to `'self'`, and
  the 8-replaced/1-added token re-base of 2026-07-28. The screenshots are
  stitched captures of the LIVE www.lumina-jo.com, not mockups.
  Still true that this is ONE case. A second would let the landing band
  become a row rather than a single card.
- Real 60fps at 90k has NOT been measured on hardware. Headless renders this page
  at roughly one frame per second of virtual time, so it cannot judge frame rate.
  Open any page with `?probe=1` in a real browser and read the console.
