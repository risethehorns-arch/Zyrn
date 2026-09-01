/* ══════════════════════════════════════════════════════════════════════
   THE LATTICE   (services/crm.html — the third CRM signature)

   The concept the owner kept from the swarm: scattered data becoming a
   system. Everything else is new. The records are LIGHT now — forty-eight
   sparks in the field's own ramp colours — and the organising acts are
   drawn as luminous structure THROUGH them: name them, link them into a
   schema, run them down a pipeline, lay them on a time spine, and hand
   the whole constellation over as one core. The reader's pointer is part
   of it: come near any spark, at any beat, and it flares and says its
   reference.

   ── WHY THE SWARM DIED (recorded so v4 is never v2 again) ───────────
   Forty-eight DARK CHIPS flying between formations read as texture, not
   as records: no light, no labels in most beats, and a closing stack
   that looked like a blob. The owner: "the motion looks off … low
   quality and not easy to understand … no light or designing unique
   effects on the scattered data". So v3 inverts the medium: the data IS
   the light, every structure is labelled, and the closing shape is one
   bright core with three words — not a pile.

   ── THE RULES IT KEEPS FROM THE SWARM'S POST-MORTEM ────────────────
   · a resize must redraw (positions are inline transforms; W×H baked)
   · depth is a ratio of the stage (z authored at righ=700, scaled H/700)
   · the spread budgets for the body of the thing it positions
   · anything that must be SEEN to move, moves by transform; the SVG
     lines never track moving endpoints — structure dissolves before
     flight and draws in after landing, so lines are click-time paint,
     never per-frame paint
   · every dwell answers the wheel: each beat has a p-driven motion
     (drift, the count, the orbit, the lane flow, the cursor, the slow
     turn), so scroll always does something visible

   ── COLOURS ─────────────────────────────────────────────────────────
   The light travels the field's own vivid ramp beat by beat: dim steel →
   green-teal → cyan → violet → lavender → Vapor. The cold stops print
   here as LIGHT (drop-shadow bloom on a Vapor-ish core), which is the
   same standing the glitch's cyan slices and the beam already have —
   never as ink on a surface.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, onNear, swapText, pad3, REDUCED, COARSE } from './_track.js';

const COUNT = 48;
const FLAGGED = 31;                     // ref 046 — the 07-day rule's catch

const BEATS = [
  ['00 — AS FOUND',
   'Forty-eight records adrift, which is how they actually live before there is a system: some in a spreadsheet, some in a notebook, some in whoever answered the phone. Everything after this is the same forty-eight points of light — none will be added, none lost.'],
  ['01 — NAMED',
   'The first organising act moves nothing: every record keeps the reference your firm already uses. Watch the count run the field. A system that starts by re-typing what you know is a system that starts by losing things.'],
  ['02 — THE SCHEMA',
   'The same records, linked to the objects your desk actually talks in — listings, clients, viewings, deals, documents. Twenty declared types carrying a hundred and thirty typed fields in the system running today.'],
  ['03 — THE PIPELINE',
   'The same records as work in motion, flowing through the three stages the desk really uses. One file has not moved in seven working days and it burns — working days, counted properly, because a Thursday-to-Sunday gap is not a stalled deal.'],
  ['04 — THE LEDGER',
   'The same records laid on time: every change in the order it happened, attributed and kept where the data is. The sweep is your scroll. This is how the desk answers "who changed the price" — the question that actually gets asked.'],
  ['05 — HANDED OVER',
   'All of it converges into one thing you own: source, data and hosting in the firm’s name, no seat count, nothing to renew. The core is not a metaphor — it is all forty-eight, still there. The exit is that there is nothing to exit from.'],
];

/* the score */
const RUN_A = 0.04, RUN_B = 0.94;
const STATIONS = 6;
const TRAVEL = 0.66;                     // travel share of a span
const dwellOf = (k) => (k === 0 ? 0.08 : 0.26);

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (t) => t * t * (3 - 2 * t);

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* schema hubs: the five objects, with how many of the 48 hang off each.
   The type/field counts on the rail (20 · 130) were counted out of the
   running system's schema, not written for this page. */
const HUBS = [
  { t: 'LISTING',  n: 14 },
  { t: 'CLIENT',   n: 10 },
  { t: 'VIEWING',  n: 9 },
  { t: 'DEAL',     n: 9 },
  { t: 'DOCUMENT', n: 6 },
];
const LANES = [
  { t: 'QUALIFIED', n: 17 },
  { t: 'VIEWING',   n: 16 },
  { t: 'CLOSING',   n: 15 },
];
const LANE_X = [-0.30, 0, 0.30];

export function initLattice() {
  const sec = document.getElementById('sigLat');
  const rig = document.getElementById('lat');
  const stage = document.getElementById('latStage');
  if (!sec || !rig || !stage) return;

  const track  = sec.querySelector('.sig__track');
  const view   = sec.querySelector('.rig__view');
  const net    = document.getElementById('latNet');
  const lbs    = document.getElementById('latLbs');
  const cur    = document.getElementById('latCur');
  const stepEl = document.getElementById('latStep');
  const noteEl = document.getElementById('latNote');
  const pctEl  = document.getElementById('latPct');
  const keyEl  = document.getElementById('latKey');
  const rows   = keyEl ? Array.prototype.slice.call(keyEl.children) : [];

  /* ── build the 48 sparks once ───────────────────────────────────── */
  const sparks = [], labels = [];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('span');
    p.className = 'lat__p';
    const ref = String(15 + i).padStart(3, '0');
    p.innerHTML = '<i class="lat__c"></i><em class="lat__t mono">' + ref +
      (i === FLAGGED ? '<span class="lat__fd"> &middot; 09 DAYS HELD</span>' : '') + '</em>';
    if (i === FLAGGED) p.classList.add('is-flag');
    /* the idle pulse must not be a metronome across 48 of them */
    p.firstChild.style.animationDelay = (-(i * 173) % 2600) + 'ms';
    frag.appendChild(p);
    sparks.push(p);
    labels.push(p.lastChild);
  }
  stage.appendChild(frag);

  /* counted, never typed */
  if (keyEl) {
    const t = keyEl.querySelector('[data-c="records"]');
    if (t) t.textContent = String(stage.querySelectorAll('.lat__p').length);
  }

  /* ── the six formations, unit space (-0.5..0.5), z in px@righ700 ── */
  function formations() {
    const F = [];

    /* 00 · ADRIFT */
    const r0 = rng(11);
    const adrift = [];
    for (let i = 0; i < COUNT; i++) {
      adrift.push({ x: (r0() - 0.5) * 0.88, y: (r0() - 0.5) * 0.80,
                    z: (r0() - 0.5) * 300, o: 0.55 + r0() * 0.45 });
    }
    F.push(adrift);

    /* 01 · NAMED — nothing moves but the depth: the scatter comes onto
       one plane, which is the visible form of "now they are one set" */
    F.push(adrift.map((a) => ({ x: a.x, y: a.y, z: 0, o: 1 })));

    /* 02 · THE SCHEMA — five hubs on a ring, records orbiting theirs */
    const r2 = rng(23);
    const schema = new Array(COUNT);
    let idx = 0;
    const hubPts = HUBS.map((h, hi) => {
      const a = (-90 + hi * 72) * Math.PI / 180;
      return { x: Math.cos(a) * 0.30, y: Math.sin(a) * 0.27 };
    });
    HUBS.forEach((h, hi) => {
      for (let j = 0; j < h.n; j++) {
        const a = (j / h.n) * Math.PI * 2 + hi * 0.9;
        /* tight orbits — at 0.06+ units the records smeared into the
           gaps between hubs and read as unattached */
        const rr = 0.042 + (j % 3) * 0.015 + r2() * 0.006;
        schema[idx++] = {
          x: hubPts[hi].x + Math.cos(a) * rr * 1.18,
          y: hubPts[hi].y + Math.sin(a) * rr,
          z: 0, o: 1, hub: hi, a0: a, rr: rr,
        };
      }
    });
    F.push(schema);

    /* 03 · THE PIPELINE — three lanes, filled top-down */
    const pipe = new Array(COUNT);
    idx = 0;
    LANES.forEach((L, li) => {
      for (let j = 0; j < L.n; j++) {
        /* spacing is slot / n — the SAME arithmetic the dwell's flow
           cycle uses, so entering and leaving the dwell lands exactly
           on these positions (the gap at the lane's foot is the wrap) */
        pipe[idx++] = {
          x: LANE_X[li] + ((j % 2) - 0.5) * 0.030,
          y: -0.30 + (j / L.n) * 0.62,
          z: 0, o: 1, lane: li, slot: j,
        };
      }
    });
    F.push(pipe);

    /* 04 · THE LEDGER — a time spine, events in seeded order */
    const r4 = rng(41);
    const order = [];
    for (let i = 0; i < COUNT; i++) order.push(i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = (r4() * (i + 1)) | 0;
      const t = order[i]; order[i] = order[j]; order[j] = t;
    }
    const ledger = new Array(COUNT);
    order.forEach((spark, pos) => {
      ledger[spark] = {
        x: -0.42 + (pos / (COUNT - 1)) * 0.84,
        y: 0.02 + ((pos % 2) ? 0.028 : -0.028),
        z: 0, o: 1,
      };
    });
    F.push(ledger);

    /* 05 · HANDED OVER — everything converges into one core */
    const r5 = rng(53);
    const core = [];
    for (let i = 0; i < COUNT; i++) {
      const a = r5() * Math.PI * 2;
      const rr = Math.sqrt(r5()) * 0.045;
      core.push({ x: Math.cos(a) * rr * 1.2, y: 0.02 + Math.sin(a) * rr,
                  z: (r5() - 0.5) * 40, o: 1 });
    }
    F.push(core);

    return { F, hubPts };
  }
  const { F: FORMS, hubPts } = formations();

  /* per-transition flight character: a seeded perpendicular bow and a
     stagger rank, reshuffled per leg so no two moves read as one drill */
  const LEGS = [];
  for (let t = 0; t < STATIONS - 1; t++) {
    const r = rng(300 + t);
    const idx2 = [];
    for (let i = 0; i < COUNT; i++) idx2.push(i);
    for (let i = idx2.length - 1; i > 0; i--) {
      const j = (r() * (i + 1)) | 0;
      const tmp = idx2[i]; idx2[i] = idx2[j]; idx2[j] = tmp;
    }
    const rank = new Array(COUNT), bow = new Array(COUNT);
    idx2.forEach((s, pos) => { rank[s] = pos / (COUNT - 1); });
    for (let i = 0; i < COUNT; i++) bow[i] = (r() - 0.5) * 0.22;
    LEGS.push({ rank, bow });
  }

  /* ── the stage box ──────────────────────────────────────────────── */
  let W = 1, H = 1, lastP = 0, XS = 1, ZS = 1, viewRect = null;
  function measure() {
    W = view.clientWidth || 1;
    H = view.clientHeight || 1;
    ZS = H / 700;
    /* labels stick out ~70px on the named beat; budget for them */
    XS = Math.min(1, ((0.5 * W - 64) / 1.06) / (0.47 * W));
    net.setAttribute('viewBox', (-W / 2) + ' ' + (-H / 2) + ' ' + W + ' ' + H);
    viewRect = view.getBoundingClientRect();
  }
  measure();

  /* ── luminous structure per formation (SVG + HTML labels) ───────── */
  function lineEl(x1, y1, x2, y2, cls, delay) {
    return '<line class="' + cls + '" pathLength="1" x1="' + (x1 * W * XS).toFixed(1) +
      '" y1="' + (y1 * H).toFixed(1) + '" x2="' + (x2 * W * XS).toFixed(1) +
      '" y2="' + (y2 * H).toFixed(1) + '" style="transition-delay:' + delay + 'ms"/>';
  }
  function label(x, y, text, cls) {
    return '<span class="lat__lb mono ' + (cls || '') + '" style="transform:translate(' +
      ((x * W * XS) + W / 2).toFixed(1) + 'px,' + ((y * H) + H / 2).toFixed(1) +
      'px) translate(-50%,-50%)">' + text + '</span>';
  }

  function structure(j) {
    let n = '', l = '';
    if (j === 2) {
      /* the ring of hubs, then every record tied to its object */
      for (let h = 0; h < 5; h++) {
        const a = hubPts[h], b = hubPts[(h + 1) % 5];
        n += lineEl(a.x, a.y, b.x, b.y, 'lat__ln lat__ln--ring', h * 55);
      }
      const S = FORMS[2];
      for (let i = 0; i < COUNT; i++) {
        const s = S[i], hp = hubPts[s.hub];
        n += lineEl(hp.x, hp.y, s.x, s.y, 'lat__ln', 260 + i * 9);
      }
      HUBS.forEach((h, hi) => {
        const p = hubPts[hi];
        l += label(p.x, p.y - 0.082, h.t + ' &middot; ' + String(h.n).padStart(2, '0'), 'lat__lb--hub');
      });
    } else if (j === 3) {
      LANES.forEach((L, li) => {
        n += lineEl(LANE_X[li], -0.36, LANE_X[li], 0.38, 'lat__ln lat__ln--rail', li * 90);
        l += label(LANE_X[li], -0.42, L.t + ' &middot; ' + String(L.n).padStart(2, '0'), 'lat__lb--hub');
      });
    } else if (j === 4) {
      n += lineEl(-0.44, 0.02, 0.44, 0.02, 'lat__ln lat__ln--rail', 0);
      l += label(-0.42, -0.062, 'OLDEST', 'lat__lb--hub');
      l += label(0.42, -0.062, 'NEWEST', 'lat__lb--hub');
      l += label(0, 0.155, 'EVERY CHANGE &middot; ATTRIBUTED &middot; TIMESTAMPED', '');
    } else if (j === 5) {
      const rays = [[-0.185, -0.10, 'SOURCE'], [0.185, -0.10, 'DATA'], [0, 0.175, 'HOSTING']];
      rays.forEach((r, i2) => {
        n += lineEl(r[0] * 0.35, 0.02 + (r[1] - 0.02) * 0.30, r[0] * 0.82, 0.02 + (r[1] - 0.02) * 0.82,
                    'lat__ln', 200 + i2 * 120);
        l += label(r[0], r[1], r[2], 'lat__lb--hub');
      });
    }
    return { n, l };
  }

  let netShown = -2;                       // which formation's structure is up
  function setStructure(j) {
    if (j === netShown) return;
    netShown = j;
    if (j < 0) { net.classList.remove('is-in'); lbs.classList.remove('is-in'); return; }
    const s = structure(j);
    net.innerHTML = s.n; lbs.innerHTML = s.l;
    /* two frames: mount hidden, then flip the class so the dash draw and
       the label fade actually transition */
    net.classList.remove('is-in'); lbs.classList.remove('is-in');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (netShown === j) { net.classList.add('is-in'); lbs.classList.add('is-in'); }
    }));
  }

  /* ── beats ──────────────────────────────────────────────────────── */
  let shown = -1;
  function beat(i) {
    if (i === shown) return;
    shown = i;
    swapText(stepEl, BEATS[i][0]);
    swapText(noteEl, BEATS[i][1]);
    rows.forEach((r, k) => r.classList.toggle('is-on', k === i));
    rig.dataset.act = String(i);
  }

  /* ── the draw ───────────────────────────────────────────────────── */
  const lx = new Float32Array(COUNT), ly = new Float32Array(COUNT);
  let counted = -1;

  function draw(p) {
    lastP = p;
    if (pctEl) pctEl.textContent = pad3(p);

    const w = clamp01((p - RUN_A) / (RUN_B - RUN_A)) * (STATIONS - 1);
    const k = Math.min(STATIONS - 2, Math.floor(w));
    const dw = dwellOf(k);
    const g = clamp01((w - k - dw) / TRAVEL);
    const leg = LEGS[k];
    const A = FORMS[k], B = FORMS[k + 1];

    /* which structure is standing: the one everyone has landed on */
    const settled = g <= 0.004 ? k : g >= 0.996 ? k + 1 : -1;
    setStructure(settled);
    rig.classList.toggle('is-set', settled >= 0);

    /* within-dwell clock for the count and the cursor */
    const dT = settled < 0 ? 0 : clamp01((w - (settled - 0.02)) / 0.28);

    for (let i = 0; i < COUNT; i++) {
      const tt = smooth(clamp01(g * 1.55 - leg.rank[i] * 0.55));
      const a = A[i], b = B[i];

      /* quadratic bezier through a bowed midpoint — flight, not slide */
      const mx = (a.x + b.x) / 2 - (b.y - a.y) * leg.bow[i];
      const my = (a.y + b.y) / 2 + (b.x - a.x) * leg.bow[i];
      const u = 1 - tt;
      let x = u * u * a.x + 2 * u * tt * mx + tt * tt * b.x;
      let y = u * u * a.y + 2 * u * tt * my + tt * tt * b.y;
      let z = (a.z + (b.z - a.z) * tt) + Math.sin(tt * Math.PI) * 90;

      /* The dwell lives: every beat answers the wheel. Every motion here
         is WINDOWED by sin(dT·π) or runs an exact whole cycle — zero
         offset at the dwell's entry AND exit — so the flight that follows
         starts from the very position the formation authored, with no
         snap at either boundary. */
      const win = Math.sin(dT * Math.PI);
      if (settled === 0) {
        x += Math.sin(dT * 9 + i * 1.7) * 0.012 * win;
        y += Math.cos(dT * 7 + i * 2.3) * 0.010 * win;
      } else if (settled === 2) {
        const s = FORMS[2][i], hp = hubPts[s.hub];
        const ang = s.a0 + win * 0.6;
        x = hp.x + Math.cos(ang) * s.rr * 1.18;
        y = hp.y + Math.sin(ang) * s.rr;
      } else if (settled === 3) {
        const s = FORMS[3][i];
        const L = LANES[s.lane];
        /* exactly ONE full loop down the lane per dwell — fract lands
           back on the authored slot at dT = 1 */
        const fl = (s.slot / L.n + dT) % 1;
        y = -0.30 + fl * 0.62;
        x = LANE_X[s.lane] + ((s.slot % 2) - 0.5) * 0.030;
      } else if (settled === 5) {
        const ang2 = Math.atan2(b.y - 0.02, b.x) + win * 0.8;
        const rr2 = Math.hypot(b.x, b.y - 0.02);
        x = Math.cos(ang2) * rr2 * 1.2;
        y = 0.02 + Math.sin(ang2) * rr2;
      }

      const px = x * W * XS, py = y * H;
      lx[i] = px; ly[i] = py;
      sparks[i].style.transform =
        'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,' + (z * ZS).toFixed(1) + 'px)';
      sparks[i].style.opacity = (a.o + (b.o - a.o) * tt).toFixed(3);
      /* labels flip to the left on the right half so none leave the stage */
      if (settled === 1) sparks[i].classList.toggle('is-r', px > W * 0.16);
    }

    /* 01 · the count runs the field as you scroll */
    if (settled === 1) {
      const c = Math.min(COUNT - 1, (dT * 1.35 * COUNT) | 0);
      if (c !== counted) {
        if (counted >= 0 && sparks[counted]) sparks[counted].classList.remove('is-cnt');
        sparks[c].classList.add('is-cnt');
        counted = c;
      }
    } else if (counted >= 0) {
      sparks[counted].classList.remove('is-cnt'); counted = -1;
    }

    /* 04 · the sweep is the scroll */
    if (settled === 4) {
      cur.style.transform = 'translate3d(' + ((-0.44 + dT * 0.88) * W * XS).toFixed(1) + 'px,0,0)';
      cur.classList.add('is-on');
    } else cur.classList.remove('is-on');

    if (p < RUN_A) beat(0);
    else beat(Math.min(STATIONS - 1, Math.round(w)));
  }

  /* ── park (reduced motion): the schema, fully drawn ─────────────── */
  function park() {
    const S = FORMS[2];
    for (let i = 0; i < COUNT; i++) {
      sparks[i].style.transform = 'translate3d(' + (S[i].x * W * XS).toFixed(1) +
        'px,' + (S[i].y * H).toFixed(1) + 'px,0px)';
      sparks[i].style.opacity = '1';
    }
    netShown = -2; setStructure(2);
    rig.classList.add('is-set');
    if (pctEl) pctEl.textContent = '000';
    beat(2);
  }

  const remeasure = () => { measure(); if (REDUCED) park(); else draw(lastP); };
  if (typeof ResizeObserver === 'function') new ResizeObserver(remeasure).observe(view);
  else addEventListener('resize', remeasure, { passive: true });

  if (REDUCED) { park(); return; }

  onTrack(track, draw);

  /* ── the reader's hand: room tilt + the nearest spark flares ────── */
  let hot = -1, rectTick = 0;
  onNear(track, (p, room) => {
    /* the hover mapping needs the view's viewport position, which moves
       while the section is arriving — and onNear runs even when the
       reader holds still, which draw() does not. Refresh it here,
       cheaply, never per frame. */
    if (++rectTick % 30 === 1) viewRect = view.getBoundingClientRect();
    rig.style.setProperty('--px', room.px.toFixed(4));
    rig.style.setProperty('--py', room.py.toFixed(4));
    rig.style.setProperty('--lean', room.vel.toFixed(4));

    if (COARSE || !viewRect) return;
    /* room.px/py are the eased pointer, -1..1 of the viewport */
    const cxv = (room.px + 1) * 0.5 * innerWidth;
    const cyv = (room.py + 1) * 0.5 * innerHeight;
    const mx = cxv - viewRect.left - W / 2;
    const my = cyv - viewRect.top - H / 2;
    let best = -1, bd = 80 * 80;
    for (let i = 0; i < COUNT; i++) {
      const dx = lx[i] - mx, dy = ly[i] - my;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    if (best !== hot) {
      if (hot >= 0) sparks[hot].classList.remove('is-hot');
      if (best >= 0) sparks[best].classList.add('is-hot');
      hot = best;
    }
  });
}
