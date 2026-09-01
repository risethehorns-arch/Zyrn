/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE ORBIT   (services.html)

   One core, five things in orbit around it, and a scroll that takes you
   round the ring once.

   This replaces `core.js`, which drew four arms on a flat circle. That
   was the right argument in two dimensions: a core partitions, the parts
   reach out, they end held against a shared rim. What it could not do was
   carry the fifth thing — the CRM is not a line, it is what the lines
   SHIP — and a flat diagram has nowhere to put "this one came from the
   middle".

   In three dimensions it does. The five ride a tilted ring; the ring
   turns as you scroll; whichever is at the front is named. And at the
   end the fifth leaves the ring and travels to the centre, because that
   is literally where it comes from.

   ── HOW THE 3D IS BUILT ─────────────────────────────────────────────
   The scene carries the TILT. Each node carries the SPIN, because a node
   has to undo both to keep its label facing the reader:

       rotateY(a + spin)        out to its own angle on the ring
       translateZ(radius)       along it
       rotateY(-(a + spin))     turn back to face the camera
       rotateX(-tilt)           and stand up out of the tilted plane

   Depth cueing is the one thing CSS cannot do here — nothing in a
   stylesheet can read a computed Z — so the module writes each node's
   own cos(theta) as `--z` and the sheet derives opacity, scale and blur
   from it. Five elements, two properties each, per frame.

   Everything is a transform or an opacity. No layout in the frame loop.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, onNear, swapText, pad3, REDUCED } from './_track.js';

const N = 5;

/* Eight beats. Five of them are the offerings, named as each comes to
   the front of the ring — so the order you read them in is the order the
   orbit brings them, not an order somebody typed. */
const BEATS = [
  ['00 — ONE CORE',
   'Everything Zyrn runs is a partition of the same operating core. That is not a tidy way of describing four services; it is why they share a diagnostic, a vocabulary and a measurement layer, and why running two of them costs less than twice one.'],
  ['01 — IT PARTITIONS',
   'Five gaps open where the work will run. Not five departments — five cuts through one body of work, which is why the seams are where they are and not somewhere more convenient.'],
  ['02 — WEBSITE DESIGN',
   'The surface a firm is judged by before anyone speaks to it. Built as a system, held to a frame budget, and handed over so the team can extend it without calling us.'],
  ['03 — BRAND KIT',
   'A set of decisions, written down to the value rather than to the mood. One document, five panels, every value on it counted — so it survives the people who made it.'],
  ['04 — BUSINESS STRUCTURING',
   'Decision rights before org charts. Where authority actually sits, what it owns, and which incentives are quietly working against it.'],
  ['05 — AI ADOPTION',
   'An operating-model problem wearing a technology costume. The model is rebuilt first and the tooling follows it, which is the reason the work survives contact with the pilot.'],
  ['06 — THE CRM THEY SHIP',
   'Not a fifth line. The artefact the other four produce — a desk built to the firm rather than rented from a vendor, handed over as source. Watch where it goes.'],
  ['07 — THE OPERATING CORE',
   'Run one and you get a good answer to one question. Run them together and they stop behaving like services: decision rights shape the surface, the surface is measured, the measurement feeds the model, and the model changes who decides. That loop is the product, and the desk in the middle is where it is kept.'],
];

/* the score */
const OPEN_A = 0.055, OPEN_B = 0.175;   // the ring appears and partitions
const OUT_A  = 0.175, OUT_B  = 0.315;   // the five travel out to the rim
const RUN_A  = 0.315, RUN_B  = 0.835;   // one full turn, naming as it goes
const HOME_A = 0.855, HOME_B = 0.965;   // the fifth leaves for the centre

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const ramp = (p, a, b) => {
  const t = clamp01((p - a) / Math.max(1e-5, b - a));
  return t * t * (3 - 2 * t);
};

export function initOrbit() {
  const sec = document.getElementById('sigOrbit');
  const rig = document.getElementById('orb');
  const scene = document.getElementById('orbScene');
  if (!sec || !rig || !scene) return;

  const track  = sec.querySelector('.sig__track');
  const stepEl = document.getElementById('orbStep');
  const noteEl = document.getElementById('orbNote');
  const pctEl  = document.getElementById('orbPct');
  const keyEl  = document.getElementById('orbKey');
  const rows   = keyEl ? Array.prototype.slice.call(keyEl.children) : [];
  const nodes  = Array.prototype.slice.call(scene.querySelectorAll('.orb__n'));
  const spokes = Array.prototype.slice.call(scene.querySelectorAll('.orb__sp'));
  if (nodes.length !== N) return;

  /* Angles are authored here rather than in the markup because the RING
     has to agree with them — the node at index i and the spoke at index i
     are the same ray, and two places to type 72 degrees is one place for
     them to drift apart. */
  const ANGLE = [];
  for (let i = 0; i < N; i++) ANGLE.push((360 / N) * i);
  nodes.forEach((el, i) => el.style.setProperty('--a', ANGLE[i] + 'deg'));
  spokes.forEach((el, i) => el.style.setProperty('--a', ANGLE[i] + 'deg'));

  let shown = -1;
  function beat(i) {
    if (i === shown) return;
    shown = i;
    swapText(stepEl, BEATS[i][0]);
    swapText(noteEl, BEATS[i][1]);
    const lit = (i >= 2 && i <= 6) ? i - 2 : -1;
    rows.forEach((r, k) => r.classList.toggle('is-on', k === lit));
    rig.dataset.act = String(lit);
  }

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);

    /* One number opens the ring, one takes the five out to it, and one
       turns it. Everything else on screen is derived from those three, so
       the ring, the spokes and the nodes cannot disagree about where the
       rim is. */
    const open = ramp(p, OPEN_A, OPEN_B);
    const out  = ramp(p, OUT_A, OUT_B) - 0.16 * ramp(p, HOME_A, HOME_B);
    const home = ramp(p, HOME_A, HOME_B);

    /* THE TURN. Linear, and it must stay linear — this is a thing the
       reader is scrolling, and any easing here is a lie about how far
       they have gone. It runs from -18 degrees so the first node arrives
       at the front rather than starting there, which is the difference
       between an orbit and a carousel that was already running. */
    const spin = -18 + 378 * clamp01((p - RUN_A) / (RUN_B - RUN_A));

    /* The tilt opens as the ring does and flattens toward the end, so the
       closing beat is read straight-on rather than in perspective. */
    const tilt = 8 + 38 * open - 14 * home;

    rig.style.setProperty('--open', open.toFixed(4));
    rig.style.setProperty('--out', out.toFixed(4));
    rig.style.setProperty('--home', home.toFixed(4));
    rig.style.setProperty('--spin', spin.toFixed(2) + 'deg');
    rig.style.setProperty('--tilt', tilt.toFixed(2) + 'deg');

    /* ── depth, which CSS cannot work out for itself ────────────────
       Nothing in a stylesheet can read a child's computed Z, so the one
       thing that genuinely needs to be here is each node's own position
       around the ring. cos(theta) is 1 at the front and -1 at the back;
       the sheet turns that into opacity, scale and a little blur. */
    let front = 0, best = -2;
    for (let i = 0; i < N; i++) {
      const th = (ANGLE[i] + spin) * Math.PI / 180;
      const z = Math.cos(th);
      if (z > best) { best = z; front = i; }
      nodes[i].style.setProperty('--z', z.toFixed(4));
    }
    nodes.forEach((el, i) => el.classList.toggle('is-front', i === front));

    /* Which one is being named. During the turn it is whichever is at the
       front — so the readout follows the RING rather than the raw
       progress, and the two can never drift apart. */
    if (p < OPEN_A) beat(0);
    else if (p < OUT_B) beat(1);
    else if (p >= HOME_A) beat(7);
    else beat(2 + front);
  }

  if (REDUCED) {
    /* Held open, flat on, everything out and nothing spinning: the claim
       is that there are five of these around one core, and that is
       legible standing still. */
    rig.style.setProperty('--open', '1');
    rig.style.setProperty('--out', '1');
    rig.style.setProperty('--home', '0');
    rig.style.setProperty('--spin', '-18deg');
    rig.style.setProperty('--tilt', '30deg');
    for (let i = 0; i < N; i++) {
      const z = Math.cos((ANGLE[i] - 18) * Math.PI / 180);
      nodes[i].style.setProperty('--z', z.toFixed(4));
    }
    if (pctEl) pctEl.textContent = '000';
    beat(1);
    return;
  }

  onTrack(track, draw);

  /* the room: the ring leans toward the pointer and into the travel */
  onNear(track, (p, room) => {
    rig.style.setProperty('--px', room.px.toFixed(4));
    rig.style.setProperty('--py', room.py.toFixed(4));
    rig.style.setProperty('--lean', room.vel.toFixed(4));
  });
}
