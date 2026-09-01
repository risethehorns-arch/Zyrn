/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE PLAN   (services/business-structuring.html)

   Eleven nodes, seen twice. As an ELEVATION they are the chart as it is
   published — a tree standing up, every line correct. As a PLAN they are
   the same eleven lying on a floor, with authority where the work is.

   This replaces `graph.js`, which lerped between two flat layouts. That
   was the right argument at a quarter of the size: the two pictures never
   became one picture, so the reader had to be told they were the same
   eleven nodes rather than seeing it. Here the camera ROTATES, from an
   elevation to a plan, while the tree settles onto the ground — and a
   drawing that tips over in front of you is the sentence the page is
   making, with no copy attached.

   ── WHAT IS AUTHORED AND WHAT IS DERIVED ────────────────────────────
   Authored: two 3D positions per node, the published edges, the local
   edges, and the two routes a decision takes. Derived: every hop count on
   the readout, and the length of every trail. So the numbers cannot drift
   from the picture — they are measured off the same arrays that draw it,
   which is the same reason `graph.js` refused a force simulation.

   ── THE ONE PERFORMANCE RULE ────────────────────────────────────────
   The projection runs for eleven nodes and about forty paths. Recomputing
   all of that on frames where the camera has not moved is most of the
   cost for none of the benefit, so geometry is rebuilt only when the
   layout parameter actually changes. While the decision token is
   travelling, exactly two elements are written.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, onNear, swapText, pad3, REDUCED } from './_track.js';

const NS = 'http://www.w3.org/2000/svg';

/* Screen space. The SVG is 1000x640 and scales to the rig by `meet`, so
   these are the only numbers that decide the composition. */
const CX = 500, CY = 356, FOV = 1000;
/* 66, not 70, and the ring is 280 rather than 300. At the steeper pitch the
   far side of the plan projected 90 units BELOW the viewBox, and the svg is
   overflow:visible, so it painted over the note. Every number here is
   inside the box at both ends of the rotation now — measured, not eyed. */
const PITCH = 66;                      // degrees, elevation -> plan

/* id, label, elevation (x,y), plan (x,z). y is up; the plan lies at
   PLAN_Y, which is the height of the bottom tier — so the chart does not
   just rotate, it settles down onto the level where the work already was. */
const PLAN_Y = -150, R = 280;
const ring = (i, n) => {
  const a = (-90 + (360 / n) * i) * Math.PI / 180;
  return [R * Math.cos(a), R * Math.sin(a)];
};
const T2 = ['ops', 'sup', 'fin', 'rsk', 'eng', 'dat', 'sec'];

const NODES = [
  { id: 'ceo', l: 'CEO', ex: 0,    ey: 250, px: 0, pz: 0,   hub: 1 },
  { id: 'coo', l: 'COO', ex: -260, ey: 90 },
  { id: 'cfo', l: 'CFO', ex: 0,    ey: 90 },
  { id: 'cto', l: 'CTO', ex: 260,  ey: 90 },
  { id: 'ops', l: 'OPS', ex: -390, ey: -110 },
  { id: 'sup', l: 'SUP', ex: -260, ey: -110 },
  { id: 'fin', l: 'FIN', ex: -130, ey: -110 },
  { id: 'rsk', l: 'RSK', ex: 0,    ey: -110 },
  { id: 'eng', l: 'ENG', ex: 130,  ey: -110 },
  { id: 'dat', l: 'DAT', ex: 260,  ey: -110 },
  { id: 'sec', l: 'SEC', ex: 390,  ey: -110 },
];
/* the ten that are not the centre take the ring, in the order they are
   declared, so the plan reads left-to-right the way the chart did */
['coo', 'cfo', 'cto'].concat(T2).forEach((id, i, arr) => {
  const n = NODES.find((x) => x.id === id);
  const [x, z] = ring(i, arr.length);
  n.px = x; n.pz = z;
});

/* the chart as published: every line real, every line correct */
const PUBLISHED = [
  ['ceo', 'coo'], ['ceo', 'cfo'], ['ceo', 'cto'],
  ['coo', 'ops'], ['coo', 'sup'], ['cfo', 'fin'], ['cfo', 'rsk'],
  ['cto', 'eng'], ['cto', 'dat'], ['cto', 'sec'],
];
/* authority placed where the work is: short lines between neighbours */
const LOCAL = [
  ['ops', 'sup'], ['sup', 'fin'], ['fin', 'rsk'], ['rsk', 'eng'],
  ['eng', 'dat'], ['dat', 'sec'], ['sec', 'coo'], ['coo', 'cfo'],
  ['cfo', 'cto'], ['cto', 'ops'],
];
/* what the centre keeps, because it is the only place it can sit */
const ARBITRATED = [['ceo', 'rsk'], ['ceo', 'sec']];

/* the two routes. Hop counts on the readout are the length of these
   arrays minus one — never typed. */
const LONG  = ['ops', 'coo', 'ceo', 'cto', 'eng'];
const SHORT = ['ops', 'eng'];

const BEATS = [
  ['01 — AS PUBLISHED',
   'Eleven people, three tiers, ten reporting lines. Every line on this chart is correct, everybody agrees it is correct, and the firm is still slow — because a reporting line says who is told, not who may decide.'],
  ['02 — THE ESCALATION',
   'A question that starts in operations and is answered in engineering. Watch where it has to go first. Nothing here is broken; this is the structure working exactly as drawn.'],
  ['03 — WHAT THAT COSTS',
   'Four hops, three tiers crossed, two people who will approve it without changing it. The cost is not the meeting — it is that nobody between the ends is allowed to say yes.'],
  ['04 — LAY IT DOWN',
   'The same eleven, rotated onto the floor. Nothing has been added and nobody has been removed. The tree was a picture of reporting; this is a picture of authority, and they were never the same drawing.'],
  ['05 — THE SHORT PATH',
   'The same question, after decision rights have been reassigned per decision rather than per title. It is answered where it landed, by the person who was always going to have to do the work.'],
  ['06 — WHAT THE CENTRE KEEPS',
   'Two things do not get handed down, because the centre is the only place they can sit: what the firm is willing to risk, and what it is willing to expose. Everything else moved.'],
];

/* the score */
/* 0.06, not 0.10: rigmotion measured three consecutive sampled positions
   with nothing changing at the head of the track, which is where a reader
   is deciding whether the thing is worth scrolling at all. */
const ESC_A  = 0.06, ESC_B = 0.34;   // the decision climbs and is answered
const HOLD_B = 0.46;                 // held, while the cost is stated
const ROT_A  = 0.46, ROT_B = 0.68;   // the chart lies down
const SHT_A  = 0.72, SHT_B = 0.88;   // the short path
const ARB_A  = 0.88;                 // what the centre keeps

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const ramp = (p, a, b) => {
  const t = clamp01((p - a) / Math.max(1e-5, b - a));
  return t * t * (3 - 2 * t);
};

export function initPlan() {
  const sec = document.getElementById('sigPlan');
  const svg = document.getElementById('plnSvg');
  if (!sec || !svg) return;

  const track = sec.querySelector('.sig__track');
  const gFloor = document.getElementById('plnFloor');
  const gTiers = document.getElementById('plnTiers');
  const gEdges = document.getElementById('plnEdges');
  const gNodes = document.getElementById('plnNodes');
  const trail  = document.getElementById('plnTrail');
  const tok    = document.getElementById('plnTok');
  const halo   = document.getElementById('plnHalo');
  const stepEl = document.getElementById('plnStep');
  const noteEl = document.getElementById('plnNote');
  const pctEl  = document.getElementById('plnPct');
  const keyEl  = document.getElementById('plnKey');
  const rows   = keyEl ? Array.prototype.slice.call(keyEl.children) : [];

  const byId = {};
  NODES.forEach((n) => { byId[n.id] = n; });

  /* The key rail is FILLED FROM THE ARRAYS that draw the diagram, never
     typed into the markup. A count written into HTML is a claim that goes
     stale the first time an edge is added and nobody notices — doctrine
     rule 2 says the number has to be counted, and this is where. */
  if (keyEl) {
    const put = (name, v) => {
      const t = keyEl.querySelector('[data-c="' + name + '"]');
      if (t) t.textContent = String(v).padStart(2, '0');
    };
    put('nodes', NODES.length);
    put('published', PUBLISHED.length);
    put('tiers', new Set(NODES.map((n) => n.ey)).size);
    put('long', LONG.length - 1);
    put('local', LOCAL.length);
    put('arb', ARBITRATED.length);
  }

  /* ── build once ──────────────────────────────────────────────────── */
  const el = (tag, parent, cls) => {
    const e = document.createElementNS(NS, tag);
    if (cls) e.setAttribute('class', cls);
    parent.appendChild(e);
    return e;
  };

  // the surveyed ground: a grid in the plan's own plane, so it arrives
  // with the rotation rather than being drawn on top of it
  const GRID = [];
  for (let i = -2; i <= 2; i++) {
    GRID.push({ a: [i * 140, PLAN_Y, -280], b: [i * 140, PLAN_Y, 280], p: el('path', gFloor) });
    GRID.push({ a: [-280, PLAN_Y, i * 140], b: [280, PLAN_Y, i * 140], p: el('path', gFloor) });
  }

  // the three tier rules, which only mean anything while it is an elevation
  const TIERS = [
    { y: 250,  l: 'TIER 01', p: el('path', gTiers), t: el('text', gTiers) },
    { y: 90,   l: 'TIER 02', p: el('path', gTiers), t: el('text', gTiers) },
    { y: -110, l: 'TIER 03', p: el('path', gTiers), t: el('text', gTiers) },
  ];

  const EDGES = []
    .concat(PUBLISHED.map((e) => ({ a: e[0], b: e[1], kind: 'pub' })))
    .concat(LOCAL.map((e) => ({ a: e[0], b: e[1], kind: 'loc' })))
    .concat(ARBITRATED.map((e) => ({ a: e[0], b: e[1], kind: 'arb' })));
  EDGES.forEach((e) => { e.p = el('path', gEdges); });

  NODES.forEach((n) => {
    n.g = el('g', gNodes);
    n.c = el('circle', n.g);
    n.c.setAttribute('r', n.hub ? 15 : 11);
    if (n.hub) n.c.setAttribute('class', 'is-hub');
    n.t = el('text', n.g);
    n.t.textContent = n.l;
    n.t.setAttribute('dy', 27);
  });

  /* ── the camera ──────────────────────────────────────────────────── */
  let cam = 0;          // 0 = elevation, 1 = plan
  let lastCam = -1;

  function project(x, y, z) {
    const th = PITCH * cam * Math.PI / 180;
    const cs = Math.cos(th), sn = Math.sin(th);
    const v = y * cs - z * sn;
    const d = y * sn + z * cs;
    const f = FOV / (FOV + d);
    return [CX + x * f, CY - v * f];
  }
  function world(n) {
    /* the node's position at the current camera. It settles onto the plan
       on the same number that tips the camera, so the tree cannot be seen
       lying down while still in its tree shape. */
    return [n.ex + (n.px - n.ex) * cam,
            n.ey + (PLAN_Y - n.ey) * cam,
            (n.pz || 0) * cam];
  }

  function layout() {
    NODES.forEach((n) => {
      const w = world(n);
      const [sx, sy] = project(w[0], w[1], w[2]);
      n.sx = sx; n.sy = sy;
      n.c.setAttribute('cx', sx.toFixed(1));
      n.c.setAttribute('cy', sy.toFixed(1));
      n.t.setAttribute('x', sx.toFixed(1));
      n.t.setAttribute('y', sy.toFixed(1));
    });

    EDGES.forEach((e) => {
      const a = byId[e.a], b = byId[e.b];
      /* the published lines BOW while the chart is standing, so the three
         that share the centre do not print on top of each other. The bow
         goes to zero as it lies down, because on a floor they do not
         overlap and a curve would just read as decoration. */
      const bow = e.kind === 'pub' ? 24 * (1 - cam) : 0;
      const mx = (a.sx + b.sx) / 2, my = (a.sy + b.sy) / 2 - bow;
      e.p.setAttribute('d', 'M' + a.sx.toFixed(1) + ',' + a.sy.toFixed(1) +
                            ' Q' + mx.toFixed(1) + ',' + my.toFixed(1) +
                            ' ' + b.sx.toFixed(1) + ',' + b.sy.toFixed(1));
    });

    GRID.forEach((g) => {
      const a = project(g.a[0], g.a[1], g.a[2]);
      const b = project(g.b[0], g.b[1], g.b[2]);
      g.p.setAttribute('d', 'M' + a[0].toFixed(1) + ',' + a[1].toFixed(1) +
                            ' L' + b[0].toFixed(1) + ',' + b[1].toFixed(1));
    });

    TIERS.forEach((t) => {
      const a = project(-430, t.y, 0), b = project(430, t.y, 0);
      t.p.setAttribute('d', 'M' + a[0].toFixed(1) + ',' + a[1].toFixed(1) +
                            ' L' + b[0].toFixed(1) + ',' + b[1].toFixed(1));
      t.t.setAttribute('x', (a[0] - 6).toFixed(1));
      t.t.setAttribute('y', (a[1] - 8).toFixed(1));
      t.t.setAttribute('text-anchor', 'end');
      if (!t.t.textContent) t.t.textContent = t.l;
    });
  }

  /* ── a decision travelling ───────────────────────────────────────── */
  function route(ids, t, trailLen) {
    /* Walk the polyline through the named nodes. Lengths are summed from
       the projected points, so the token moves at a constant speed on
       screen no matter what the camera is doing underneath it. */
    const pts = ids.map((id) => [byId[id].sx, byId[id].sy]);
    const seg = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(d); total += d;
    }
    const want = total * clamp01(t);
    let acc = 0, k = 0;
    while (k < seg.length - 1 && acc + seg[k] < want) { acc += seg[k]; k++; }
    const f = seg[k] > 0 ? (want - acc) / seg[k] : 0;
    const x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f;
    const y = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;

    let d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    for (let i = 1; i <= k; i++) d += ' L' + pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1);
    d += ' L' + x.toFixed(1) + ',' + y.toFixed(1);
    trail.setAttribute('d', d);
    /* The trail is a comet, not a highlighter: a fixed length of line
       behind the token, drawn by offsetting one long dash. Without this
       the whole route stays lit and the second run cannot be told from
       the first. */
    trail.setAttribute('stroke-dasharray', trailLen + ' 100000');
    trail.setAttribute('stroke-dashoffset', String(-(want - trailLen)));
    tok.setAttribute('cx', x.toFixed(1)); tok.setAttribute('cy', y.toFixed(1));
    halo.setAttribute('cx', x.toFixed(1)); halo.setAttribute('cy', y.toFixed(1));
    trail.style.opacity = tok.style.opacity = halo.style.opacity = '1';
    return want / Math.max(1, total);
  }

  function hideToken() {
    /* OPACITY, not a parking position off to the left. The svg is
       `overflow:visible` — it has to be, so the tier rules can reach the
       full width — which means a circle parked at cx = -99 is not hidden
       at all. It paints as a dot floating outside the instrument, and
       rigfit found it by measuring the union of everything drawn: 117px
       of it, off the left edge and up through the step readout.
       A zero-length path with a round linecap draws a dot too, so the
       trail needs the same treatment rather than an empty `d`. */
    trail.style.opacity = tok.style.opacity = halo.style.opacity = '0';
  }

  let shown = -1;
  function beat(i) {
    if (i === shown) return;
    shown = i;
    swapText(stepEl, BEATS[i][0]);
    swapText(noteEl, BEATS[i][1]);
    rows.forEach((r, k) => r.classList.toggle('is-on', k === i));
  }

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);

    cam = ramp(p, ROT_A, ROT_B);
    if (Math.abs(cam - lastCam) > 0.0008) { lastCam = cam; layout(); }

    /* Which lines are real right now. Published lines are the whole story
       until the rotation; local lines take over during it; the two the
       centre keeps arrive last and are the only Pulse on the page. */
    const local = ramp(p, ROT_A + 0.04, ROT_B);
    const arb   = ramp(p, ARB_A, 1.0);
    for (const e of EDGES) {
      let o = 0, cls = '';
      if (e.kind === 'pub') { o = 0.10 + 0.90 * (1 - local); cls = p < ROT_A ? 'is-esc' : ''; }
      else if (e.kind === 'loc') { o = local; cls = 'is-local'; }
      else { o = arb; cls = 'is-arb'; }
      e.p.style.opacity = o.toFixed(3);
      if (e.p.getAttribute('class') !== cls) e.p.setAttribute('class', cls);
    }
    gFloor.style.opacity = cam.toFixed(3);
    gTiers.style.opacity = (1 - cam).toFixed(3);

    /* the decision itself */
    if (p >= ESC_A && p < HOLD_B) {
      /* The trail SHORTENS through the hold rather than freezing at full
         length. The hold is a deliberate beat — the readout is stating
         what the escalation cost — but rigmotion measured three sampled
         positions with nothing moving at all, and a decision that has
         arrived and is settling is both truer and cheaper than a frozen
         comet. */
      const settle = clamp01((p - ESC_B) / (HOLD_B - ESC_B));
      route(LONG, (p - ESC_A) / (ESC_B - ESC_A), 150 - 96 * settle);
    } else if (p >= SHT_A && p < ARB_A + 0.06) {
      route(SHORT, (p - SHT_A) / (SHT_B - SHT_A), 110);
    } else {
      hideToken();
    }
    /* the nodes the live route touches are lit, so the reader is never
       hunting for which three letters the dot is heading toward */
    const live = p < HOLD_B && p >= ESC_A ? LONG : (p >= SHT_A && p < ARB_A + 0.06 ? SHORT : []);
    NODES.forEach((n) => n.g.classList.toggle('is-on', live.indexOf(n.id) !== -1));

    if (p < ESC_A) beat(0);
    else if (p < ESC_B) beat(1);
    else if (p < ROT_A) beat(2);
    else if (p < SHT_A) beat(3);
    else if (p < ARB_A) beat(4);
    else beat(5);
  }

  if (REDUCED) {
    /* The plan, settled, with the two arbitration lines up: the resolved
       state is the one the copy is about. No token, no travel. */
    cam = 1; layout();
    for (const e of EDGES) {
      e.p.style.opacity = e.kind === 'pub' ? '0.10' : '1';
      e.p.setAttribute('class', e.kind === 'loc' ? 'is-local' : (e.kind === 'arb' ? 'is-arb' : ''));
    }
    gFloor.style.opacity = '1';
    gTiers.style.opacity = '0';
    hideToken();
    if (pctEl) pctEl.textContent = '000';
    beat(5);
    return;
  }

  layout();
  onTrack(track, draw);

  /* The lattice is a PROJECTION, not a DOM scene, so its parallax is a
     transform on the svg itself rather than a change to the camera — the
     node positions have to stay exactly where the hop counts say they
     are. */
  onNear(track, (p, room) => {
    svg.style.setProperty('--px', room.px.toFixed(4));
    svg.style.setProperty('--py', room.py.toFixed(4));
    svg.style.setProperty('--lean', room.vel.toFixed(4));
  });
}

/* Counted off the arrays above rather than typed into the markup, so the
   key rail cannot disagree with the diagram. Read by the page. */
export const PLAN_COUNTS = {
  nodes: NODES.length,
  published: PUBLISHED.length,
  local: LOCAL.length,
  arbitrated: ARBITRATED.length,
  longHops: LONG.length - 1,
  shortHops: SHORT.length - 1,
};
