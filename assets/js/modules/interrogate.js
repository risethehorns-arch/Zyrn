/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE INTERROGATION   (duk.html)

   Duk's whole argument in one instrument: it asks before it answers.

   A firm states a problem. Twenty-two plausible causes are on the table,
   which is the honest number — everyone in the room has a different one and
   all of them sound reasonable. Then four questions run, and each one kills
   a whole class of candidate rather than picking a winner. What is left at
   the end is not the stated problem, and that is the point.

   The chain is authored, not simulated, and deliberately so. A generative
   demo that lands somewhere different on every load cannot make an
   argument twice — the same reasoning as graph.js on the structuring page.
   It is also the honest shape of the thing: this is what Duk is DESIGNED to
   do, demonstrated. Nothing here is a recording of a shipped product.

   The answer it converges on is a decision-rights answer, which is not a
   coincidence — it is the same thesis as SYS.03's structuring line. Duk is
   that method running continuously instead of once a quarter.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, swapText, pad3, REDUCED } from './_track.js';

/* `k` is the round that eliminates a candidate; 0 survives all four. The
   groupings matter more than the individual labels: round 1 clears external
   noise, 2 clears resourcing, 3 clears skill, 4 clears process metrics —
   so what survives can only be structural. */
const CANDIDATES = [
  { l: 'MARKET SOFTENED',    k: 1 }, { l: 'COMPETITOR PRICING', k: 1 },
  { l: 'SEASONALITY',        k: 1 }, { l: 'FX MOVEMENT',        k: 1 },
  { l: 'BRAND AWARENESS',    k: 1 }, { l: 'RAW LEAD VOLUME',    k: 1 },
  { l: 'TERRITORY SPLIT',    k: 2 }, { l: 'COMP PLAN',          k: 2 },
  { l: 'HEADCOUNT',          k: 2 }, { l: 'CRM HYGIENE',        k: 2 },
  { l: 'TOOLING',            k: 2 }, { l: 'ENABLEMENT',         k: 2 },
  { l: 'MANAGER SPAN',       k: 3 }, { l: 'RAMP TIME',          k: 3 },
  { l: 'DEMO QUALITY',       k: 3 }, { l: 'PRICING APPROVALS',  k: 3 },
  { l: 'DISCOUNT AUTHORITY', k: 3 },
  { l: 'FORECAST CADENCE',   k: 4 }, { l: 'MARKETING SLA',      k: 4 },
  { l: 'LEAD SCORING',       k: 4 }, { l: 'QUALIFICATION BAR',  k: 4 },
  { l: 'HANDOFF OWNERSHIP',  k: 0 },
];

const ROUNDS = [
  {
    step: '00 — THE STATEMENT',
    q: 'Our sales team keeps missing quota.',
    a: null,
    note: 'Twenty-two candidate causes, and everyone in the room is holding a different one. A tool that answers this question now is guessing in a confident voice.',
  },
  {
    step: '01 — SCOPE',
    q: 'Missing it by how much, and since when?',
    a: 'Eleven per cent. Three quarters running.',
    note: 'Persistent and bounded. A soft market or a bad season does not hold that steady for nine months, so the whole external class comes off the table at once.',
  },
  {
    step: '02 — INPUTS',
    q: 'Did the quota move, or did the pipeline?',
    a: 'Neither. Both are within five per cent of last year.',
    note: 'Same target, same volume, worse result. Nothing about resourcing explains that, so headcount, territory and the comp plan go with it.',
  },
  {
    step: '03 — LOCATION',
    q: 'So the same pipeline converts worse. Where does it stall?',
    a: 'Between the qualified lead and the first meeting.',
    note: 'One gap, named. That is not a skill problem — the sellers never get the meeting to be bad at. Coaching, demos and approvals are out.',
  },
  {
    step: '04 — AUTHORITY',
    q: 'Who owns a lead inside that gap — marketing, or sales?',
    a: '…',
    note: 'The pause is the finding. Nobody owns it, so the metrics measuring it were measuring an unowned thing, and every fix aimed at them was aimed past the problem.',
  },
  {
    step: '05 — THE CONSTRAINT',
    q: 'Nobody owns the handoff.',
    a: null,
    note: 'Four questions, no answer generated. The quota was never the problem, and it is the only thing anyone had been managing. Duk starts building from here.',
  },
];

/* deterministic scatter — same field on every load and in every capture */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ramp = (p, a, b) => {
  const t = Math.min(1, Math.max(0, (p - a) / Math.max(1e-5, b - a)));
  return t * t * (3 - 2 * t);
};

/* round r occupies [CUT[r], CUT[r+1]) */
const CUT = [0, 0.13, 0.32, 0.51, 0.70, 0.87, 1.0001];

export function initInterrogate() {
  const track = document.getElementById('inTrack');
  const field = document.getElementById('inField');
  if (!track || !field) return;

  const stage  = track.querySelector('.in__stage');
  const stepEl = document.getElementById('inStep');
  const pctEl  = document.getElementById('inPct');
  const qEl    = document.getElementById('inQ');
  const aEl    = document.getElementById('inA');
  const noteEl = document.getElementById('inNote');
  const liveEl = document.getElementById('inLive');
  const askEl  = document.getElementById('inAsk');

  /* ── build the field ─────────────────────────────────────────────── */
  const rnd = mulberry32(0x44554B);            // "DUK"
  const N = CANDIDATES.length;
  const nodes = CANDIDATES.map((c, i) => {
    const el = document.createElement('span');
    el.className = 'incand';
    if (!c.k) el.setAttribute('data-keeps', '');
    el.innerHTML = '<i class="incand__d"></i><b class="mono incand__l">' + c.l + '</b>';
    field.appendChild(el);

    /* THREE CONCENTRIC BANDS, not one ring with random radii.
       Twenty-two nodes on a single ring sit 16 degrees apart, which at this
       radius is about 70px of arc — and these labels are 100 to 140px wide,
       so neighbours collided every time ("TERRITORY SPLIT" and "RAW LEAD
       VOLUME" printed straight through each other). Assigning the radius by
       `i % 3` puts consecutive nodes in different bands, so anything sharing
       a band is three indices and ~49 degrees away. The jitter is small
       enough not to undo that. */
    const a = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.26;
    /* FOUR bands, not three. With three, same-band nodes were 49 degrees
       apart, and on the innermost band that is only ~93px of arc against a
       120px label — PRICING APPROVALS still ran through MARKETING SLA. Four
       bands puts them 65 degrees apart and lifts the inner radius. */
    const r = [0.46, 0.66, 0.84, 1.00][i % 4] + (rnd() - 0.5) * 0.05;
    const ax = Math.cos(a), ay = Math.sin(a);
    /* A node on the left half runs its label leftwards from the dot.
       Otherwise every label on that side reads outward through the middle
       of the field and collides with the ones opposite. */
    const left = ax < -0.08;
    if (left) el.setAttribute('data-left', '');
    return { c, el, left, ax0: ax * r, ay0: ay * r, ax: ax * r, ay: ay * r };
  });

  let R = 240;                                  // field radius, px

  /* ── keeping labels off each other ────────────────────────────────
     Seeded placement alone cannot do this. These labels are 90–140px wide
     against ~16 degrees of angular spacing, so ring neighbours collide;
     banding the radii helped and did not finish the job, and the field is
     a third of the size on a phone, where every remaining near-miss became
     a hit. Tuning the jitter was chasing it.

     So the seeded angles are only a STARTING point, and a relaxation pass
     pushes any overlapping pair apart along their axis of least overlap
     until nothing intersects. It is deterministic (same seed, same layout,
     every load and every capture), it runs once per resize rather than per
     frame, and it is 22x22x90 comparisons — a fraction of a millisecond.

     Widths come from offsetWidth, not getBoundingClientRect: the nodes
     carry a scale transform while the instrument is running, and a rect
     would measure the scaled box and relax against the wrong size. */
  function relax() {
    nodes.forEach((n) => {
      n.w = n.el.offsetWidth || 90;
      n.h = n.el.offsetHeight || 14;
      n.px = n.ax0 * R;
      n.py = n.ay0 * R;
    });
    /* LIM is generous on purpose: the field has no overflow clipping, and
       a tight clamp pins nodes against the edge where they can no longer
       be pushed apart, which is what left one stubborn pair overlapping. */
    const PAD = 7, LIM = R * 1.2;
    for (let it = 0; it < 220; it++) {
      let moved = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const A = nodes[i], B = nodes[j];
          // the anchor is the dot; the box extends toward its label
          const acx = A.px + (A.left ? -A.w / 2 : A.w / 2);
          const bcx = B.px + (B.left ? -B.w / 2 : B.w / 2);
          const dx = bcx - acx, dy = B.py - A.py;
          const ox = (A.w + B.w) / 2 + PAD - Math.abs(dx);
          const oy = (A.h + B.h) / 2 + PAD - Math.abs(dy);
          if (ox <= 0 || oy <= 0) continue;
          moved++;
          if (oy < ox) {                       // cheaper to separate vertically
            const s = ((dy >= 0 ? 1 : -1) * oy) / 2;
            A.py -= s; B.py += s;
          } else {
            const s = ((dx >= 0 ? 1 : -1) * ox) / 2;
            A.px -= s; B.px += s;
          }
          // clamp inside the loop, not after — clamping at the end would
          // shove nodes back on top of each other
          A.px = Math.max(-LIM, Math.min(LIM, A.px));
          B.px = Math.max(-LIM, Math.min(LIM, B.px));
          A.py = Math.max(-LIM, Math.min(LIM, A.py));
          B.py = Math.max(-LIM, Math.min(LIM, B.py));
        }
      }
      if (!moved) break;
    }
    nodes.forEach((n) => { n.ax = n.px / R; n.ay = n.py / R; });
  }

  function measure() {
    R = Math.max(90, Math.min(field.clientWidth, field.clientHeight) * 0.44);
    relax();
  }
  measure();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(field);
  else addEventListener('resize', measure, { passive: true });

  let shown = -1;

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);

    let r = 0;
    while (r < 5 && p >= CUT[r + 1]) r++;
    const local = (p - CUT[r]) / Math.max(1e-5, CUT[r + 1] - CUT[r]);

    /* how many rounds have actually FIRED, as a smooth value, so a
       candidate dies over the beat rather than blinking out */
    let alive = 0;
    nodes.forEach((n) => {
      const k = n.c.k;
      let dead = 0;
      if (k) {
        /* dies during round k, across the first 55% of that round */
        if (r > k) dead = 1;
        else if (r === k) dead = ramp(local, 0.06, 0.55);
      }
      if (dead < 0.5) alive++;

      /* survivors are pulled in as the rounds pass; the constraint lands
         dead centre only once the last question has been asked */
      const pull = n.c.k ? 0 : ramp(p, CUT[4], CUT[5] + 0.06);
      const drift = 1 + dead * 0.34;             // the dead fall outward
      const spread = 1 - 0.18 * ramp(p, 0.06, 0.9);

      /* The survivor grows and moves to the middle, and BOTH of those have
         to account for the fact that a node is anchored by the edge its
         label runs from, not by its centre. Left alone it lands with its
         dot on the centre point and its label running off to one side —
         which on a phone put "HANDOFF OWNERSHIP" straight off the right of
         the screen. `transform: translate() scale()` scales about the box's
         own centre, so the box centre after the transform is at
         x + w/2 (or x - w/2 when it is right-anchored); solving that for
         zero gives the target below, and `pull` eases it there. */
      const half = (n.w || 90) / 2;
      const homeX = n.left ? half : -half;
      const grow = R < 170 ? 0.45 : 0.9;   // a small field cannot afford 1.9x

      const x = n.ax * R * drift * spread * (1 - pull) + homeX * pull;
      const y = n.ay * R * drift * spread * (1 - pull);
      const s = (1 - dead * 0.55) * (1 + pull * grow);

      n.el.style.transform =
        'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ')';
      n.el.style.setProperty('--dead', dead.toFixed(3));
      n.el.style.setProperty('--found', pull.toFixed(3));
    });

    if (liveEl) swapText(liveEl, String(alive).padStart(2, '0') + ' / ' + N + ' LIVE');
    if (askEl) askEl.textContent = String(Math.min(4, r)).padStart(2, '0');

    /* the question pulse — a ring leaving centre as each round fires */
    if (stage) {
      stage.style.setProperty('--ping', (r > 0 && r < 5 ? 1 - ramp(local, 0, 0.5) : 0).toFixed(3));
      stage.style.setProperty('--pingr', ramp(local, 0, 0.62).toFixed(3));
      stage.style.setProperty('--solved', ramp(p, CUT[5], 1).toFixed(3));
    }

    if (r !== shown) {
      shown = r;
      const R0 = ROUNDS[r];
      swapText(stepEl, R0.step);
      swapText(qEl, R0.q);
      swapText(noteEl, R0.note);
      if (aEl) {
        aEl.textContent = R0.a || '';
        aEl.style.opacity = R0.a ? '1' : '0';
      }
      if (stage) stage.setAttribute('data-round', String(r));
    }
  }

  if (REDUCED) { measure(); draw(1); return; }
  onTrack(track, draw);
}
