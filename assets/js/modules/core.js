/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE CORE  (services.html)

   The other four instruments each argue for one line. This one argues for
   the SET: a closed core that partitions into four lines, extends them far
   enough to be engaged separately, then pulls them back onto a rim they
   now share. It is the same three-beat move the field makes on this page
   (S3 → S1 → S3), told once in the DOM so the bed and the diagram are
   making the same point at the same moment.

   Everything is a transform or an opacity written to a CSS custom
   property. No layout in the frame loop, no canvas — there is already a
   90k-particle simulation on this page and it gets the GPU.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, swapText, pad3, REDUCED } from './_track.js';

const STAGES = [
  ['01 — CORE',
   'One system, before it is four lines. Everything Zyrn runs is a partition of the same operating core, which is why the lines share a diagnostic, a vocabulary, and a measurement layer.'],
  ['02 — SEPARATION',
   'The core partitions. Four gaps open where the lines will run — not four departments, four cuts through the same body of work.'],
  ['03 — FOUR LINES',
   'Each line reaches far enough to be engaged on its own terms, with its own diagnostic and its own deliverable. Any one of them is a complete engagement.'],
  ['04 — LOAD',
   'Run one and you get a good answer to one question. The other three keep asking theirs regardless — which is why single-line engagements plateau at the boundary of what they were allowed to touch.'],
  ['05 — OPERATING CORE',
   'Run together and the lines stop behaving like services. Decision rights shape the surface, the surface is measured, the measurement feeds the model, and the model changes who decides. That loop is the product.'],
];

/* stage boundaries — the fifth runs to 1.0 */
const CUTS = [0.16, 0.36, 0.58, 0.80];

/* ── easing ──────────────────────────────────────────────────────────
   A plain linear ramp between two scroll positions makes the arms look
   like they are being dragged. `ramp` is a smoothstep window: 0 before
   `a`, 1 after `b`, eased between. Every motion below is built from it. */
const ramp = (p, a, b) => {
  const t = Math.min(1, Math.max(0, (p - a) / Math.max(1e-5, b - a)));
  return t * t * (3 - 2 * t);
};

export function initCore() {
  const root = document.getElementById('sigCore');
  if (!root) return;

  const track = root.querySelector('.sig__track');
  const rig   = root.querySelector('.core');
  const step  = document.getElementById('coreStep');
  const pct   = document.getElementById('corePct');
  const note  = document.getElementById('coreNote');
  const nodes = [...root.querySelectorAll('.corenode')];
  const arms  = [...root.querySelectorAll('.corearm')];
  if (!rig) return;

  let stage = -1;

  function draw(p) {
    /* the ring: closes, opens into four arcs, half-closes again */
    const open   = ramp(p, 0.13, 0.32) - 0.72 * ramp(p, 0.84, 1.0);
    const shrink = 1 - 0.40 * ramp(p, 0.10, 0.36) + 0.15 * ramp(p, 0.82, 1.0);

    /* one slow rotation across the whole track. Small on purpose: the
       diagram has to stay readable while it moves, and a fast spin makes
       the four labels chase each other. */
    const spin = -10 + 19 * p;

    rig.style.setProperty('--open',  open.toFixed(4));
    rig.style.setProperty('--ring',  shrink.toFixed(4));
    rig.style.setProperty('--spin',  spin.toFixed(2) + 'deg');
    rig.style.setProperty('--load',  ramp(p, 0.58, 0.76).toFixed(4));
    rig.style.setProperty('--hold',  ramp(p, 0.86, 1.0).toFixed(4));
    rig.style.setProperty('--hub',   (1 - 0.34 * ramp(p, 0.12, 0.34)).toFixed(4));

    /* the four lines extend in sequence, then give a third of it back so
       they end held against the rim rather than flung away from it */
    const retract = 0.32 * ramp(p, 0.82, 1.0);
    for (let i = 0; i < 4; i++) {
      // stage 03 runs 0.36–0.58 and is the one that says "four lines", so
      // the fourth line has to be fully out before 0.58 — not still arriving
      const a = 0.23 + i * 0.045;
      const r = ramp(p, a, a + 0.20) * (1 - retract);
      // the card fades in only once its line is roughly half out —
      // starting both at `a` made all four labels appear stacked on
      // the hub before anything had moved
      const o = ramp(p, a + 0.07, a + 0.17);
      if (arms[i])  arms[i].style.setProperty('--r', r.toFixed(4));
      if (nodes[i]) {
        nodes[i].style.setProperty('--r', r.toFixed(4));
        nodes[i].style.setProperty('--o', o.toFixed(3));
      }
    }

    if (pct) pct.textContent = pad3(p);

    /* stage text — index by boundary, not by floor(p * n), because the
       five stages are deliberately uneven lengths */
    let s = 0;
    while (s < CUTS.length && p >= CUTS[s]) s++;
    if (s !== stage) {
      stage = s;
      rig.setAttribute('data-stage', String(s + 1));
      swapText(step, STAGES[s][0]);
      swapText(note, STAGES[s][1]);
    }
  }

  if (REDUCED) {
    /* no scroll binding under reduced motion: show the resolved state, the
       one the copy is actually about, and leave it there */
    draw(0.93);
    return;
  }
  onTrack(track, draw);
}
