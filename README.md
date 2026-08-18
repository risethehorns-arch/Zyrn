# ZYRN

Brand site for Zyrn — an org-engineering firm working across human capital,
business structuring, AI transformation, and web & strategy. Amman, JO.

> **Organizations, engineered.**

## What this is

Six static pages with no build step. Open `index.html` and it runs.

The bed on every page is **SYS.07**, a 90,000-point GPU particle simulation.
There is no video and no image asset anywhere on the site — the page renders
its own subject. Scroll drives it through four states, and on the landing page
those states carry the argument:

| State | Shape | What it says |
|---|---|---|
| `S1 FIELD` | tilted four-arm log spiral | The organization as found. Structure exists, but it is emergent. |
| `S2 DISPERSE` | scattered field, dimmed | Entropy. The same parts, no system. |
| `S3 CORE` | rippling torus | The engineered operating loop. Closed, continuous, breathing. |
| `S4 RELEASE` | drifting starfield | Self-calibrating. It holds without the field driving it. |

Each page runs its own program over those states and its own tilt and spin, so
moving between pages reads as one instrument changing channels. Navigation is
continuous: clicking through morphs the field to whatever the destination opens
on, fades only the content, and the incoming page builds its particles already
settled there. The bed never blinks.

## The service lines

Four, each with an instrument you drive by scrolling:

| | Line | Instrument |
|---|---|---|
| 01 | Website design | a surface assembling itself — structure, hierarchy, type, system, live |
| 02 | Brand kit | the kit applied to itself; the chips and the mark are the real ones |
| 03 | Business structuring | decision rights rewired from the published chart to authority at the work |
| 04 | AI adoption & transformation | the readiness index climbing 00 to 04, constraint named |

## Layout

```
index.html              landing — five scenes, SYS.01 hero to SYS.05 access
brand.html              the brand system, as a document
services/*.html         one page per service line, each with its own instrument
assets/js/field.js      the simulation: GPGPU sim, shaders, formations, governor,
                        and the page-to-page continuity handoff
assets/js/modules/      the signature instruments (build, specimen, graph,
                        readiness) plus their shared scroll plumbing
assets/js/main.js       DOM runtime — the shear, the readout rail, reveals
assets/js/ui.js         the glitch scheduler
assets/css/styles.css   tokens and base system
assets/css/field.css    the field's page layer
assets/css/svc-modules.css  the instruments
docs/                   the build spec, the field spec, positioning research
design/                 source of record from Claude Design (reference only)
CLAUDE.md               the operative rules — read before any visual change
```

## Running it locally

Any static server. From the project root:

```
python -m http.server 8000
```

Then `http://localhost:8000/index.html`.

## URL flags

Useful for development and for verifying the simulation, which is otherwise
hard to inspect because it is always in motion:

| Flag | Effect |
|---|---|
| `?debug` | full uniform GUI (spring, damping, turbulence, ramp, bloom, DOF) |
| `?probe=1` | logs a JSON perf report — real GPU ms, p95, fps, cold start |
| `?freeze=S1\|S2\|S3\|S4` | pin one formation and latch it, for capture |
| `?p=0.42` | pin scroll progress |
| `?particles=N` | override the particle count |
| `?coarse=1` | force the mobile path on desktop |
| `?nogl=1` | force the no-WebGL fallback |

## Performance

The count is chosen per device — 90,000 / 40,000 / 14,400 — and then an
adaptive governor measures real GPU time and steps quality down if it has to:
bloom off, then dpr, then particle count, then noise octaves, with hysteresis
so it cannot oscillate.

Every number in the hero's stats strip is measured off the running simulation.
If a value cannot be measured it shows an em dash, never a plausible constant.
When the governor steps the field down, the live count in the hero changes with
it.

## Accessibility

The page is progressive enhancement, not a canvas app: all copy ships in the
HTML, so with no WebGL it reads as a clean typographic site. `prefers-reduced-
motion` keeps the narrative and removes the violence — no explode, no vortex,
no dwell, no glitch. Particles are attenuated behind text so additive light can
never drop contrast below the threshold.

## Licence

All rights reserved. Zyrn brand, copy, and design system.
