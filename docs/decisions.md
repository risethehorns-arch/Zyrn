# ZYRN — open items, and the closed ones worth not re-litigating

Moved out of CLAUDE.md on 2026-08-30. This is a running record rather
than a rule set, so it does not need to be in context for every session —
but READ IT BEFORE RE-OPENING A SETTLED DESIGN QUESTION. Several entries
exist precisely because something was tried, rejected, and would otherwise
be tried again.

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
  and the `mailto:info@zyrn.org` in SYS.05 all need updating together.
  **The address is `info@zyrn.org`** — the firm's formal address, set
  2026-08-21. It replaced `access@zyrn.org`, which was a placeholder
  from the design source and was never a real mailbox. It appears in
  three places and they are kept deliberately distinct: the FOOTER on
  all eleven pages carries a bare `mailto:` with no preset subject and
  prints lowercase (it is a formal address, not a campaign); the CTAs
  carry a contextual `?subject=`; and `foundation.html`'s Organization
  JSON-LD carries `email` plus a `contactPoint`, which is what machines
  read. The old `Q3 2026` in the request-access subject went with it —
  a dated subject line is stale the quarter after it ships.
- Verify a deploy against `https://risethehorns-arch.github.io/Zyrn/`, not the
  custom domain — Pages serves a push immediately, DNS lags.
- The "In production" band on `index.html` is FOUR cards as of
  2026-08-30: Lumina / THEHUB / Axes / Duk, in that order — the two
  client cases first, then the two of ours. Each panel is a different
  KIND of thing on purpose: Lumina and THEHUB are SCREEN RECORDINGS of
  the live sites, Duk is its mark on a ruled ground (nothing is built
  yet), Axes is a live particle entity (it is running, and it has no
  interface). None of the four is a mock-up, and none should become one.
  `proof.css` is an explicit **two**-column grid, NOT `auto-fit`: four
  across at this container width gives each card 270px, narrower than
  the third that was already too narrow to lay a card out sideways in,
  and auto-fit drops tracks on its own schedule and orphans whatever is
  left over. Below 1040 the cards go to one column AND lay out
  horizontally; below 640 they stack.

- **THE TWO CARD VIDEOS ARE FREE UNTIL THEY ARE LOOKED AT, AND THAT IS
  THE ONLY REASON THEY ARE ALLOWED.** Both ship `preload="none"`, so
  nothing is fetched during the page load — verified, not assumed.
  `ui.js`'s `setupVideos()` upgrades `preload` and calls `play()` on an
  IntersectionObserver, and pauses on the way out. `prefers-reduced-motion`
  and `navigator.connection.saveData` never start them at all, and the
  posters are real frames of the same footage so both degrade to the still
  that used to be there. If you add a third video, keep every one of those
  properties. Field re-measured after: 90,000 points, 2.66ms median,
  p95 3.83, governor rung 0.

- **Two headless traps that both look exactly like a bug in the page.**
  Measured 2026-08-30, and neither is anything to do with the site:
    1. **Headless Chrome with the hardware GPU decodes three frames of any
       video and then reports `paused` with nobody having called `pause()`.**
       A bare `<video autoplay muted loop>` on an otherwise empty page does
       the same, which is how it was pinned down. Use
       `--use-gl=swiftshader --enable-unsafe-swiftshader` to verify video;
       use `--use-angle=d3d11 --enable-gpu` to measure the field. You cannot
       have both in one run.
    2. **`python -m http.server` has no HTTP Range support**, so a `<video>`
       served by it reports `seekable` as `[0, 0]` and CANNOT BE SEEKED. The
       scroll-scrubbed reels sit on frame zero and look precisely like a
       poster that failed to load. GitHub Pages serves ranges, so this only
       ever bites in preview. Use `serve.py` (in the job tmp dir), which
       does. **Never hand the owner a preview link off the no-Range server.**
- SYS.03's four lines now link to `services/*.html`, and `services.html`
  indexes them. The nav is Work / Foundation / System / Services /
  **In production** / Contact — the last one added 2026-08-19, pointing at
  `index.html#production`. `nav.js` clones `.nav__links` for the phone
  sheet, so it appeared there on its own.
- Service pages still have no per-service proof, but `lumina.html` closes
  out to both relevant lines and `brand.html` §04 links into it. The two
  service pages that Lumina evidences (website-design, brand-kit) do not
  yet link TO the case.
- **THE TRAVEL IN THE CASE WINDOW IS LINEAR AND MUST STAY LINEAR.** This
  window is a page being scrolled, and the one thing a reader checks without
  knowing they are checking it is whether the thing under the wheel moves
  WITH the wheel. Any easing there is a lie about how far they scrolled. Two
  separate mistakes were reported as one:
    1. travel was `ramp(local, 0.03, 1 - FADE)`, a smoothstep that SATURATES
       at 0.86 — so for the last 14% of every scene the window stood still
       while the phone strip beside it carried on. "My mouse scroll is synced
       with the mobile look."
    2. progress was clamped into 0.05..0.95, leaving 218px of scroll at the
       top of the section where the page moved and the window did not.
  Both gone: `q = p`, travel is `local` with nothing applied, and the phone
  runs on the same clock so the two devices agree. `docs/sync.py` samples the
  transform at 130 scroll positions and reports px-of-strip per 100px-of-page
  per scene, in-scene variation, and any dead zone. **Run it after touching
  rack.js.** Current: LINEAR, no dead zones, Lumina 2.4:1, THEHUB 1.7:1.

- **Track length is what sets the FEEL, and it is per page.** `--rktrack` on
  `#rkTrack`: Lumina 1200vh for six pages of strip, THEHUB 850vh for four. At
  the old shared 620vh the strip ran 5.5px for every 1px of page — the window
  was not being scrolled, it was being fast-forwarded, and it read as unsynced
  even once the travel was linear.

- **The proof cards are `<article>`, not `<a>`, as of 2026-08-30.** They carry
  two destinations now: the card goes to the case study, and a VISIT TAB goes
  to the live site. Nested anchors are invalid and browsers unnest them, which
  would have thrown the tab out of the card — so `.proof__go` is the real link
  and stretches over the card with `::after{inset:0;z-index:1}`, and `.visit`
  sits at z-index 3 above it. That arrangement fails silently if the z-order
  is wrong: every tap goes to the case study and nothing looks broken.
  `docs/hits.py` hit-tests elementFromPoint at each card's body and at all
  four corners of each tab, across four viewports. **Run it after touching
  either.**

- **`.visit` lives in styles.css and its image rule needs the extra class.**
  `.visit .visit__mark img`, never `.visit__mark img`: the tab sits inside
  `.proof__vis`, whose own `img` rule sets `width:100%` and
  `aspect-ratio:16/10` for the card poster — equal specificity, and proof.css
  loads later, so it won and the Lumina mark computed to 0x0. THEHUB's
  survived only because its `--hub` filter rule happened to carry one more
  class, which is exactly the kind of accident that hides a bug on one card.

- **The case-page windows use STRIPS, not video. Do not go back.** A
  scroll-scrubbed `<video>` shipped on 2026-08-30 and was reported dead the
  same day: Safari and iOS will not reliably seek a `preload="none"` element
  without a user gesture, and a scroll instrument has none to offer. It seeked
  perfectly in Chrome, which is why it shipped. The tell was already on the
  page — the PHONE STRIP beside the window scrolled, and it is driven by the
  same draw() callback, so only the seeking was ever in question. Both
  windows are back to tall strips translated by scroll, regenerated by
  `docs/strips.py` at eight to ten tiles a scene. Hide the sticky header
  after the first tile of every scene or a nav bar prints across every join.
  The four card videos on the landing page are fine and stay: autoplay-muted-
  loop needs no seeking.

- **`services/website-design.html`'s signature is THE STACK**
  (`modules/stack.js`), added 2026-08-30, replacing the `build.js` wireframe
  which is deleted along with its 109 lines of CSS. Six layers of one page —
  grid, structure, type, colour, motion, surface — in a `preserve-3d` scene,
  tipped into an isometric and pulled apart on scroll, with the layer being
  named PULLED OUT OF THE DECK to the front. Three things about it:
    1. **A 3D explode overflows its own layout box.** The layers are pushed
       in Z and the perspective magnifies them, so the box the browser
       reserved is not the box you see. The first build was tuned by eye and
       hit the step readout on all seven test viewports and ran off both
       edges of a phone. `docs/stkfit.py` reads the projected union back out
       of getBoundingClientRect and checks it against the head, the note and
       the key — worst case being the bottom layer pulled fully forward.
       Every geometry number (`--zstep --tilt --spin --lift --shrink`) is a
       CSS variable so it can be tuned against that probe. Re-run it after
       ANY change to those.
    2. **Never dim most of the stack to highlight one layer.** The first
       build dropped the five unlit layers to 0.34 and the whole instrument
       went to a ghost. The naming is carried by the lit layer gaining an
       edge, a shadow and forward travel — not by the others being removed.
    3. **No `filter` on the layers.** A filter on a transformed child
       flattens `preserve-3d` in some engines and the stack collapses into a
       flat pile with no warning. Opacity via a `--lit` variable instead.
  Its MEASUREMENT row is not typed: `field.js` writes into `#sMs` and `#sFps`
  wherever it finds them, so that row measures the page you are reading.
  Measured after: 90,000 points, 2.42ms median, p95 3.9, governor rung 0.

- **`thehub.html` is SYS.08 / CASE 02, added 2026-08-30.** THEHUB
  (qutaifan.com) is the owner's friend's live, ad-funded software
  directory; Zyrn's engagement was the DESIGN SYSTEM ONLY and the page
  says so in three places. Its signature is `modules/wipe.js` — the same
  page in both designs with a scroll-driven seam, LEFT ALWAYS BEFORE and
  RIGHT ALWAYS AFTER. Both halves of every pair were captured from a local
  server at the same viewport, scroll position and second: BEFORE is
  `git archive HEAD` of the clone, AFTER is the working tree, verified
  byte-identical to what qutaifan.com serves. Do not re-shoot one half
  from live and the other from disk — a comparison has to differ in the
  design and nothing else.
  Its numbers are all counted, and `words.py` is the one worth keeping:
  it strips tags from both versions of all 180 pages and diffs the
  rendered word counts. **179 of 180 identical.** That is what lets the
  page say no editorial was touched.

- **`modules/rack.js` is shared by `lumina.html` and `thehub.html`.**
  `initRack(opts)` takes `{scenes, host, settled}`; the module owns the
  behaviour and each page owns its own footage. `LUMINA_SCENES` is the
  default export for the page that had it first. Scene `w` values are the
  concat durations the cut was built from, used as WEIGHTS — boundaries
  are derived from the video's own reported duration, so a re-encode at a
  different length needs no change in the page.

- ~~No proof anywhere on the site~~ **CLOSED 2026-08-19.** `lumina.html`
  (SYS.07 — CASE 01) is the case study, and the proof band on `index.html`
  between SYS.03 and SYS.04 is its entry point. Every number on both is
  counted from the Lumina repo rather than asserted: 14 pages, 5,461 lines
  of CSS, 7,228 of JS, 3 self-hosted faces, a CSP pinned to `'self'`, and
  the 8-replaced/1-added token re-base of 2026-07-28. The screenshots are
  stitched captures of the LIVE www.lumina-jo.com, not mockups.
  Still true that this is ONE CLIENT case. The band is a row of three
  now — Lumina (live), Axes (in service), Duk (in development) — but two
  of those three are ours, so a second client case is still the thing
  that would change the argument.
- ~~Real 60fps at 90k has NOT been measured on hardware~~ **CLOSED
  2026-08-21.** Measured, on an NVIDIA RTX 3050 via ANGLE/D3D11 at
  1440x900:

  | page | points | median GPU ms | p95 ms | fps | governor |
  |------|--------|---------------|--------|-----|----------|
  | index.html | 90,000 | **2.78** | 3.87 | 144 (vsync) | rung 0 |
  | axes.html  | 90,000 | **2.69** | 3.69 | 144 (vsync) | rung 0 |
  | 393x610 `?coarse=1` | 14,400 | 2.81 | 4.03 | 144 | rung 0 |

  144fps is the display refresh, not a ceiling — the number that matters
  is 2.78ms median, which is 17% of a 60Hz frame budget and 40% of a
  144Hz one. The governor never stepped down, GPU timer queries resolved
  (120 samples), cold start 2.5s. The two 2D canvases added on the same
  day (`axent.js`, `axsplit.js`) cost nothing measurable — axes.html is
  the FASTER of the two pages.

  **The old note here said "headless is useless as an fps oracle". That
  was wrong, and it is worth knowing why:** the one-frame-per-second
  behaviour is a property of `--virtual-time-budget`, not of headless.
  Drop that flag, pass `--use-angle=d3d11 --enable-gpu`, wait in
  WALL-CLOCK seconds, and `--headless=new` renders on the real adapter at
  real speed. `gpuprobe.py` (job tmp) does exactly that and reads the
  result off `document.title`, which `field.js` sets alongside the console
  line — more reliable than console capture, which misses anything logged
  before `Runtime.enable` lands. Still true: a virtual-time capture cannot
  judge frame rate, and this measures THIS machine's GPU, not a phone's.

- Duk's §06 no longer carries a progress bar. It was two pips of five and
  the stage was invented — the one asserted number on a page written
  specifically to refuse invented numbers. A bar needs a denominator, and
  there is no drawn finish line to count toward. The paragraph beside it
  now says so. Every remaining row in that panel is checkable: status,
  stage in words, licence, hosting, public build, early access.

- The three `.cap__row` items in SYS.02 are no longer links. They are the
  PHASES of an engagement, not products, and there is no page per phase;
  they carried an arrow and `href="#"`, so three controls read as links
  and jumped the reader to the top. Rather than invent three destinations
  the affordance is gone, and one real one sits under the panel — "The
  four lines that carry them", to `services.html`. `.cap__arrow` and its
  hover rule are kept in `styles.css` for the day the method gets a page
  of its own; nothing renders them today.

## The CRM is the fifth channel, not the fifth line — 2026-09-01

**Settled. Do not re-open without re-reading this.**

The owner asked for the customizable CRM as "the new 5th service", with
its own page and its own signature instrument. It has both. What it is not
is line 05, and the reason is structural rather than editorial.

"Four lines, one system" is not a slogan on this site. It is:

- the H1 of `services.html`, and a kinetic headline
- `core.js` — a ring cut into four 80-degree arcs with the gaps landing
  exactly on the diagonals the four arms run along, inside a PINNED stage
- `matrix.js` — sixteen authored readings, one per subset of four, each
  one a claim the firm is willing to make
- copy on `index.html`, `brand.html`, `duk.html` and `foundation.html`

Filing the CRM as line 05 costs: re-cutting that ring into five 72-degree
arcs, which puts one 168px node label straight down the bottom of a stage
that cannot be scrolled; sixteen more matrix readings for combinations
nobody has claimed; and a positioning change on five pages. It buys
nothing the fifth channel does not already give.

It is also not true. The four lines are ENGAGEMENTS — you run one and
something about the firm changes. The CRM is an ARTEFACT: it gets
installed, handed over, and then nobody from Zyrn touches it again. That
is a different kind of thing and the site is better for saying so.

So: five tabs, five footer rows, five palette entries, five sitemap
entries, a card on `services.html` under its own rule and one in
`index.html` SYS.03, all marked 05 — and the core instrument, the matrix
and every "four lines" sentence left exactly as they were. `index.html`
SYS.03's lede went from "Four lines, one system" to "Four lines and the
system they ship", which is the only sentence that had to move.

This matches `docs/roadmap.md` Phase 2, which reached the same conclusion
from the market side before any of it was built.

## Three instruments were deleted and none of them was broken — 2026-09-01

`specimen.js`, `graph.js`, `readiness.js`. Every argument they made was
correct and the copy was good enough to carry across verbatim. They were
replaced because they were roughly a quarter the size of the space they
sat in, and because two of them made their point in a caption under the
picture rather than in the picture:

- the readiness meter said "the index is the constraint, not the mean" in
  a line of mono under five bars. THE WELL rests a slab of floor on the
  shortest column and lets the other four stick uselessly through it.
- the decision graph lerped between two flat layouts, so the reader had to
  be told they were the same eleven nodes. THE PLAN rotates the camera
  from an elevation to a plan and the chart tips over in front of you.

**The generalisable rule: if the instrument needs a caption to make its
argument, the instrument is not making the argument.** That is worth
checking before building the next one.

