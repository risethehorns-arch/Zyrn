---
paths:
  - "assets/js/modules/**"
  - "assets/js/*.js"
  - "assets/css/svc-modules.css"
  - "assets/css/case.css"
---

# ZYRN — the signature instruments

Moved out of CLAUDE.md on 2026-08-30. Every one of these is a scroll
instrument and its history — including the two that had to be deleted and
what that cost. It loads automatically whenever Claude touches a module,
a script, or one of the two stylesheets that carry them.

## Signature instruments — rebuilt at one scale, 2026-09-01

**Read this before touching any of them.** Five service pages, five
instruments, and they are ONE SHELL now:

    .sig__track            620vh, every page
    .sig__stage            position:sticky, min-height:100svh
    .sig__head             mono step readout + percentage
    .rig                   the instrument, at --righ tall
      .rig__view           the stage it draws inside
      .rig__key            the counted key rail beside it
    .sig__note             what the current beat means

`_track.js` gives each one a 0..1 progress on rAF — not on a scroll event,
because Lenis drives scrolling on rAF and a scroll listener would lag the
field by a frame or two. One shared loop serves the page and parks when
nothing is on screen.

### THE SCALE IS ONE NUMBER, and this is the rule that matters

    --rigchrome   everything the pinned stage spends on something other
                  than the instrument: both paddings, the head, the two
                  gaps, the note
    --righ        clamp(200px, 100svh - var(--rigchrome), 700px)

Every geometry inside every instrument is a RATIO of `--righ`. The stack's
Z separation, the fold's panel width, the well's shaft and depth, the
swarm's chip width, and — the one that was missed first time — **the
camera**. Before this rebuild each instrument carried hand-tuned pixel
constants, which is why the four were four different sizes and all four
were smaller than the space around them: you could not make one bigger
without re-tuning five numbers against each other.

**If you add an instrument, derive its geometry from `--righ` and add
nothing in px.** If you find yourself wanting to, the answer is almost
always a new ratio.

**A camera is geometry too.** `perspective` was a flat `1500px`, tuned
against a 520px stack. At 700px the same camera magnified the stack's
pulled-out layer by 1.6x and pushed fifty pixels of it down through the
note. It is `calc(var(--righ) * 3.0)` now — a camera that does not step
back when the subject grows is the same bug as a hard-coded geometry, one
level up.

**`docs/rigfit.py` is how any of this is known.** It steps every
instrument through eight progress values at nine window sizes and reports
the PROJECTED union of everything painted against the head, the note, the
key rail and the window edges. `getBoundingClientRect` reports the
projected rect of a transformed element, which is what makes a 3D explode
measurable rather than a matter of opinion. Run it after touching any
geometry. `docs/rigshot.py` photographs one at chosen progress values.

### The five

- **stack** (`services/website-design.html`) — a finished page taken apart
  into the six layers it is made of, held apart while each is named, and
  put back. Six absolutely-positioned siblings in one preserve-3d scene.
  The last row of its key is not typed: `field.js` writes the live median
  frame time and fps into `#sMs` / `#sFps`, so the MEASUREMENT row is
  measuring the page you are reading.
  **The surface SWITCHES ON when the stack lands** (owner-requested
  2026-09-01: the closing frame was “just a black box”). `stack.js` adds
  `.is-live` at p ≥ 0.935 — progress-gated, not beat-gated, because
  beat 7 begins at 0.84 while the stack is still airborne and a page
  lighting mid-flight reads as a glitch. What lights: the mini mark's
  seam (`--pulse-mark`, the mark's own token), the ask filling Pulse
  (the surface's one Pulse, same as the real page), two blurred-colour
  blooms as the mini page's field, one ramp-hue top edge per card, and
  a screen bloom off the box. The bloom RECTS stay inside the layer —
  rigfit measures rects, and a box hanging past the stage flags the
  head; the corner spill comes from the BLUR, which paints beyond the
  rect without widening it. The opening beat keeps the quiet version:
  the bookend — same box, arrives dark, leaves lit — is the argument.
- **fold** (`services/brand-kit.html`) — one sheet that unfolds into five
  panels and folds back. **Panel n is a CHILD of panel n-1**, pinned at
  `left:100%` with `transform-origin:left center`: that nesting IS the
  hinge, and flattening it into siblings makes each panel swing alone.
  The camera does the other half — it opens small enough to see all five
  at once, dives to full size, walks the row, then pulls back and shuts.
  Replaced `specimen.js`.
- **plan** (`services/business-structuring.html`) — eleven nodes as an
  elevation (the published chart) rotating into a plan (authority where
  the work is) while a decision token travels the long route and then the
  short one. Two 3D positions per node, one camera pitch, both driven by
  the same eased number. Every hop count on the key rail is written by the
  module off the arrays that draw the diagram — nothing is typed.
  Replaced `graph.js`, which lerped two flat layouts and never became one
  picture.
- **well** (`services/ai-transformation.html`) — five dimensions climbing
  a shaft through four gates, and a plane that rides on the SHORTEST of
  them. The plane is the instrument: the readiness index is the lowest
  dimension, never the mean. Rates, convergence and level copy carried
  over verbatim from `readiness.js`; only the size and the form changed.
  **Nothing changes a height**: the fill is a full-height box scaled from
  its base and the cap and readout are translated to meet it.
- **lattice** (`services/crm.html`) — the THIRD CRM signature, and the
  one that stood. Forty-eight records as SPARKS OF LIGHT, and every
  organising act drawn as labelled luminous structure through them:
  named (the count runs the field as you scroll), the schema (five
  labelled hubs, every record tied to its object), the pipeline (three
  labelled rails, the 07-day file burning in Pulse), the ledger (a time
  spine whose sweep IS the scroll), handed over (all forty-eight
  converge into one core — the core is literally the records). The
  reader's pointer flares the nearest spark and prints its reference at
  any beat. The light travels the field's vivid ramp beat by beat — the
  cold hues print as LIGHT (drop-shadow bloom), the glitch's standing,
  never as ink.
  What it keeps from the swarm's post-mortem: resize must redraw;
  depth scales `H/700`; the spread budgets for the body plus a constant
  ~1.08 worst-case projection. What it adds:
    · **every dwell motion is windowed by sin(dT·π) or runs an exact
      whole cycle**, so it is zero at the dwell's entry AND exit —
      otherwise the flight that follows starts from a position the
      formation never authored, and the whole flock snaps.
    · **structure never tracks moving endpoints** — lines and labels
      exist only while a formation is settled (drawn in on landing,
      faded on departure), so per-frame work is transforms only.
    · **the hover mapping refreshes its view rect in onNear, not in
      draw** — draw only runs when progress CHANGES, and a parked
      reader still moves the pointer.
    · **a light instrument needs a dark ground.** The crm field program
      now completes S1→S3 at page 0.10–0.26, BEFORE the track pins at
      0.11–0.63 — sparks over S1's blazing core were invisible. If an
      instrument is made of light, check what the bed is doing behind
      it at the pin, not at scroll 0.

- **swarm** — DELETED 2026-09-01, same day it shipped. Forty-eight dark
  chips flying between six formations. The owner: “the motion now looks
  off … low quality and not easy to understand. and there is also no
  light or designing unique effects on the scattered data”. The
  diagnosis, recorded because it is a DESIGN rule and not a tuning
  matter: opaque chips against a 90k-particle light field read as
  texture, not as records; formations without labels ask the reader to
  infer what each shape means; and a closing stack is a blob. The
  concept (scattered data becoming a system) survived into the lattice;
  the medium did not. Its resize/depth/spread rules were correct and
  moved to the lattice. Git history has the module.
- **orbit** (`services.html`) — five things riding a tilted ring around one
  core, and a scroll that takes you round it once. Replaced `core.js`, a
  flat four-arm diagram, on 2026-09-01: two dimensions could carry the
  four lines and had nowhere to put the fifth, which is not a line but the
  artefact the lines ship — and at the closing beat it leaves the ring for
  the centre, which is a sentence only depth can say.
  **The scene carries the TILT and each node carries the SPIN**, because a
  node has to undo both to keep its label facing the reader; put the spin
  on the scene and every label at the back rotates away from you.
  **Depth cueing is written by the module as `--z`** — nothing in a
  stylesheet can read a child's computed Z, so opacity, scale and the
  front-most pick all derive from one number the module supplies.

`services.html` keeps **matrix**, which still covers the four advisory
lines only — see `docs/decisions.md`.

### The three that were replaced

`specimen.js`, `graph.js` and `readiness.js` were deleted on 2026-09-01,
and `prism.js` followed the same day — built that morning, replaced by
the swarm that evening at the owner's direction. Its one recorded trap
(`translateZ` rejects percentages — a `--prw:min(…,70%)` invalidates the
whole transform SILENTLY and every face stacks at z=0) is preserved here
because it will bite any 3D instrument: keep every translateZ in
JS-measured px.
None of them was broken and none of the arguments they made was wrong;
all three were roughly a quarter the size of the space they sat in, and
two of them made their point in a caption rather than in the picture. The
copy worth keeping was carried across verbatim — the five readiness level
texts, the rates and the convergence curve, the palette and type values.
Git history has the originals.

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

`axes.html` deliberately has NO signature instrument any more.

- **§02 was `decompose.js`, a pinned scroll instrument, and it was
  removed on 2026-08-21 at the owner's direction after being reported
  broken from three different devices in a row.** Every report was a
  real defect and every fix was correct, and a new one appeared
  underneath it each time — clipped copy on a short window, the finding
  printing through the artefact on a phone, the whole thing sprawling
  edge to edge on an ultrawide, and finally a measurement that had
  silently decayed to zero so the six axes had never once moved.
  That is not a run of bad luck, it is the shape of the thing:

    · a stage that must fit inside `100svh` clips what does not fit,
      and a pinned stage cannot be scrolled to reveal it
    · layers stacked by absolute position collide at heights nobody
      authored, and no layout rule prevents it
    · everything is a `clamp()`, and clamp FLOORS do not shrink
    · nothing is visible until the reader reaches the exact progress
      value that reveals it, so every beat is a chance to show nothing

  The replacement is the same argument built the other way round:
  everything in normal flow, everything always visible, all six axes and
  their thirty questions legible AT ONCE as a six-card grid instead of one
  at a time under a moving sweep. Motion lives in `assets/js/axsplit.js` — a canvas
  drawing inside its own `aspect-ratio` box — and in CSS that animates
  opacity only. Neither can move the layout, clip anything or collide
  with anything. Verified with no horizontal overflow from 320px to
  2530px wide and every block reaching full opacity at 393x610, 390x844,
  2530x500, 1440x900 and 1920x1080.
  The archived original is `_archive/decompose-pinned-instrument.js`
  (gitignored, local only — it was never committed).

  **Re-authored again, same day, and this one is a CONTENT rule.** The
  flow rebuild was structurally sound and the owner still reported it as
  looking broken — because the material was a bug report. §02 quoted a
  real one-line brief about a broken link, printed forty-one log lines
  (`[hidden] = true`, `display:flex wins`, `880 intercepted`), and ended
  on a CSS declaration in a code panel. All of it was true, all of it was
  well made, and on a PRODUCT page a visitor reads a quoted defect and a
  rule dump as the site malfunctioning in front of them. "They look like
  the site is bugging."

  So the engineering incident is gone. The six axes now carry the
  QUESTIONS each one opens, written for someone who runs an organisation
  rather than a codebase — who actually decides, where a request waits,
  which claim has a number behind it. The off-brief argument survives as
  a principle instead of an anecdote, and the closing block states what
  comes back rather than pasting it. There is no `<code>` element left on
  the page and no line set in mono that is a sentence.

  **The standing rule: never print a defect, a log line or a rule dump as
  page copy on a product page.** Internal detail that reads as rigour in
  a commit message reads as breakage on a website. Where a worked example
  is wanted, it has to be work the buyer recognises, and it must not be
  invented — which on this site means it comes from the Lumina case or it
  is stated as method, never as a fabricated engagement.
  The axis formerly called INPUT is ACCESS, for the same reason: "input"
  reads as a keyboard.

  **The lesson generalises and is the reason this is written down:** a
  pinned instrument is a promise that the composition fits one viewport
  height. Make that promise only where the content is genuinely fixed
  and small. Where the content is a body of text, put it in flow.

**Testing them headlessly:** do not scroll. Headless paints reliably at scroll 0
and `window.scrollTo` fights Lenis. `_track.js` derives progress from the track's
rect, so pulling the track up with a negative `margin-top` produces any progress
value with the document still at scroll 0. **Hide the preceding siblings when you
do** — the negative margin drags the track up over content still sitting at its
natural position, and the overlap looks exactly like a layout bug that is not
there.

**The negative-margin trick does NOT move the field.** `sig.py` pulls the
track up while the document stays at scroll 0, so the bed renders whatever
formation page-progress 0 gives — every capture of an instrument shows it
over the WRONG formation unless you also pass `?freeze=S1|S2|S3|S4`. This
made the decomposition look unreadable against a torus it will never
actually sit on.

**A pinned stage cannot scroll.** Anything taller than `100svh` is unreachable,
and the note under each instrument is the copy that says what the stage means.
Measure the union of the stage's CHILDREN — `scrollHeight` lies here, because a
flex column with `justify-content:center` reports its own height even when the
content overflows past both edges.

`axfit.py` (job tmp, not the repo) is that measurement, and it does two
things because fitting turned out to be only half of it. It reports the
children-union against the viewport at ten progress values across a
spread of window sizes — **including short and ultrawide ones, which is
what the owner actually runs and what nothing was being tested at** — and
it reports every pair of VISIBLE boxes that intersect. Ancestor/descendant
pairs are excluded; the individual lanes are included, because an
absolutely-positioned payoff box sitting inside `.dc__field` is an
ancestor pair with the field and a genuine collision with the lanes.
Three real defects came out of it that every screenshot at 1440x900 had
been hiding.
