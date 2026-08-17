# ZYRN — PRESENCE FIELD

`SYS.07 — Build spec / V.2.0-draft` · authored 2026-08-17
Supersedes nothing. Sits alongside `docs/build-spec.md`; where the two disagree,
the departures in §0 govern this surface only.

**STATUS: shipped site-wide, 2026-08-17.** The field is the bed on all six pages.
The engine lives in `assets/js/field.js`, the page layer in `assets/css/field.css`;
each page supplies a `program` (formations against scroll) and a `channel` (tilt
and spin). The v1.0 video-bed site is archived at
`_archive/zyrn-v1.0-2026-08-17.zip`, and the standalone three-act page this spec
was first built as is at `_archive/presence-v2.0-standalone-2026-08-17.html` — its
engine became `field.js`, its hero became SYS.01's live metadata and stats strip,
and its closing line already lived in SYS.04 as Level 04.

Where this document still says "presence.html", read "any field page". The section
below on page structure describes that original three-act page; the shipped
landing keeps the five SYS scenes instead and maps the same four states onto them.

---

## 0. The one-paragraph brief

A single-page immersive landing surface where a 90,000-point GPU particle field
**is** the entire visual identity — no footage, no imagery, no gradients-as-decoration,
no chrome. The field reads the visitor's presence (pointer, scroll velocity, dwell,
idle) and answers in motion. Over three scroll acts it argues Zyrn's thesis
structurally: a found system, its entropy, the engineered loop, and the release.
Typography is Zyrn's existing two faces, unchanged. The palette is Zyrn's four
tokens, unchanged. Everything that used to be ink is now light.

### Why this is not the current landing page

The v1.0 landing is a **video-bed** site: scroll scrubs a filmed asset behind
hairline metadata. This is a **generative** site: there is no asset. The distinction
matters commercially — an org-engineering firm that renders its own thesis in real
time is making a claim a stock clip cannot make. It also closes the open
`TODO(asset)` permanently: there is no hero video to source.

### Doctrinal departures — these need your nod

`CLAUDE.md` currently forbids what this surface requires. Three named departures,
in the same style as the two already on the books (glass, wordmark glitch):

**Departure 3 — additive light is permitted on this surface.**
Hard rule *"No gradients beyond the two Obsidian video-edge fades. No glows, no
noise."* is suspended here and **only** here. The rule exists to stop decorative
glow being sprinkled on a flat page. Here, emitted light is the entire medium —
there is no flat page to protect. `brand.html` and `services/*.html` keep the rule
verbatim.

**Departure 4 — the field is the Pulse.**
Doctrine rule 3 says `#6E56F8` appears exactly once per viewport. On this surface
the field carries Pulse continuously, so the rule inverts rather than breaks:

> **No DOM element on this page may use Pulse. Not the seam, not a button, not a
> rule, not a hover state. The accent has moved from ink to light.**

The hero wordmark's shear seam becomes Vapor at 0.14 alpha. This is stricter than
the original rule, not looser — one Pulse source per viewport, and it is the sim.

**Departure 5 — the headline is a live stat.**
See §4.1. The hero's first line states the particle count in words, and it is read
from the sim, not typed. If the performance governor steps the field down, the
headline changes with it. This is doctrine rule 2 (*metadata as ornament — the only
decoration is real information*) taken to its conclusion: the largest type on the
page is a measurement.

**Unchanged and non-negotiable:** the two typefaces, the four tokens, the shear law
(the wordmark shears once and never un-shears), no plain-text ZYRN, no exclamation
marks or superlatives, no faces, mono labels at `11px / uppercase / 0.16em / Steel`.

---

## 1. Brand block — the only values permitted

| Token       | Value                    | Role on this surface                          |
|-------------|--------------------------|-----------------------------------------------|
| Obsidian    | `#0E0F12`                | canvas clear colour, page ink                  |
| Obsidian-2  | `#08090B`                | edge falloff of the background shader only     |
| Vapor       | `#F2F3F5`                | all body and display type; particle nucleus    |
| Pulse       | `#6E56F8`                | **light only** — particle mid-band, bloom tint |
| Steel       | `#767E8C`                | mono metadata; particle outer band             |
| Hairline    | `rgba(242,243,245,0.08)` | rules, nav pill border, stat separators        |

**Particle ramp — four stops, exposed as uniforms** (`uRamp0..3`, plus `uRampPos`
as a `vec3` of the three interior breakpoints so the curve is tunable live):

```
t=0.00  uRamp0  #767E8C  Steel      outer / rim / cold
t=0.42  uRamp1  #6E56F8  Pulse      mid-radius body
t=0.78  uRamp2  #A99BFF  Pulse+     lifted Pulse, the approach to core
t=1.00  uRamp3  #F2F3F5  Vapor      nucleus, hot centre
```

**SUPERSEDED 2026-08-17 — see Departure 6.** The owner asked for materially more
vibrancy against a reference image, and the shipped default is now the `vivid`
ramp, which puts two cold stops outside the four tokens:

```
t=0.00  uRamp0  #5FE3B0  Teal       outer / cold
t=0.36  uRamp1  #33C9DE  Cyan       the travel between cold and accent
t=0.72  uRamp2  #6E56F8  Pulse      the anchor, and the dominant stop
t=1.00  uRamp3  #F2F3F5  Vapor      nucleus / rim highlight
```

Both cold stops are **emitted light only** — Departure 4 still forbids them, and
every other hue, as DOM ink. The ramp above (Steel → Pulse → `#A99BFF` → Vapor)
survives as `initField({ ramp: 'strict' })`: a luminance ramp rather than a hue
ramp, quieter, and closer to the original doctrine. `#A99BFF` is Pulse lifted
toward Vapor in luminance, not a new hue.

The bloom ceiling of `≤0.35` in §8 went with this change: vivid ships at 0.46,
because a ramp carrying real chroma needs the lift to register as glow rather
than as tint. If you revert to `strict`, put the ceiling back.

**Type — unchanged from the rest of the site.**

- Display + UI: **Space Grotesk** 400/500. Headlines `clamp(2.75rem, 7.5vw, 6.5rem)`,
  line-height `0.94`, letter-spacing `-0.03em`.
- Metadata: **IBM Plex Mono** 400/500. Micro-labels `11px / uppercase / 0.16em / Steel`.
  Stat numerals `34px / 400 / Vapor / tabular-nums`.
- **Bodoni Moda is not used.** Hard rule: never replace the two typefaces.

**Wordmark.** Always the existing shear component (`.shear` markup from `index.html`),
never plain text. Seam is Vapor `0.14α` on this surface (Departure 4). The shear
latches on first scroll gesture and never returns. The `ui.js` glitch wrapper carries
over unchanged.

---

## 2. Narrative — what the four formations actually mean

The original brief's galaxy → scatter → torus → starfield is kept as a *shape*
sequence, but on this surface each state is an argument, not an effect. Formation
names are the ones the readout rail reports.

| # | State      | Shape             | What it says                                                     |
|---|------------|-------------------|------------------------------------------------------------------|
| 1 | `S1 FIELD` | tilted log-spiral | The organization as found. Structure exists, but it is emergent — arms, drift, a dense unexamined core. |
| 2 | `S2 DISPERSE` | scattered box  | Entropy. The same parts, no system. Reached by *turbulence spike*, not by tween — it must look like something came apart. |
| 3 | `S3 CORE`  | rippling torus    | The engineered operating loop. Closed, continuous, breathing. This is the product. |
| 4 | `S4 RELEASE` | sparse starfield | Self-calibrating. The system holds without the field driving it. |

**The payoff.** `docs/strategy.md` §5.1 identifies *"Zyrn is no longer required"* as
the sharpest line in the brand and argues it should lead rather than close. It does
both here: `S4 RELEASE` is the page's last motion, and the outro's only sentence is
that line. The field dissolving into a field that keeps drifting on its own **is**
the readiness index's Level 04, rendered. Nothing else on the page needs to explain it.

Reversibility is a requirement, not a nicety: scrubbing back up must reassemble the
system exactly. An org that only decays is the wrong metaphor.

---

## 3. Stack — pinned

Single HTML file, no build step, ES modules via import map.

```
three            0.171.0    core + addons (GPUComputationRenderer,
                            EffectComposer, RenderPass, UnrealBloomPass,
                            OutputPass)
gsap             3.12.5     + ScrollTrigger
lenis            1.1.18     smooth scroll, fed into ScrollTrigger.scrollerProxy
lil-gui          0.19.2     lazy-imported only when ?debug is present
Google Fonts     Space Grotesk 400;500 · IBM Plex Mono 400;500
```

Pin exact versions in the import map. No UI framework. No bundler. Total network
weight excluding fonts should stay under 700 KB gzipped.

`lil-gui` must be dynamically `import()`-ed inside the `?debug` branch so the
default path never pays for it.

---

## 4. Page structure

One `<canvas>`, `position:fixed`, full viewport, `z-index:0`, behind everything.
DOM sections scroll over it and drive state. The canvas is `aria-hidden`.

Carried over from v1.0 unchanged: the **hairline grid** overlay and the **readout
rail**. The rail now reports the live formation:
`ZYRN / S3 CORE — 067%`. It is the same component, given a better signal.

### Nav (fixed, top-centre)

Obsidian pill, `rgba(14,15,18,0.6)` + `blur(2px)` + hairline border — the existing
panel treatment, not a new surface. Left: shear wordmark. Centre: `Work · System ·
Journal · Contact`. Right: `AMM 31.95°N / 35.93°E` in mono, then the hairline
`Request access` button. Keep Zyrn's nav items; do not import the source brief's
Home/Services/Works/About.

Fades to `0.6` opacity while scroll velocity exceeds a threshold, returns to `1`
after 240 ms of stillness. Fully keyboard-navigable, visible focus rings in Vapor.

**Formation order changed 2026-08-17.** The shipped landing opens on `S3 CORE`,
not on `S1`: the hero lede is *"Zyrn builds the operating core of modern firms"*,
so the operating core is what the visitor lands on. The three acts below describe
the original standalone page; the live program is documented in `CLAUDE.md` and
in `index.html`.

### Act I — `S1 FIELD` (100vh)

- Headline, centred, two lines:
  **`Ninety thousand parts.`** / **`One system.`**
  Line 1's numeral-word is written by the sim (§4.1).
- Caption below, 13px, Vapor `0.6α`, max 46ch:
  *"Every point is a reply — pointer, scroll and dwell, read live and answered in
  motion. Nothing on this page is footage."*
- Formation: tilted **62°**, 3 log-spiral arms, ~90 s per revolution, dense core.
- Stats strip pinned to the bottom, 4 cells, 1px Hairline vertical rules (§4.2).

### Act II — `S3 CORE` (100vh)

- Headline, top-left: **`Engineered,`** / **`not decorated.`**
  *(alternate on file if you prefer the flatter read: `Not a picture` / `of a system.`)*
- Formation: torus `R=1.6`, `r=0.75`, surface displaced by 3-octave curl noise,
  camera slightly above, ring facing the viewer.
- Bottom-left mono micro-copy:
  `IT READS PRESENCE — POINTER, SCROLL, DWELL — AND ANSWERS IN MOTION.`
- Bottom-right: two lines of body copy —
  *"A rendering and interaction layer that turns presence into motion. Tuned to
  stay legible under every pointer."* — then the Vapor-filled `Request access`
  button with the Z monogram icon.
- Footer ticker, 11px mono uppercase marquee, Steel, drawn from the real service lines:
  `[ OPERATING CORE ] · [ HUMAN CAPITAL ] · [ BUSINESS STRUCTURING ] · [ AI TRANSFORMATION ] · [ WEB & STRATEGY ] ·`
  Marquee pauses on `prefers-reduced-motion` and on hover.

### Act III — `S4 RELEASE` (60vh)

- Field dissolves to a slow drifting starfield with slight downward gravity.
- One sentence, centred, Space Grotesk `clamp(1.5rem, 3vw, 2.5rem)`, Vapor:
  **`Self-calibrating. Zyrn is no longer required.`**
- Beneath it in mono, Steel: `SYS.04 / READINESS — LEVEL 04`
- Minimal footer: `ZYRN — EST. 2026` · `AMM 31.95°N / 35.93°E` · `V.2.0 / EN — AR`

### 4.1 The live headline

Act I line 1 is generated, not authored. The sim reports its committed particle
count; a small number-to-words map covers the three tiers and any governor step-down:

```
90000 → "Ninety thousand parts."
40000 → "Forty thousand parts."
14400 → "Fourteen thousand parts."
```

Round to the nearest named tier and never invent precision the sim does not have.
Count-up is not appropriate for words — instead the line reveals with the standard
headline treatment (§7) once the count is committed. If the governor steps down
mid-session, the word **crossfades over 600 ms**; it does not pop. This is the only
DOM text on the site permitted to change after paint, and it changes because the
truth changed.

### 4.2 Stats strip — all four must be real

| Cell | Number | Label | Source |
|---|---|---|---|
| 1 | `090,000` | `PARTICLES LIVE` | the sim's committed count, post-governor |
| 2 | `8.3` | `FRAME BUDGET MS` | rolling **median** of 120 render-block durations |
| 3 | `0.9` | `COLD START S` | §8 definition |
| 4 | `60` | `FRAMES PER SEC` | 1 s EMA of rAF deltas |

Median, not mean — one GC spike must not slander an otherwise clean frame budget.
Numbers zero-padded in the house style (the readout rail already uses `000%`).
Count-up tween on first paint for cells 1, 3, 4; cell 2 begins reporting only after
120 samples exist, showing `—` until then rather than a lie.

**If a number cannot be measured, the cell shows `—`.** Never a plausible constant.

---

## 5. The particle system

### 5.1 Counts — exact squares, no wasted texels

`S = sqrt(N)`, so pick N that are perfect squares and the GPGPU textures are full:

| Tier    | N        | S     | Trigger                                              |
|---------|----------|-------|------------------------------------------------------|
| High    | `90,000` | `300` | desktop, `deviceMemory ≥ 8` or unknown, dpr-adjusted |
| Mid     | `40,000` | `200` | integrated GPU heuristic, or high tier stepped down  |
| Low     | `14,400` | `120` | `pointer:coarse`, or `hardwareConcurrency ≤ 4`       |

Override with `?particles=N` (rounded to the nearest square, clamped `[1024, 160000]`).

GPU heuristic: read the `WEBGL_debug_renderer_info` unmasked renderer string, match
against a short deny-list of known-slow integrated parts, combine with
`navigator.hardwareConcurrency`, `navigator.deviceMemory`, and `matchMedia('(pointer:coarse)')`.
Treat the heuristic as a *starting guess only* — the governor in §8.2 is the real
authority, and it is allowed to overrule the heuristic in either direction.

### 5.2 GPGPU layout

Two ping-pong RGBA float targets via `GPUComputationRenderer`:

```
texturePosition   xyz = world position        w = age  (0→1, drives twinkle + size jitter)
textureVelocity   xyz = velocity              w = seed (fixed per particle, hash(index))
```

Formation targets are **static** `DataTexture`s, generated once on a seeded PRNG,
never simulated:

```
uTargetA / uTargetB   xyz = target position   w = colour parameter (0→1)
```

Packing the colour parameter into `w` of the target means **colour needs no extra
texture and morphs for free** — the render shader reads
`mix(tA.w, tB.w, m)` and looks up the ramp. Do this; do not add a colour texture.

**Determinism.** All target generation and all per-particle seeds come from a
`mulberry32` PRNG seeded with the constant `0x5A79524E` (`"ZYRN"` in ASCII). The
field is byte-identical on every load at a given count. A brand's signature image
should not be a different image each visit.

### 5.3 Integration — per-second units, dt-correct

```glsl
float dt = min(uDt, 1.0/30.0);            // clamp: a stalled tab must not explode

vec3 target = morphTarget(tA, tB, uMix, seed);
vec3 acc  = (target - pos) * uSpring;
     acc -= vel * uDamping;
     acc += curl(pos * uNoiseScale + uTime * uNoiseSpeed) * uTurbulence;
     acc += pointerForce(pos);

vel += acc * dt;
pos += vel * dt;
```

Defaults: `uSpring = 9.0`, `uDamping = 5.2`. Critical damping at that spring is
`2·sqrt(9) = 6.0`, so 5.2 is deliberately **underdamped** — the field arrives with a
slight overshoot and settles, which is what makes a formation look *arrived at*
rather than *tweened to*. Never ship a critically damped field; it reads as dead.

All rates are per-second. Nothing in this shader may be tuned in per-frame units.

### 5.4 Morph — swarm, don't tween

```glsl
float w  = 0.45;                          // stagger window
float t0 = seed * (1.0 - w);              // per-particle start
float m  = smoothstep(t0, t0 + w, uMix);
vec3  p  = mix(A, B, m) + (B - A) * uOvershoot * sin(PI * m);   // uOvershoot ≈ 0.06
```

The seeded delay is what turns a transition into a swarm: at `uMix = 0.5` roughly
half the field has committed and half has not, so the shape *travels* instead of
sliding. The `sin(PI·m)` term adds a bulge that peaks mid-flight and is exactly zero
at both ends, so it can never disturb a settled formation.

### 5.5 Curl noise — analytic gradients, not finite differences

Curl of a 3-field noise vector needs the gradient of each component. The naïve
implementation samples each of 3 fields twice per axis: **18 noise evaluations per
particle per frame**, ×3 octaves = 54. At 90k that is 4.9M evaluations a frame and
it will not hold 60.

Use gradient-returning noise (`psrdnoise3` / Gustavson-style, value + analytic
`vec3` gradient in one call). Curl then costs **3 evaluations per octave**:

```glsl
// each call returns value and writes gradient into g
float nx = psrdnoise(p,            gx);
float ny = psrdnoise(p + OFF_1,    gy);
float nz = psrdnoise(p + OFF_2,    gz);
vec3 c = vec3(gz.y - gy.z, gx.z - gz.x, gy.x - gx.y);
```

Three octaves at frequency `1.0 / 2.1 / 4.3` and amplitude `1.0 / 0.5 / 0.25`.
That is 9 evaluations instead of 54 — an 83% cut in the dominant cost of the sim.
The governor's deepest step (§8.2) drops to a single octave.

### 5.6 Formations

**`S1 FIELD` — log-spiral.** 3 arms. Radius power-distributed toward the centre
(`r = R · pow(rand, 2.2)`), angle `θ = armOffset + k·log(r) + gaussianScatter(r)`
with scatter widening at radius. Gaussian height falloff, thinning outward.
8% of the population placed in a tight core sphere. Tilt 62°. Colour parameter =
`1 - normalizedRadius`, so the nucleus is Vapor and the rim is Steel.

**`S2 DISPERSE` — uniform random inside a large box**, colour parameter pushed low
and flat (everything reads Steel), overall alpha reduced ~35%. Entropy should look
*dimmer*, not just wider. This is the argument.

**`S3 CORE` — parametric torus** `R=1.6, r=0.75` with per-particle jitter on both
angles, surface displaced along its normal by the same 3-octave curl field sampled
at a slower `uNoiseSpeed`. Colour parameter = `v` (the minor angle), so the ring
runs Steel at the top edge to Pulse toward the underside, Vapor where the surface
faces the camera.

**`S4 RELEASE` — sparse spherical shell**, large radius, tiny point sizes, a small
constant downward velocity bias, and a slow per-particle twinkle driven by the age
channel. Colour parameter low and slightly randomised.

### 5.7 Render

`THREE.Points`, custom `ShaderMaterial`:

```
blending:   AdditiveBlending
depthWrite: false
depthTest:  false        // additive is order-independent; skip the sort entirely
transparent:true
```

Vertex — depth attenuation, size jitter from seed, and the faux depth-of-field:

```glsl
float dist  = -mvPosition.z;
float coc   = abs(dist - uFocal);                       // circle of confusion
float size  = uSize * jitter * (uAttenuation / dist);
      size *= 1.0 + coc * uDofSpread;                   // out of focus → larger
float alpha = uAlpha / (1.0 + coc * coc * uDofFade);    // and dimmer
```

`uFocal` is per-formation and eased with the morph, so the plane of focus travels
with the shape.

Fragment — gaussian soft disc, **no texture, no `smoothstep` ring**:

```glsl
vec2  d  = gl_PointCoord - 0.5;
float r2 = dot(d, d);
if (r2 > 0.25) discard;
float a = exp(-r2 * uFalloff) - exp(-0.25 * uFalloff);  // exactly 0 at the edge
gl_FragColor = vec4(vColor * vAlpha * a, 1.0);
```

Subtracting the edge value is what removes the faint hard rim that a plain gaussian
leaves on additive points. It costs one constant-folded `exp`.

### 5.8 Background shader

Never a flat clear colour. A fullscreen triangle behind the points:

- Radial vignette, Obsidian `#0E0F12` centre → Obsidian-2 `#08090B` at the corners.
- Two soft, slowly drifting fog blobs on **coprime periods** (so they never re-sync):
  a Pulse-tinted one upper-left at ~0.03 alpha, a Steel-tinted one lower-right at
  ~0.025 alpha. Periods 71 s and 97 s.
- Dithered with an 8×8 ordered Bayer matrix at 1/255 amplitude. Without it, a
  near-black radial gradient bands visibly on 8-bit panels — and banding on the
  background of a page whose entire argument is rendering quality is fatal.

---

## 6. Interaction — reading presence

### 6.1 Pointer

Project the pointer to a **ray**, not a point, and measure each particle's distance
to that ray. A point-based falloff produces a sphere of influence; a ray produces a
channel driven through the full depth of the field — which is what makes a fast
swipe across the tilted spiral read as *tearing* rather than *poking*.

```
d        = distanceToRay(pos, rayOrigin, rayDir)
falloff  = 1.0 - smoothstep(0.0, uPointerRadius, d)     // uPointerRadius ≈ 0.9
away     = normalize(pos - closestPointOnRay)
swirl    = normalize(cross(rayDir, away))               // tangential vortex
gain     = clamp(0.25 + pointerSpeed * uSpeedGain, 0.25, 3.0)
force    = falloff * gain * (uRepel * away + uVortex * swirl) * uPointerMode
```

Pointer speed is an exponentially smoothed magnitude of the NDC delta per second,
so a fast swipe genuinely does more than a slow drift — the gain term is the whole
difference between "reads presence" and "has a mouse handler".

### 6.2 Dwell

Pointer still (< 0.02 NDC/s) for **700 ms** → `uPointerMode` eases `+1 → −1` over
400 ms. Repulsion becomes attraction. While attracting:

- radius pulses `uPointerRadius · (1 + 0.18·sin(2π·t / 2.4))`
- a `uDwellGlow` term lifts alpha and pushes colour parameter toward the nucleus
  for particles inside the radius

On the next movement, `uPointerMode` snaps to `+1` with a one-shot impulse ~1.8× the
steady repulsion, decaying over 300 ms — the gathered clump bursts rather than
leaking. Attraction that releases limply undoes the whole effect.

### 6.3 Scroll

Lenis drives ScrollTrigger via `scrollerProxy`. Normalized progress `0 → 1`:

| Progress    | Transition           | Behaviour                                                    |
|-------------|----------------------|--------------------------------------------------------------|
| `0.00–0.18` | `S1 FIELD` hold      | idle rotation 90 s/rev, pointer parallax                      |
| `0.18–0.38` | `S1 → S2 DISPERSE`   | turbulence spikes to **3.2×** at `t=0.5` then decays to 1.0×  |
| `0.38–0.56` | `S2 → S3 CORE`       | gather; spring eased up 15% so arrival feels intentional      |
| `0.56–0.78` | `S3 CORE` hold       | ripple amplitude modulated by scroll velocity                 |
| `0.78–1.00` | `S3 → S4 RELEASE`    | melt downward, small gravity bias, sizes shrink               |

Scroll velocity (signed, smoothed, clamped to `±1`) feeds:
turbulence (clamped additive), camera roll (±0.6°), and the readout rail. Fast
scrolling must visibly stir the field — that is the third presence signal, and it
is the one most sites throw away.

**Reversibility is a hard requirement.** Every transition is a pure function of
progress. No `once:true`, no state accumulated across direction changes, no
one-shot GSAP tweens on the sim uniforms. Scrub up and the system reassembles.

### 6.4 Camera and idle

Subtle dolly and tilt by progress; ±2° pointer parallax, critically damped.
On mobile add `deviceorientation` parallax at half gain, behind a permission-safe
feature check.

**Idle state:** after 12 s with no pointer, scroll, or key event, the field eases
into a resting signature — turbulence to 0.6×, rotation to 0.7×, a slow 18 s
breathing scale of ±1.5%. Any input restores it over 800 ms. A field that is
identical whether or not anyone is there cannot claim to read presence.

### 6.5 Typography motion

Headlines reveal on section enter: opacity `0 → 1`, `filter: blur(6px) → 0`,
`translateY(14px → 0)`, per-line stagger 90 ms, `power3.out` over 900 ms. Mono
metadata reveals with the existing `data-reveal` / `data-rdelay` mechanism from
v1.0 — reuse it, do not invent a second reveal system.

The hero wordmark keeps the v1.0 behaviour exactly: aligned at rest, shears apart
on the first scroll gesture, **latches permanently**, glitch wrapper on top.

### 6.6 Text legibility — the contradiction resolved

The source brief says *"particles may pass in front of text; do not mask"* and also
*"text contrast ≥ 4.5:1"*. Additive light accumulating behind Vapor type **lowers**
contrast, so as written these two requirements cannot both hold.

Resolution: particles still pass in front, but are attenuated over glyph regions.

Upload up to **6 text rectangles in NDC** as a `vec4[6]` uniform (recomputed on
resize and section change only — no per-frame work, no texture upload). In the
vertex shader:

```glsl
float k = 0.0;
for (int i = 0; i < 6; i++) k = max(k, boxFalloff(ndc, uTextRects[i]));
alpha *= mix(1.0, uKeepoutFloor, k);          // uKeepoutFloor ≈ 0.22
```

`boxFalloff` is a smoothstepped inset box so the attenuation has a soft ~4% margin
and no visible edge. The field visibly crosses the type; it just stops blowing it
out. Measure the result — do not assume it passes.

If the rect count ever needs to exceed 6, switch to a 128×72 R8 keep-out texture
rebuilt on layout change. Do not raise the loop bound.

---

## 7. Accessibility

**`prefers-reduced-motion: reduce`** — the narrative survives, the violence does not:

- formations still morph on scroll (the page would be incoherent otherwise), but
  durations ×2, `uOvershoot = 0`, and the `S2` turbulence spike is removed entirely
- pointer forces, vortex, and dwell disabled
- idle rotation only, at 0.5× speed; no breathing, no camera dolly, no parallax
- ticker and marquee static
- honoured **live** via a `matchMedia` change listener, not just at load

**No WebGL / context lost** — the page is progressive enhancement, not a canvas app.
All copy ships in the HTML. On failure: remove the canvas, paint flat Obsidian plus
the hairline grid, and the page reads as a clean typographic landing. Test it by
forcing the failure path with `?nogl=1`.

**Keyboard and semantics** — real `<nav>` / `<main>` / `<section>` / `<footer>`,
one `<h1>`, `<button>` and `<a>` for anything interactive, visible Vapor focus rings
at 2px offset, skip-link to `<main>`, canvas `aria-hidden="true"`. The stats strip
is a `<dl>`, with `aria-live="off"` — a screen reader must not announce the FPS
counter sixty times a second.

Contrast: Vapor on Obsidian is ~15:1 and safe. Steel `#767E8C` on Obsidian is
~4.9:1 — passes for the 11px mono, but only while the field behind it is attenuated.
This is exactly what §6.6 protects; verify Steel metadata over the brightest part of
`S1`, not over empty background.

---

## 8. Performance

### 8.1 Budget

60 fps at 90k on an M1 MacBook Air, **≤ 8.5 ms** render block. Note the real
constraint: at 90k additive points with dpr 2 on a retina panel, this is
**fill-rate bound, not particle-count bound.** Consequences that must be respected:

- dpr capped at **2.0** desktop / **1.5** coarse-pointer
- point size hard-clamped in the vertex shader (`min(size, uMaxSize)`, ~48 px) —
  one under-focus particle covering a quarter of the screen at 90k instances is how
  this design dies
- bloom's internal chain runs at **half** the render resolution
- `powerPreference: 'high-performance'`, `antialias: false` (pointless for additive
  points, and expensive)

### 8.2 Adaptive quality governor

Static device heuristics guess wrong constantly. Measure instead.

Rolling median of the last 60 render-block durations. If it exceeds **9.5 ms** for
90 consecutive frames, step **down** one rung:

```
1. bloom off
2. dpr × 0.8
3. particle count × 0.6  (one debounced reallocation, targets regenerated)
4. curl octaves 3 → 1
```

Step **up** only after **10 s** continuously under 6.5 ms, one rung at a time, and
never more than once per rung per session — hysteresis, so a page that steps down
cannot oscillate.

**The governor is wired to the stats strip and to the headline.** If it drops to
40k, cell 1 reads `040,000` and the hero reads *"Forty thousand parts."* Honesty
under degradation is the point of Departure 5; a stat that lies when the machine
struggles is worse than no stat.

### 8.3 Discipline

- **Zero per-frame allocation.** Pre-allocate every `Vector3`, `Matrix4`, `Ray`, and
  array at init. No object literals, no `.clone()`, no closures created in the loop.
  Verify with a 60 s DevTools allocation profile showing a flat sawtooth-free heap.
- Resize debounced 150 ms; the canvas is *not* re-created, only the render targets.
  Apply the v1.0 mobile URL-bar damping — ignore height-only changes under 120 px.
- `document.visibilitychange` → cancel rAF entirely and reset `uTime` accumulation
  on resume so a backgrounded tab does not return to a 40-second dt.
- Uniform writes batched; never call `getUniformLocation` in the loop.

### 8.4 Cold start — defined precisely

`t0` = navigation start. `t1` = the first frame where **all** of: fonts loaded, at
least one sim step executed, and the field has reached ≥ 95% settle toward `S1`
(mean `|target − pos|` below threshold). Report `t1 − t0` in seconds, one decimal.

Typography paints immediately at `t0`; the sim starts after fonts resolve. The
number reported is the honest one, including the font wait.

---

## 9. Debug and capture

`?debug` — lazy-loads lil-gui. Folders:

```
SIM        particleCount · spring · damping · turbulence · noiseScale · noiseSpeed · overshoot
POINTER    radius · repel · vortex · speedGain · dwellDelay · dwellPulse
COLOUR     uRamp0..3 (colour pickers) · uRampPos · uAlpha · uSize · uMaxSize
DOF        focal · dofSpread · dofFade
POST       bloomStrength · bloomRadius · bloomThreshold · bloomEnabled
STATE      formation override (S1/S2/S3/S4) · mix scrub · freeze · governor rung
```

Plus two capture affordances that exist specifically for this machine's verification
traps (see the project memory and `CLAUDE.md`):

- **`?freeze=S3&mix=1`** — pin a formation, disable rAF advancement after N settle
  steps, and render one deterministic frame. `--virtual-time-budget` races through
  animations before any screenshot lands; a static capture mode is the only reliable
  way to shoot this page headlessly. Build it in from the start, not after the first
  failed screenshot.
- **`?probe=1`** — after 300 frames, `console.log` a JSON report:
  `{count, medianMs, p95Ms, fps, coldStartS, governorRung, dpr, renderer}`.
  This is the acceptance harness; run it on the phone too.

Also honour **`?coarse=1`** exactly as v1.0's `main.js` does — force the mobile path
on desktop for testing.

---

## 10. Acceptance

Every line here is checkable. Do not report done on any of them by inspection.

1. `S1` rotates and parallaxes; the wordmark shears on first scroll and stays sheared.
2. A fast pointer swipe tears a visibly swirling channel; a slow drift barely ripples.
   The difference must be obvious in a side-by-side capture.
3. Pointer still for 700 ms gathers particles with a visible pulse; moving releases
   with a burst.
4. Scrolling produces `S1 → S2 → S3 → S4` smoothly **and reversibly** — scrub to
   1.0 and back to 0.0 and the spiral is intact.
5. `S3` ripples continuously without scroll input.
6. All four stats are live and change under load; forcing a governor step-down
   changes both cell 1 and the hero headline.
7. `?probe=1` reports median ≤ 8.5 ms at 90k on the reference machine, and the page
   degrades to a stable tier on a mid-range Android rather than dropping frames.
8. Pulse appears in the field, and in the DOM **only on the mark** — the seam, the
   monogram seam and the glitch slice, all via `--pulse-mark` (Departure 4 as
   amended 2026-08-17). No button, rule or hover state prints it. Grep the CSS for
   `6E56F8`: permitted hits are shader/uniform definitions and the `--pulse-mark`
   token.
9. Only Space Grotesk and IBM Plex Mono load. No Bodoni, no third face.
10. Steel mono metadata over the brightest region of `S1` measures ≥ 4.5:1.
11. `?nogl=1` yields a complete, readable, well-set typographic page.
12. `prefers-reduced-motion` yields the full narrative with no explode, vortex, or dwell.
13. 60 s allocation profile is flat.
14. No console errors or warnings on load, on resize, or on tab-restore.

---

## 11. Build order — gates, not a wishlist

Do not proceed past a gate until its exit criterion is measured.

| Phase | Work | Exit criterion |
|---|---|---|
| **1** | Renderer, background shader, static 90k `S1` from a `DataTexture`. No sim. | 60 fps at 90k, `?probe=1` median ≤ 4 ms. **If this fails, nothing later can succeed.** |
| **2** | GPUComputationRenderer, integration, curl noise, settle to `S1`. | Field settles and holds; median ≤ 6.5 ms. |
| **3** | Pointer ray, repulsion, vortex, speed gain, dwell. | Acceptance 2 and 3 pass. |
| **4** | Targets for `S2/S3/S4`, morph with seeded stagger, Lenis + ScrollTrigger. | Acceptance 4 and 5 pass, including the reverse scrub. |
| **5** | All typography, nav, stats strip, readout rail, ticker, reveals. | Acceptance 6, 9, 10, 11, 12 pass. |
| **6** | Bloom, DOF tuning, keep-out rects, idle state, governor. | Full acceptance list. |

Ship nothing between phases. Phase 1's gate is the honest one — a 90k additive
point cloud that cannot hold 60 fps *before* a sim, pointer, post-processing, and
DOM are added is not going to hold it afterwards.

---

## 12. Which uniforms actually own the feel

To be written at the end of the build with measured values, but the prediction —
worth checking against, because being wrong here means the tuning went somewhere
unexpected:

1. **`uDamping` relative to `2·sqrt(uSpring)`** — the single biggest lever. The gap
   between the two *is* the character. Nothing else makes the field feel alive or dead.
2. **`uPointerRadius` × `uSpeedGain`** — owns whether the page reads as responsive
   or as decorative. Too small and nobody notices; too large and every twitch is a
   catastrophe.
3. **The morph stagger window `w`** — 0.0 is a tween, 0.45 is a swarm, 0.9 is mush.
4. **`uRampPos`** — where Pulse sits on the ramp decides whether the field looks
   like Zyrn or like a generic nebula. Expect this to need the most iterations.
5. **`uMaxSize`** — invisible until it isn't; the difference between 60 fps and 22.

---

## 13. Open, carried from v1.0

Unchanged by this spec and still outstanding:

- No proof anywhere — no case study, metric, or named engagement. Six pages of
  claims, and this would be a seventh surface making a claim about capability with
  nothing behind it. Still the first thing a CIO looks for.
- Four sourced third-party statistics await sign-off (`docs/strategy.md`).
- `Journal` unrouted; `access@zyrn.co` is a placeholder with no registered domain.
- No favicon — the Z monogram (two-half clip, seam) is the obvious answer, and
  under Departure 4 its seam is Vapor on this surface but stays Pulse elsewhere.

**Closed by this spec:** `TODO(asset)` — there is no hero video to source. The page
renders its own subject.
