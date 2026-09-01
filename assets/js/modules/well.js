/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE WELL   (services/ai-transformation.html)

   Five dimensions climbing a shaft through four gates, and a plane that
   rides on the shortest of them.

   That plane is the argument. The readiness index is the LOWEST dimension,
   not the mean — a firm cannot do anything its weakest dimension will not
   let it do — and `readiness.js` said so in a caption under five bars.
   Here the index is a slab of floor resting on the constraint, with the
   other four sticking through it and buying nothing, which is the same
   sentence in a form the reader finishes before reading it.

   The rates, the convergence and the five level texts are carried over
   from that instrument unchanged. They were right. They were 200px tall.

   ── WHY NOTHING HERE CHANGES A HEIGHT ───────────────────────────────
   A column that grew by animating `height` would relayout the scene every
   frame, on a page already running a 90k-particle simulation. So the fill
   is a full-height box scaled from its base, the depth face is the same
   box rotated and scaled, and the cap and the readout are separate
   elements TRANSLATED to meet it. One number per column, four transforms
   derived from it, no layout.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, onNear, swapText, pad3, REDUCED } from './_track.js';

const LEVELS = [
  ['LEVEL 00 — EXPLORATORY',
   'Tools in use, nothing measured. Value is anecdotal, and the firm cannot say whether any of it is working — which is not a tooling problem and will not be fixed by buying more of it.'],
  ['LEVEL 01 — IMPLEMENTED',
   'Pilots run and hold. The benefit is visible but local, and it does not survive being handed to another team, because what made it work was a person rather than a process.'],
  ['LEVEL 02 — ALIGNED',
   'Ownership and incentives agree. Return can be traced to a decision rather than to an anecdote, which is the first level at which a finance function will take the number seriously.'],
  ['LEVEL 03 — SCALED',
   'The system runs across the firm, predictably and repeatably, and it degrades gracefully when it is wrong. Being wrong is not the failure mode; being wrong silently is.'],
  ['LEVEL 04 — SELF-CALIBRATING',
   'The organization tunes itself. Zyrn is no longer required — that is the exit condition, and it is written into the engagement rather than left as a compliment.'],
];

const OPEN = ['00 — THE WELL',
  'Five dimensions, four gates, one shaft. Nothing has been measured yet, which is where most firms are: not at level zero on an index, but not on the index at all.'];

/* the score */
const RISE_A = 0.085, RISE_B = 0.90;

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

export function initWell() {
  const sec = document.getElementById('sigWell');
  const rig = document.getElementById('wll');
  if (!sec || !rig) return;

  const track  = sec.querySelector('.sig__track');
  const scene  = document.getElementById('wllScene');
  const stepEl = document.getElementById('wllStep');
  const noteEl = document.getElementById('wllNote');
  const pctEl  = document.getElementById('wllPct');
  const numEl  = document.getElementById('wllNum');
  const keyEl  = document.getElementById('wllKey');
  const rows   = keyEl ? Array.prototype.slice.call(keyEl.children) : [];
  const gates  = Array.prototype.slice.call(rig.querySelectorAll('.wll__gate'));

  const cols = Array.prototype.slice.call(rig.querySelectorAll('.wll__col'))
    .map((el, i) => ({
      el,
      rate: parseFloat(el.dataset.rate) || 1,
      val: el.querySelector('.wll__val'),
      key: (el.querySelector('.wll__k') || {}).textContent || '',
      row: rows[i] || null,
      rowv: rows[i] ? rows[i].querySelector('.k__v') : null,
      last: -1,
    }));
  if (!cols.length) return;

  /* The slowest dimension is the constraint and it stays the constraint —
     authored in the markup as a rate, so the argument is readable in the
     HTML rather than buried here. */
  const slowest = cols.reduce((a, b) => (b.rate < a.rate ? b : a), cols[0]);
  slowest.el.classList.add('is-constraint');
  if (slowest.row) slowest.row.classList.add('is-constraint');

  let shown = -1;
  function beat(i) {
    if (i === shown) return;
    shown = i;
    const b = i === 0 ? OPEN : LEVELS[i - 1];
    swapText(stepEl, b[0]);
    swapText(noteEl, b[1]);
  }

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);

    const q = clamp01((p - RISE_A) / (RISE_B - RISE_A));

    /* Early on the rates diverge, so the constraint is obvious on sight.
       Over the last 40% they converge — because that is what the
       engagement does: it names the constraint, then closes it. Without
       this the index caps at the constraint's rate, the page never reaches
       the level 04 its own copy promises, and the instrument reads as
       broken rather than as an argument. Carried over from readiness.js
       verbatim, including the square, which is what stops the convergence
       from starting as a visible kink. */
    const conv = clamp01((q - 0.6) / 0.4);
    const eff = (r) => r + (1 - r) * conv * conv;

    let lowest = 1;
    for (const c of cols) {
      const v = Math.min(1, q * eff(c.rate));
      if (v < lowest) lowest = v;
      if (Math.abs(v - c.last) > 0.002) {
        c.last = v;
        c.el.style.setProperty('--v', v.toFixed(4));
        const n = String(Math.round(v * 4)).padStart(2, '0');
        if (c.val && c.val.textContent !== n) c.val.textContent = n;
        if (c.rowv) c.rowv.textContent = 'LEVEL ' + n + (c === slowest ? ' — CONSTRAINT' : '');
      }
    }

    /* the plane rests on the lowest column. Not the mean — the point. */
    rig.style.setProperty('--idx', lowest.toFixed(4));
    const idx = Math.min(4, Math.floor(lowest * 4.999));
    if (numEl && numEl.textContent !== String(idx).padStart(2, '0')) {
      numEl.textContent = String(idx).padStart(2, '0');
    }

    /* a gate is passed when the INDEX passes it, not when the fastest
       column does — same reason the plane is where it is. Crossing one is
       the only EVENT this instrument has, so it gets a flash: the class
       goes on, and comes off again on animationend so it can fire on the
       way back down too. */
    gates.forEach((g, i) => {
      const on = lowest >= (i + 1) * 0.25 - 0.001;
      if (on !== g.classList.contains('is-on')) {
        g.classList.toggle('is-on', on);
        g.classList.remove('is-hit');
        void g.offsetWidth;
        g.classList.add('is-hit');
      }
    });

    /* the camera opens out across the climb, so the well is a little more
       side-on at the bottom and a little more head-on at the top. Small:
       a shaft that swings while you are trying to compare five heights
       is a worse instrument than a still one. */
    if (scene) {
      scene.style.setProperty('--ry', (-24 + 10 * clamp01(p)).toFixed(2) + 'deg');
      scene.style.setProperty('--rx', (6 + 4 * clamp01(p)).toFixed(2) + 'deg');
    }

    /* the key rail lights whichever dimension is currently lowest, which
       is the constraint — and near the top, where they converge, it can
       change hands. That handover is worth seeing. */
    let low = cols[0];
    for (const c of cols) if (c.last < low.last) low = c;
    rows.forEach((r, k) => r.classList.toggle('is-on', cols[k] === low));

    beat(p < RISE_A ? 0 : 1 + idx);
  }

  if (REDUCED) {
    /* Parked at the top: every column through the last gate and the plane
       riding level 04, which is the state the closing copy is about. */
    for (const c of cols) {
      c.el.style.setProperty('--v', '1');
      if (c.val) c.val.textContent = '04';
      if (c.rowv) c.rowv.textContent = 'LEVEL 04' + (c === slowest ? ' — CONSTRAINT' : '');
    }
    rig.style.setProperty('--idx', '1');
    gates.forEach((g) => g.classList.add('is-on'));
    if (numEl) numEl.textContent = '04';
    if (pctEl) pctEl.textContent = '000';
    beat(5);
    return;
  }
  gates.forEach((g) => g.addEventListener('animationend', () => {
    g.classList.remove('is-hit');
  }));

  onTrack(track, draw);
  /* ── THE ROOM ────────────────────────────────────────────────────
     Runs every frame while the section is near, whether or not the page
     moved — the lean has to keep easing while the reader holds still,
     which is exactly when a progress-only callback stops being called. */
  onNear(track, (p, room) => {
    const live = 1;
    scene.style.setProperty('--px', (room.px * live).toFixed(4));
    scene.style.setProperty('--py', (room.py * live).toFixed(4));
    scene.style.setProperty('--lean', (room.vel * live).toFixed(4));
  });
}
