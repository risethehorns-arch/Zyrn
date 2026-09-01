/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE STACK   (services/website-design.html)

   A finished page, taken apart into the six layers it is made of, held
   apart while each one is named, and put back together.

   This replaces `build.js`, which assembled a wireframe through five CSS
   stages. That was the right argument made small: it showed blocks arriving
   in an order. The argument this page actually makes is that a surface is a
   SYSTEM — a grid, a structure, a type scale, a token set, a motion spec
   and the finished composite, each of which is written down and each of
   which can be counted. So the instrument shows all six at once, in depth,
   and prints what each one costs.

   Everything moving here is a transform or an opacity. The whole stack is
   six absolutely-positioned siblings in one `preserve-3d` scene, so a frame
   is six compositor transforms and no layout at all. Nothing in it can
   change the size of anything, which is the standing rule after the pinned
   instrument that had to be deleted from axes.html.

   The last layer's readout is not typed into the page: `field.js` writes the
   live median frame time and fps into `#sMs` and `#sFps` wherever it finds
   them, so the MEASUREMENT row is measuring the page you are reading.
   Doctrine rule 2 — the only decoration is real information.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, onNear, swapText, pad3, REDUCED } from './_track.js';

/* Eight beats. The six middle ones are the layers, bottom to top, so the
   sequence reads as the order the thing was actually built in. */
const BEATS = [
  ['00 — THE SURFACE',
   'This is the page as anyone arrives at it. Everything after this is what it is made of, and every one of those things is written down somewhere a developer can read.'],
  ['01 — GRID',
   'Twelve columns and a gutter, decided before a single block is placed. A grid is not a drawing aid; it is the reason two people can build different pages that still look like the same firm.'],
  ['02 — STRUCTURE',
   'Blocks placed by what the page has to prove, in the order it has to prove it. Seven of them here. The hierarchy is a decision, not an outcome of how long the copy turned out.'],
  ['03 — TYPE',
   'Two families and four weights, on a scale with numbers rather than adjectives. The copy is written to the structure, not poured into it.'],
  ['04 — COLOUR',
   'Five tokens, and exactly one of them is allowed to be loud. Every component reads them; none carries a colour of its own — which is why Lumina’s whole palette could be replaced in one commit without a component being rebuilt.'],
  ['05 — MOTION',
   'One curve and three durations, written down like any other token. Motion that is specified can be reviewed, reused and turned off; motion that is improvised per component cannot.'],
  ['06 — MEASUREMENT',
   'Frame time and payload are acceptance criteria, not a pass at the end. The two numbers on that row are being read off this page as you scroll it, not typed into it.'],
  ['07 — HANDED OVER',
   'Back to one surface. The difference between this page and a picture of a page is that every layer under it has a name, a number and a file — so the team can extend it without calling us.'],
];

const N_LAYERS = 6;

const ramp = (p, a, b) => {
  const t = Math.min(1, Math.max(0, (p - a) / Math.max(1e-5, b - a)));
  return t * t * (3 - 2 * t);
};

/* the score, in track progress */
const OPEN_A = 0.08, OPEN_B = 0.30;    // the stack tips and comes apart
const WALK_A = 0.32, WALK_B = 0.80;    // held apart, one layer named at a time
const SHUT_A = 0.84, SHUT_B = 0.96;    // back together

export function initStack() {
  const sec   = document.getElementById('sigStack');
  const stk   = document.getElementById('stk');
  const scene = document.getElementById('stkScene');
  if (!sec || !stk || !scene) return;

  const stepEl = document.getElementById('stkStep');
  const noteEl = document.getElementById('stkNote');
  const pctEl  = document.getElementById('stkPct');
  const keyEl  = document.getElementById('stkKey');
  const rows   = keyEl ? Array.prototype.slice.call(keyEl.children) : [];
  const layers = Array.prototype.slice.call(scene.querySelectorAll('.stk__l'));

  const track = sec.querySelector('.sig__track');
  let shown = -1;

  function beat(i) {
    if (i === shown) return;
    shown = i;
    swapText(stepEl, BEATS[i][0]);
    swapText(noteEl, BEATS[i][1]);
    /* Layer 0 of the stack is beat 1, so the key row is the beat minus one.
       Beats 0 and 7 are the closed surface and light nothing. */
    const lit = (i >= 1 && i <= N_LAYERS) ? i - 1 : -1;
    rows.forEach((r, k) => r.classList.toggle('is-on', k === lit));
    layers.forEach((l, k) => l.classList.toggle('is-lit', k === lit));
    stk.dataset.act = String(lit);
  }

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);

    /* One number opens and closes the whole thing. `open` is 0 when the
       stack is one flat surface and 1 when it is fully apart, and every
       other property is derived from it — so the tip, the separation, the
       edge lighting and the shadow can never disagree with each other. */
    const open = ramp(p, OPEN_A, OPEN_B) - ramp(p, SHUT_A, SHUT_B);

    stk.style.setProperty('--open', open.toFixed(4));

    /* The camera, and it moves BEFORE the stack does. Driven off `--open`
       alone the widest moment of the instrument is early in the tip —
       barely scaled down, already rotated a few degrees on Z, which adds
       the box's width to its height. rigfit measured that transient 14px
       into the note at 1920x1080. Pulling back first removes it, and the
       move reads as a camera taking in something about to happen. */
    const squeeze = ramp(p, 0.045, 0.170) - ramp(p, 0.900, 0.985);
    stk.style.setProperty('--squeeze', squeeze.toFixed(4));

    /* A slow drift while it is held apart, so the stack is alive rather
       than parked. Amplitude scales with `open`, so it cannot wobble a
       surface that is supposed to be lying flat. */
    const t = performance.now() / 1000;
    const drift = Math.sin(t * 0.36) * 2.6 * open;
    stk.style.setProperty('--drift', drift.toFixed(3));

    /* Which layer is being named. The walk runs bottom to top — grid first,
       finished surface last — because that is the order it was built in. */
    if (p < OPEN_A) beat(0);
    else if (p >= SHUT_A) beat(7);
    else {
      const w = Math.min(0.9999, Math.max(0, (p - WALK_A) / (WALK_B - WALK_A)));
      beat(1 + Math.floor(w * N_LAYERS));
    }
  }

  if (REDUCED) {
    /* Held open at the middle layer: the whole argument is that there are
       six of these, and that is legible standing still. No drift. */
    stk.style.setProperty('--open', '1');
    stk.style.setProperty('--squeeze', '1');
    stk.style.setProperty('--drift', '0');
    if (pctEl) pctEl.textContent = '000';
    beat(3);
    return;
  }
  onTrack(track, draw);
  /* ── THE ROOM ────────────────────────────────────────────────────
     Runs every frame while the section is near, whether or not the page
     moved — the lean has to keep easing while the reader holds still,
     which is exactly when a progress-only callback stops being called. */
  onNear(track, (p, room) => {
    const live = Math.min(1, Number(stk.style.getPropertyValue('--open')) || 0);
    stk.style.setProperty('--px', (room.px * live).toFixed(4));
    stk.style.setProperty('--py', (room.py * live).toFixed(4));
    stk.style.setProperty('--lean', (room.vel * live).toFixed(4));
  });
}
