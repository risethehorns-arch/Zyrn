/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE BAY   (services.html)

   Five services standing in one room as slabs of glass, and a scroll that
   walks the reader along them. Replaced `orbit.js` on 2026-09-28 at the
   owner's direction; v2 the same day — the drag "looked like it was
   bugging", and the owner asked for more vibrance and a way of opening a
   service that is its own moment.

   ── THE ROOM ────────────────────────────────────────────────────────
   The slabs stand on the inside of a cylinder whose axis is BETWEEN the
   reader and the slab in front:

       phi   = (i - focus) * A          where a slab is, round the curve
       x     = R sin(phi)
       z     = R (1 - cos(phi))         toward the reader as it goes round
       turn  = rotateY(-phi)            and it faces the axis

   ── ONE SPRING (v2) ─────────────────────────────────────────────────
   v1 rendered `focus` straight from the scroll plus a drag offset, and the
   drag offset decayed on its own clock when the hand let go. The scroll
   it handed over to rests on a PLATEAU at each stop (smootherstep), so
   for the first fifth of the scroll the offset fell faster than the
   scroll rose: release a slab half-way to the next and it swung BACK
   toward where it came from, then forward again. That was the "bugging".

   Now what is drawn is `fView`, a critically damped spring, and only its
   TARGET changes hands:

       the scroll        focusOf(progress)          at rest and scrolling
       the hand          where the pointer has it   while dragging (stiff)
       a destination     a whole number             after a release, a
                                                    pip, a key, a click —
                                                    held until the scroll
                                                    has actually arrived

   A spring cannot jump and never reverses on its own, so nothing that
   hands over can swing back. It also makes a four-slab hop from the HUD a
   single sweep rather than four stops, because the destination is held
   while the scroll passes through the intermediate plateaus.

   ── THE HANDOFF ─────────────────────────────────────────────────────
   Five things at once, all from `fView`: the curve turns; the camera
   breathes (back while moving, in on the result — the field's dolly
   law); the leaving slab powers down and the arriving one up (`--on`);
   the reticle closes on what lands; and the floor's lights trail by how
   fast it is actually turning. The room takes the arriving slab's
   CHANNEL (`--hc`, one stop of the field's ramp) as it comes round.

   ── OPENING A SERVICE ───────────────────────────────────────────────
   THE CUT (bay.css): the slab steps forward to face the reader, is
   sheared open along its seam the way the wordmark is, and the seam opens
   into the next page while field.js morphs the bed to its formation.

   Reduced motion, or no JavaScript: `.is-live` is never added and the
   five are a plain grid. The figures are still plotted.
   ══════════════════════════════════════════════════════════════════════ */

import { onNear, swapText, pad3, REDUCED, COARSE } from './_track.js';
import { LINES as COVER, DIMENSIONS } from './lines.js';

const N = 7;                   // four lines, the system, two programmes
const DEG = Math.PI / 180;
const A_RUN = 36 * DEG;          // between neighbours, while walking
const A_FAN = 15 * DEG;          // and when all seven are in one view
const PERSP = 3.0;               // camera distance, in rig heights

/* the score, in track progress */
const OPEN_A = 0.015, OPEN_B = 0.105;   // the core alone, then the seams open
const RUN_A  = 0.105, RUN_B  = 0.895;   // the walk: five stops
const FAN_A  = 0.915, FAN_B  = 0.985;   // all five, in one view
const EDGE   = 0.06;                    // how far inside the walk the first stop sits
const STEP   = (1 - 2 * EDGE) / (N - 1);

/* the spring, in radians per second — higher is tighter */
const W_REST = 10.5;             // following the scroll
const W_HAND = 34;               // following the hand
const W_HOLD = 11;               // travelling to a destination (per slab, scaled)

const STEP_MS = 280;             // the slab steps forward before it is cut
const CUT_NAV = 300;             // the cut runs this long before field.js takes over

const NAMES = ['WEBSITE DESIGN', 'BRAND KIT', 'BUSINESS STRUCTURING', 'AI ADOPTION', 'CUSTOMIZABLE CRM', 'AI AGENT TRAINING', 'BOT BUILDING'];
const AXIS  = ['SUR', 'IDE', 'AUT', 'WOR', 'MEA'];

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (p, a, b) => {
  const t = clamp01((p - a) / Math.max(1e-5, b - a));
  return t * t * (3 - 2 * t);
};
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const pad2 = (n) => String(n).padStart(2, '0');
/* past either end the curve gives, and gives less the further it goes */
const rubber = (x) => 0.42 * x / (1 + 1.3 * x);

/** Progress at which slab `k` is square to the reader. */
export const stopOf = (k) => RUN_A + (RUN_B - RUN_A) * (EDGE + STEP * k);

function focusOf(p) {
  const t = ((p - RUN_A) / (RUN_B - RUN_A) - EDGE) / STEP;     // 0..4 across the stops
  if (t <= 0) return 0;
  if (t >= N - 1) return N - 1;
  const k = Math.floor(t);
  return k + smoother(clamp01((t - k - 0.2) / 0.6));
}

function docTop(el) {
  let t = 0, n = el;
  while (n) { t += n.offsetTop; n = n.offsetParent; }
  return t;
}

function hexRgb(h, fallback) {
  const m = /^#?([0-9a-f]{6})$/i.exec((h || '').trim());
  if (!m) return fallback;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** A slab's channel, out of its own `--hc` — the markup is the one source. */
function hueOf(el) {
  const v = getComputedStyle(el).getPropertyValue('--hc').trim().split(/[\s,]+/).map(Number);
  return v.length === 3 && v.every((n) => isFinite(n)) ? v : [201, 192, 252];
}

/* ── the figures ─────────────────────────────────────────────────────
   A line's coverage by dimension, out of lines.js — the same five
   numbers the matrix below combines, so the two cannot disagree. The CRM
   is not in that table ("a build, not a claim about coverage"), so its
   figure is the forty-eight records its own page opens on.

   Drawn at the chart's REAL pixel size, rebuilt on resize. v1 stretched a
   fixed viewBox, which forced a non-scaling stroke, which measures dashes
   in screen units — so nothing could travel along the line. At true size
   the comet can, and a circle is a circle. */
const NS = 'http://www.w3.org/2000/svg';
function mk(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function plotFigures(panels) {
  panels.forEach((el, i) => {
    const svg = el.querySelector('.bay__cov');
    const ax = el.querySelector('.bay__ax');
    const key = el.querySelector('.bay__k');
    if (!svg) return;
    const w = Math.round(svg.clientWidth), h = Math.round(svg.clientHeight);
    if (w < 24 || h < 12) return;                       // hidden at this size
    if (svg.__w === w && svg.__h === h) return;
    svg.__w = w; svg.__h = h;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    const kind = el.getAttribute('data-fig') || (COVER[i] ? 'cover' : 'records');
    const line = kind === 'cover' ? COVER[i] : null;
    const padX = 5, top = 5, bot = h - 2;
    if (kind === 'loop') {
      /* the agent loop: brief → work → gate → return, and round again */
      const cx = w / 2, cy = h / 2, rx = Math.min(w * 0.42, h * 1.6), ry = h * 0.36;
      const pts = [0, 1, 2, 3].map((k) => { const a = (-90 + k * 90) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
      const d = 'M' + pts.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
      svg.appendChild(mk('path', { class: 'bs', d }));
      svg.appendChild(mk('path', { class: 'ln', d }));
      svg.appendChild(mk('path', { class: 'cm', d, pathLength: 1 }));
      pts.forEach((q, k) => svg.appendChild(mk('circle', { class: k === 2 ? 'pk' : 'dt', cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: k === 2 ? 3 : 2.2, style: '--i:0' })));
      svg.appendChild(mk('circle', { class: 'pr', cx: pts[2][0].toFixed(1), cy: pts[2][1].toFixed(1), r: 3 }));
      if (ax && !ax.childNodes.length) ['BRIEF', 'WORK', 'GATE', 'BACK'].forEach((t, k) => {
        const s = document.createElement('span'); s.textContent = t; if (k === 2) s.className = 'is-peak';
        s.style.left = ((k === 0 || k === 2 ? cx : k === 1 ? pts[1][0] : pts[3][0]) / w * 100).toFixed(1) + '%'; ax.appendChild(s);
      });
      if (key) key.textContent = 'THE LOOP — YOUR HAND ON THE GATE';
      return;
    }
    if (kind === 'lanes') {
      /* three channels into one bot, out to the firm's systems, and one
         hand-over to a person */
      const x0 = padX, x1 = w * 0.44, x2 = w * 0.62, x3 = w - padX, cy = h / 2;
      const ys = [top + 2, cy, bot - 2];
      let d = '';
      ys.forEach((y) => { d += 'M' + x0 + ' ' + y.toFixed(1) + 'C' + (x0 + (x1 - x0) * 0.6).toFixed(1) + ' ' + y.toFixed(1) + ' ' + (x1 - 8).toFixed(1) + ' ' + cy.toFixed(1) + ' ' + x1.toFixed(1) + ' ' + cy.toFixed(1); });
      svg.appendChild(mk('path', { class: 'bs', d }));
      svg.appendChild(mk('path', { class: 'ln', d }));
      svg.appendChild(mk('path', { class: 'cm', d: 'M' + x0 + ' ' + ys[1].toFixed(1) + 'L' + x1.toFixed(1) + ' ' + cy.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + cy.toFixed(1) + 'L' + x3 + ' ' + ys[0].toFixed(1), pathLength: 1 }));
      svg.appendChild(mk('path', { class: 'ln', d: 'M' + x2.toFixed(1) + ' ' + cy.toFixed(1) + 'C' + (x2 + 14).toFixed(1) + ' ' + cy.toFixed(1) + ' ' + (x3 - 10).toFixed(1) + ' ' + ys[0].toFixed(1) + ' ' + x3 + ' ' + ys[0].toFixed(1) + 'M' + x2.toFixed(1) + ' ' + cy.toFixed(1) + 'C' + (x2 + 14).toFixed(1) + ' ' + cy.toFixed(1) + ' ' + (x3 - 10).toFixed(1) + ' ' + ys[2].toFixed(1) + ' ' + x3 + ' ' + ys[2].toFixed(1) }));
      svg.appendChild(mk('circle', { class: 'pr', cx: ((x1 + x2) / 2).toFixed(1), cy: cy.toFixed(1), r: 3 }));
      svg.appendChild(mk('circle', { class: 'pk', cx: ((x1 + x2) / 2).toFixed(1), cy: cy.toFixed(1), r: 3.4 }));
      ys.forEach((y) => svg.appendChild(mk('circle', { class: 'dt', cx: x0, cy: y.toFixed(1), r: 2, style: '--i:0' })));
      [ys[0], ys[2]].forEach((y) => svg.appendChild(mk('circle', { class: 'dt', cx: x3, cy: y.toFixed(1), r: 2, style: '--i:0' })));
      if (ax && !ax.childNodes.length) [['CHANNELS', x0 + 14], ['THE BOT', (x1 + x2) / 2], ['YOUR SYSTEMS', x3 - 24]].forEach((t, k) => {
        const s = document.createElement('span'); s.textContent = t[0]; if (k === 1) s.className = 'is-peak';
        s.style.left = (t[1] / w * 100).toFixed(1) + '%'; ax.appendChild(s);
      });
      if (key) key.textContent = 'THE ROUTE — IN, LOOKED UP, OUT';
      return;
    }
    if (line) {
      const xs = line.c.map((_, j) => padX + j * (w - 2 * padX) / 4);
      const ys = line.c.map((c) => bot - c * (bot - top));
      const pts = xs.map((x, j) => x.toFixed(1) + ' ' + ys[j].toFixed(1));
      const gid = 'bayg' + i;
      const defs = mk('defs', {});
      const g = mk('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 });
      g.appendChild(mk('stop', { offset: 0, 'stop-opacity': 0.42 }));
      g.appendChild(mk('stop', { offset: 1, 'stop-opacity': 0 }));
      defs.appendChild(g);
      svg.appendChild(defs);
      xs.forEach((x) => svg.appendChild(mk('path', { class: 'tk', d: 'M' + x.toFixed(1) + ' ' + top + 'V' + bot })));
      svg.appendChild(mk('path', { d: 'M' + padX + ' ' + bot + 'L' + pts.join('L') + 'L' + (w - padX) + ' ' + bot + 'Z', fill: 'url(#' + gid + ')' }));
      svg.appendChild(mk('path', { class: 'bs', d: 'M0 ' + bot + 'H' + w }));
      const d = 'M' + pts.join('L');
      svg.appendChild(mk('path', { class: 'ln', d }));
      svg.appendChild(mk('path', { class: 'cm', d, pathLength: 1 }));
      let peak = 0;
      line.c.forEach((c, j) => { if (c > line.c[peak]) peak = j; });
      svg.appendChild(mk('circle', { class: 'pr', cx: xs[peak].toFixed(1), cy: ys[peak].toFixed(1), r: 3 }));
      svg.appendChild(mk('circle', { class: 'pk', cx: xs[peak].toFixed(1), cy: ys[peak].toFixed(1), r: 3 }));
      if (ax && !ax.childNodes.length) {
        AXIS.forEach((a, j) => {
          const s = document.createElement('span');
          s.textContent = a;
          if (j === peak) s.className = 'is-peak';
          ax.appendChild(s);
        });
      }
      if (ax) Array.prototype.forEach.call(ax.children, (s, j) => { s.style.left = (xs[j] / w * 100).toFixed(2) + '%'; });
      if (key) key.textContent = 'COVERAGE — PEAK ' + DIMENSIONS[peak][0];
    } else {
      const r = Math.max(1.4, Math.min(2.4, h / 16));
      for (let row = 0; row < 4; row++) for (let c = 0; c < 12; c++) {
        const k = row * 12 + c;
        const dot = mk('circle', {
          class: 'dt' + (k % 5 === 2 ? ' tw' : ''),
          cx: (padX + c * (w - 2 * padX) / 11).toFixed(1),
          cy: (top + row * (bot - top - 2) / 3).toFixed(1), r,
        });
        dot.style.setProperty('--i', String(k));
        if (k % 5 === 2) dot.style.animationDelay = (-(k * 0.37) % 2.8).toFixed(2) + 's';
        svg.appendChild(dot);
      }
      if (key) key.textContent = 'THE RECORDS — 48, NONE ADDED';
    }
  });
}

export function initBay() {
  const sec = document.getElementById('sigBay');
  const rig = document.getElementById('bay');
  const view = document.getElementById('bayView');
  const scene = document.getElementById('bayScene');
  if (!sec || !rig || !view || !scene) return;

  const panels = Array.prototype.slice.call(scene.querySelectorAll('.bay__p'));
  if (panels.length !== N) return;
  const hues = panels.map(hueOf);

  if (REDUCED) {
    /* the grid, with its figures, redrawn as its columns change width */
    plotFigures(panels);
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => plotFigures(panels)).observe(scene);
    return;
  }

  const track  = sec.querySelector('.sig__track');
  const stage  = sec.querySelector('.sig__stage');
  const canvas = document.getElementById('bayRoom');
  const ret    = document.getElementById('bayRet');
  const stepEl = document.getElementById('bayStep');
  const pctEl  = document.getElementById('bayPct');
  const nameEl = document.getElementById('bayName');
  const prevEl = document.getElementById('bayPrev');
  const nextEl = document.getElementById('bayNext');
  const pips   = Array.prototype.slice.call(sec.querySelectorAll('.bay__pip'));
  const specs  = panels.map((el) => el.querySelector('.bay__spec'));
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

  const memo = panels.map(() => ({ tf: '', on: -1, vis: -1, hid: null, front: false, sp: '', so: '' }));

  sec.classList.add('is-live');

  /* ── measured on resize, never in the frame ─────────────────────── */
  const G = { H: 0, W: 0, pw: 0, ph: 0, R: 0, Rf: 0, Rc: 0, P: 0, gap: 0, yf: 0,
              cw: 0, ch: 0, dpr: 1, vx: 0, vy: 0, fanPull: 0, vr: null, vrT: 0 };
  function measure() {
    const H = view.clientHeight, W = view.clientWidth;
    if (!H || !W) return;
    const narrow = W < 0.95 * H * 1.35;
    const pw = Math.min(0.56 * H, 0.66 * W);
    const ph = Math.min(0.80 * H, pw / (narrow ? 0.56 : 0.70));
    const gap = Math.max(0.05 * H, Math.min(0.09 * W, 0.2 * H));
    /* the radius that puts a neighbour's near edge one `gap` clear of the
       slab in front, at A_RUN round the curve */
    const R = (pw / 2 * (1 + Math.cos(A_RUN)) + gap) / Math.sin(A_RUN);
    const P = PERSP * H;
    /* THE FAN has its own radius: closing the angle at the walking radius
       would stand each slab on top of the next */
    const Rf = (pw / 2 * (1 + Math.cos(A_FAN)) + Math.max(0.03 * H, gap * 0.5)) / Math.sin(A_FAN);
    /* and the camera steps back exactly as far as the window needs */
    const phi = (N - 1) / 2 * A_FAN;
    const xo = Rf * Math.sin(phi) + pw / 2 * Math.cos(phi);
    const zo = Rf * (1 - Math.cos(phi)) + pw / 2 * Math.sin(phi);
    const want = (W / 2 - Math.max(12, 0.045 * W)) / xo;
    const fanPull = Math.max(0.55 * H, P / Math.min(0.92, want) - P + zo);

    Object.assign(G, { H, W, pw, ph, R, Rf, P, gap, fanPull, yf: ph / 2 + 0.045 * H });
    rig.style.setProperty('--pw', pw.toFixed(1) + 'px');
    rig.style.setProperty('--ph', ph.toFixed(1) + 'px');
    rig.style.setProperty('--bu', (ph / 100).toFixed(3) + 'px');
    rig.dataset.size = ph < 250 ? 'xs' : ph < 350 ? 's' : 'm';
    view.style.perspective = P.toFixed(0) + 'px';

    G.vr = view.getBoundingClientRect();
    if (ctx) {
      const sr = stage.getBoundingClientRect();
      G.cw = sr.width; G.ch = sr.height;
      G.vx = G.vr.left - sr.left; G.vy = G.vr.top - sr.top;
      G.dpr = Math.min(window.devicePixelRatio || 1, sr.width > 1920 ? 1.25 : 1.5);
      canvas.width = Math.round(G.cw * G.dpr);
      canvas.height = Math.round(G.ch * G.dpr);
    }
    for (const m of memo) { m.tf = ''; m.on = -1; m.vis = -1; }
    plotFigures(panels);
  }

  /* ── state ──────────────────────────────────────────────────────── */
  let pNow = 0, lastP = -1;
  let shownBeat = -2, shownIdx = -2;
  let fView = null, vView = 0;               // what is drawn, and how fast it moves
  let hold = null;                           // { to, t0, w } — a destination
  let drag = null;                           // the hand
  let grab = 0, press = 0;                   // eased: dragging, pressing
  const hov = { x: 0, y: 0, in: false };     // the pointer over the slab in front
  let hovMix = 0;
  let opening = null;                        // { i, a, t0, built, ov }
  let passing = false, swallow = false;
  let floorPrev = 0, omega = 0, lastT = 0;
  let pulseT = -1e9, settled = -1;
  let hueKey = '';
  let hc = hues[0];
  const pal = { a: [143, 124, 249], b: [201, 192, 252], c: [242, 243, 245] };
  let palTick = 0;
  const cam = { pull: 0, sa: 0, ca: 1, sb: 0, cb: 1 };

  function readPalette() {
    const cs = getComputedStyle(document.documentElement);
    pal.a = hexRgb(cs.getPropertyValue('--glint-1'), pal.a);
    pal.b = hexRgb(cs.getPropertyValue('--glint-2'), pal.b);
    pal.c = hexRgb(cs.getPropertyValue('--glint-3'), pal.c);
  }
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a.toFixed(3) + ')';
  function hueAt(f) {
    const k = clamp(f, 0, N - 1), a = Math.floor(k), b = Math.min(N - 1, a + 1), t = k - a;
    return [0, 1, 2].map((c) => lerp(hues[a][c], hues[b][c], t));
  }

  /* The CSS scene's camera, for the canvas. Order matches the transform
     in bay.css: turned about Y, then about X, then pushed back. */
  function project(X, Y, Z, out) {
    const x = X * cam.cb + Z * cam.sb;
    const z0 = -X * cam.sb + Z * cam.cb;
    const y = Y * cam.ca - z0 * cam.sa;
    const z = Y * cam.sa + z0 * cam.ca - cam.pull;
    if (z > G.P * 0.9) { out.ok = false; return out; }
    const s = G.P / (G.P - z);
    const ox = G.vx + G.W * 0.5, oy = G.vy + G.H * 0.46;
    out.x = ox + x * s;
    out.y = oy + (G.H * 0.04 + y) * s;
    out.s = s; out.ok = true;
    return out;
  }
  const q0 = { x: 0, y: 0, s: 1, ok: true }, q1 = { x: 0, y: 0, s: 1, ok: true };

  function beat(i) {
    if (i === shownBeat) return;
    shownBeat = i;
    swapText(stepEl, i < 0 ? '00 — STANDBY'
      : i >= N ? '08 — ONE ROOM, SEVEN CHANNELS'
      : pad2(i + 1) + ' — ' + NAMES[i]);
  }
  function mark(k) {
    if (k === shownIdx) return;
    shownIdx = k;
    swapText(nameEl, k < 0 ? 'STANDBY' : k >= N ? 'ALL SEVEN' : NAMES[k]);
    pips.forEach((b, j) => {
      if (j === k) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    if (prevEl) prevEl.disabled = k === 0;
    if (nextEl) nextEl.disabled = k === N - 1 || k >= N;
  }

  /* ── one frame ──────────────────────────────────────────────────── */
  let readIdx = 0;
  function frame(p, room) {
    const now = performance.now();
    const dt = lastT ? Math.min(50, now - lastT) : 16.7;
    lastT = now;
    pNow = p;
    if (p !== lastP) { lastP = p; if (pctEl) pctEl.textContent = pad3(p); }

    const open = ramp(p, OPEN_A, OPEN_B);
    const fan  = ramp(p, FAN_A, FAN_B);
    const A = lerp(A_RUN, A_FAN, fan);
    G.Rc = lerp(G.R, G.Rf, fan);

    /* ── the spring ─────────────────────────────────────────────────
       The target changes hands; the drawn value never jumps. */
    const fs = focusOf(p);
    if (hold && (Math.abs(fs - hold.to) < 0.006 || now - hold.t0 > 2600)) hold = null;
    const target = drag && drag.live ? drag.f : hold ? hold.to : fs;
    if (fView === null) { fView = target; vView = 0; }
    const w = drag && drag.live ? W_HAND : hold ? hold.w : W_REST;
    const h = dt / 1000 / 3;
    for (let s = 0; s < 3; s++) {
      vView += (w * w * (target - fView) - 2 * w * vView) * h;
      fView += vView * h;
    }
    if (Math.abs(target - fView) < 1e-4 && Math.abs(vView) < 2e-3) { fView = target; vView = 0; }

    const k1 = 1 - Math.exp(-dt / 90), k2 = 1 - Math.exp(-dt / 60), k3 = 1 - Math.exp(-dt / 150);
    grab += ((drag && drag.live ? 1 : 0) - grab) * k1;
    press += ((drag ? 1 : 0) - press) * k2;
    hovMix += ((hov.in && !drag && !opening && fan < 0.5 && open > 0.9 ? 1 : 0) - hovMix) * k3;

    let f = lerp(clamp(fView, -0.45, N - 0.55), (N - 1) / 2, fan);
    const near = clamp(Math.round(f), 0, N - 1);
    const frac = f - Math.floor(f);
    /* the camera is back while the room is MOVING — on the way between two
       stops, or while the spring is travelling several at once (a pip),
       where the per-stop sine alone would breathe in and out at each */
    const speed = Math.min(1, Math.abs(vView) / 2.6);
    const transit = Math.max(Math.abs(Math.sin(Math.PI * frac)), speed) * (1 - fan);
    const calm = transit * (1 - 0.65 * grab);    // under the hand, it does not zoom away

    /* opening: the chosen slab steps forward, the room lets go of it */
    const dv = opening ? smoother(clamp01((now - opening.t0) / STEP_MS)) : 0;
    const keep = 1 - dv;

    /* the camera */
    cam.pull = (calm * 0.30 * G.H + fan * G.fanPull + (1 - open) * 0.10 * G.H + press * 0.028 * G.H) * keep;
    const tilt = (calm * 2.6 + fan * 3.2) * keep;
    const rpx = room.px * keep, rpy = room.py * keep, rvel = room.vel * keep;
    const ax = (tilt + rpy * 1.4) * DEG;
    const ay = (rpx * -2.2 + rvel * 1.6) * DEG;
    cam.sa = Math.sin(ax); cam.ca = Math.cos(ax);
    cam.sb = Math.sin(ay); cam.cb = Math.cos(ay);
    rig.style.setProperty('--pull', cam.pull.toFixed(1));
    rig.style.setProperty('--tilt', tilt.toFixed(3));
    rig.style.setProperty('--px', rpx.toFixed(4));
    rig.style.setProperty('--py', rpy.toFixed(4));
    rig.style.setProperty('--lean', rvel.toFixed(4));

    /* the room's channel: the arriving slab's, blended as it comes round */
    hc = opening ? hues[opening.i] : fan > 0.5 ? hueAt(lerp(f, 4, fan)) : hueAt(f);
    const hk = Math.round(hc[0]) + ' ' + Math.round(hc[1]) + ' ' + Math.round(hc[2]);
    if (hk !== hueKey) { hueKey = hk; sec.style.setProperty('--hcur', hk); }

    const frontI = opening ? opening.i : fan > 0.5 ? -1 : near;

    /* the slabs */
    /* A slab comes into view at 1.5 places out, not 1.78: on the inside of
       the cylinder the slab two places round is NEARER the reader, and at
       1.55 it projected taller than the stage and reached into the head
       (seven stops put rigfit's samples mid-handoff, where five had landed
       them on the stops). Faded over 0.5 so the neighbours at rest, one
       place out, are still whole. */
    const reach = lerp(1.5, (N - 1) / 2 + 0.75, fan * fan);   // the outer slabs arrive once the camera has stepped back
    for (let i = 0; i < N; i++) {
      const el = panels[i], m = memo[i];
      const d = i - f, ad = Math.abs(d);
      let vis = clamp01((reach - ad) / lerp(0.5, 0.72, fan));
      const born = i === 0 ? ramp(open, 0.08, 0.66) : ramp(open, 0.34, 1);
      let on = smoother(clamp01(1 - ad * 1.08)) * ramp(born, 0.55, 1);
      on = Math.max(on, fan * 0.9);
      if (born <= 0) vis = 0;
      const mine = opening && opening.i === i;
      if (opening && !mine) vis *= keep;
      if (mine) { on = 1; vis = opening.built ? 0 : 1; }

      const hid = vis <= 0.002;
      if (hid !== m.hid) { m.hid = hid; el.style.visibility = hid ? 'hidden' : 'visible'; }
      if (hid) {
        /* out of the way of the field's keep-out rects as well as of the
           eye: a hidden slab still has a box */
        if (m.tf !== 'x') { m.tf = 'x'; el.style.transform = 'scale(0.001)'; }
        continue;
      }
      let phi = d * A;
      let x = G.Rc * Math.sin(phi);
      let z = G.Rc * (1 - Math.cos(phi));
      if (mine) {
        phi *= keep; x *= keep;
        z = lerp(z, 0.07 * G.H, dv);
      } else if (opening) {
        x += (d < 0 ? -1 : 1) * dv * G.pw * 0.7;
      }
      let ry = -phi / DEG, rx = 0;
      if (i === near && !opening && fan < 0.5) {
        ry += hov.x * 7 * hovMix;
        rx = -hov.y * 5 * hovMix;
      }
      const sy = Math.max(0.004, born);
      const tf = 'translate3d(' + x.toFixed(2) + 'px,0,' + z.toFixed(2) + 'px) rotateY(' + ry.toFixed(3) +
                 'deg)' + (rx ? ' rotateX(' + rx.toFixed(3) + 'deg)' : '') +
                 (sy < 1 ? ' scale3d(1,' + sy.toFixed(4) + ',1)' : '');
      if (tf !== m.tf) { m.tf = tf; el.style.transform = tf; }

      const onR = Math.round(on * 200) / 200, visR = Math.round(vis * 100) / 100;
      if (onR !== m.on) { m.on = onR; el.style.setProperty('--on', String(onR)); }
      if (visR !== m.vis) { m.vis = visR; el.style.setProperty('--vis', String(visR)); }

      const isF = i === frontI && on > 0.55;
      if (isF !== m.front) { m.front = isF; el.classList.toggle('is-front', isF); }

      /* the specular follows the pointer across the slab in front */
      const sp = specs[i];
      if (sp) {
        const lit = i === near ? hovMix * on : 0;
        const so = lit.toFixed(2);
        if (so !== m.so) { m.so = so; sp.style.opacity = so; }
        if (lit > 0.005) {
          const st = 'translate3d(' + (hov.x * 34).toFixed(1) + '%,' + (hov.y * 34).toFixed(1) + '%,0)';
          if (st !== m.sp) { m.sp = st; sp.style.transform = st; }
        }
      }
    }

    /* the readouts: a destination is named the moment it is chosen; while
       the room is simply moving, the name changes only once the next slab
       is clearly the nearer — so a hand hovering at the half-way point
       does not flicker the HUD */
    if (hold) readIdx = hold.to;
    else if (Math.abs(f - readIdx) > 0.62) readIdx = near;
    if (open < 0.5) { beat(-1); mark(-1); }
    else if (fan > 0.5) { beat(N); mark(N); }
    else { beat(readIdx); mark(readIdx); }

    /* a slab has landed: one pulse across the floor */
    const still = transit < 0.05 && open > 0.98 && fan < 0.02 && !drag && !hold;
    if (still && settled !== near) { settled = near; pulseT = now; }
    if (!still && transit > 0.4) settled = -1;

    /* the reticle: in the gap to the right of the slab in front, turning
       with the curve, and closing on whatever lands */
    if (ret) {
      const gx = lerp(0, G.pw / 2 + G.gap / 2, open);
      const lock = 1 - 0.22 * (1 - transit) * open;
      /* at the start it rings the field's own core */
      const sc = lerp(4.4, 1, open) * lock * (1 + 0.04 * Math.sin(now / 900));
      const spin = f * 120 + now / 140;
      ret.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,0,0) rotate(' + spin.toFixed(2) +
                            'deg) scale(' + sc.toFixed(3) + ')';
      ret.style.opacity = ((0.55 + 0.45 * transit) * (1 - fan) * keep).toFixed(3);
    }

    if (opening && !opening.built && dv >= 1) {
      /* one more frame at rest, so the rect read is the settled one */
      if (opening.ready) cut(); else opening.ready = true;
    }

    if (ctx) paint(now, dt, f, A, open, fan, transit, dv);
  }

  /* ── the room ───────────────────────────────────────────────────── */
  const RINGS = [0.42, 0.7, 1, 1.36, 1.85, 2.5, 3.4, 4.6];
  const SPHERE = (() => {
    const pts = [], n = 300, ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = ga * i;
      pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
    }
    return pts;
  })();

  function arc(r, t0, t1, y) {
    /* a stretch of a floor ring, as a polyline through the camera */
    const n = Math.max(2, Math.ceil(Math.abs(t1 - t0) / (5 * DEG)));
    let pen = false;
    for (let k = 0; k <= n; k++) {
      const t = t0 + (t1 - t0) * k / n;
      project(r * Math.sin(t), y, G.Rc - r * Math.cos(t), q0);
      if (!q0.ok) { pen = false; continue; }
      if (pen) ctx.lineTo(q0.x, q0.y); else { ctx.moveTo(q0.x, q0.y); pen = true; }
    }
  }

  function paint(now, dt, f, A, open, fan, transit, dv) {
    if ((palTick++ % 20) === 0) readPalette();
    const { H, yf } = G;
    const R = G.Rc;
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    ctx.clearRect(0, 0, G.cw, G.ch);
    ctx.lineCap = 'round';
    const fade = 1 - 0.75 * dv;

    /* the floor turns with the curve, and a little with the scroll while a
       slab is read — so the page never moves without the room answering */
    const floorA = -f * A - pNow * 1.1;
    const w = (floorA - floorPrev) / Math.max(1, dt) * 1000;
    floorPrev = floorA;
    omega += (clamp(w, -3, 3) - omega) * 0.16;

    const lit = (0.35 + 0.65 * open) * fade;
    const tint = [lerp(pal.c[0], hc[0], 0.55), lerp(pal.c[1], hc[1], 0.55), lerp(pal.c[2], hc[2], 0.55)];

    /* the glow under each slab: its light, pooled on the floor */
    for (let i = 0; i < N; i++) {
      const m = memo[i];
      if (m.hid || m.vis <= 0 || m.on <= 0.02) continue;
      const phi = (i - f) * A;
      project(R * Math.sin(phi), yf, R * (1 - Math.cos(phi)), q0);
      if (!q0.ok) continue;
      const rr = G.pw * 0.75 * q0.s;
      ctx.save();
      ctx.translate(q0.x, q0.y);
      ctx.scale(1, 0.22);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
      g.addColorStop(0, rgba(hues[i], 0.34 * m.on * m.vis * fade));
      g.addColorStop(1, rgba(hues[i], 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, 6.283); ctx.fill();
      ctx.restore();
    }

    /* rings */
    for (let j = 0; j < RINGS.length; j++) {
      const r = R * RINGS[j];
      const rail = RINGS[j] === 1;
      ctx.beginPath();
      arc(r, -Math.PI, Math.PI, yf);
      ctx.lineWidth = rail ? 1.3 : 1;
      ctx.strokeStyle = rail ? rgba(hc, 0.34 * lit) : rgba(tint, (0.11 - j * 0.0095) * lit);
      ctx.stroke();
    }
    /* spokes */
    const SP = 30, zmax = G.P * 0.78;
    ctx.beginPath();
    for (let k = 0; k < SP; k++) {
      const t = floorA + k * (2 * Math.PI / SP);
      const c = Math.cos(t), s = Math.sin(t);
      let r1 = R * RINGS[RINGS.length - 1];
      if (c < -0.02) r1 = Math.min(r1, (zmax + cam.pull * 0.6 - R) / -c);
      const r0 = R * RINGS[0];
      if (r1 <= r0) continue;
      project(r0 * s, yf, R - r0 * c, q0);
      project(r1 * s, yf, R - r1 * c, q1);
      if (!q0.ok || !q1.ok) continue;
      ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(tint, 0.06 * lit);
    ctx.stroke();

    /* the lights on the floor, trailing by how fast it turns */
    const trail = clamp(omega * 0.2, -0.9, 0.9);
    const hot = Math.min(1, Math.abs(trail) * 2.4);
    for (let m = 0; m < 21; m++) {
      const r = R * RINGS[2 + (m % 3)];
      const t = floorA * (1 + (m % 3) * 0.18) + m * (2 * Math.PI / 21);
      if (hot > 0.02) {
        for (let k = 0; k < 5; k++) {
          ctx.beginPath();
          arc(r, t - trail * (k / 5), t - trail * ((k + 1) / 5), yf);
          ctx.lineWidth = 1.8 - k * 0.25;
          ctx.strokeStyle = rgba(k < 1 ? pal.c : hc, (0.7 - k * 0.12) * hot * lit);
          ctx.stroke();
        }
      }
      project(r * Math.sin(t), yf, R - r * Math.cos(t), q0);
      if (q0.ok) {
        ctx.beginPath();
        ctx.arc(q0.x, q0.y, Math.max(0.7, 1.3 * q0.s), 0, 6.283);
        ctx.fillStyle = rgba(m % 4 ? hc : pal.c, (0.36 + 0.5 * hot) * lit);
        ctx.fill();
      }
    }

    /* under every slab, the stretch of rail it stands on, in its channel */
    for (let i = 0; i < N; i++) {
      const m = memo[i];
      if (m.hid || m.vis <= 0) continue;
      const phi = (i - f) * A;
      const span = (7 + 6 * m.on) * DEG;
      ctx.beginPath();
      arc(R, phi - span, phi + span, yf);
      ctx.lineWidth = 5 * m.on + 1;
      ctx.strokeStyle = rgba(hues[i], 0.12 * m.on * m.vis * fade);
      ctx.stroke();
      ctx.beginPath();
      arc(R, phi - span, phi + span, yf);
      ctx.lineWidth = 1.4 + 1.2 * m.on;
      ctx.strokeStyle = rgba(hues[i], (0.2 + 0.7 * m.on) * m.vis * fade);
      ctx.stroke();
    }

    /* a slab landed */
    const pa = (now - pulseT) / 1100;
    if (pa >= 0 && pa < 1) {
      const e = 1 - Math.pow(1 - pa, 3);
      ctx.beginPath();
      arc(R * lerp(0.25, 2.3, e), -Math.PI, Math.PI, yf);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = rgba(hc, 0.7 * (1 - pa) * (1 - pa) * fade);
      ctx.stroke();
    }

    /* the seam between two slabs, while the focus is between them */
    if (transit > 0.04 && !dv) {
      const k = Math.floor(f);
      const pa1 = (k - f) * A, pb1 = (k + 1 - f) * A;
      project(R * Math.sin(pa1), 0, R * (1 - Math.cos(pa1)), q0);
      project(R * Math.sin(pb1), 0, R * (1 - Math.cos(pb1)), q1);
      if (q0.ok && q1.ok) {
        const g = ctx.createLinearGradient(q0.x, q0.y, q1.x, q1.y);
        g.addColorStop(0, rgba(hues[clamp(k, 0, N - 1)], 0.6 * transit));
        g.addColorStop(1, rgba(hues[clamp(k + 1, 0, N - 1)], 0.6 * transit));
        ctx.beginPath();
        ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y);
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = g;
        ctx.stroke();
      }
    }

    /* THE CORE — alone in the room at the start, then home on the axis,
       low in the foreground, where the five were cut from. Between those
       it shows only while the camera is back. */
    const seen = Math.max(1 - open, Math.min(1, transit * 1.5), fan) * (1 - dv);
    if (seen > 0.01) {
      const cy = lerp(-0.04 * H, yf - 0.075 * H, open);
      const cz = lerp(0.2 * H, R, open);
      const cr = lerp(0.105, 0.036, open) * H * (1 + 0.35 * fan);
      const rot = now / 5200 + pNow * 6 + f * 0.9;
      const c0 = Math.cos(rot), s0 = Math.sin(rot);
      for (let i = 0; i < SPHERE.length; i++) {
        const s = SPHERE[i];
        const sx = s[0] * c0 + s[2] * s0, sz = -s[0] * s0 + s[2] * c0;
        project(sx * cr, cy + s[1] * cr, cz + sz * cr, q0);
        if (!q0.ok) continue;
        const front = (sz + 1) / 2;
        const c = front > 0.62 ? pal.c : front > 0.3 ? hc : pal.a;
        ctx.beginPath();
        ctx.arc(q0.x, q0.y, Math.max(0.5, (0.35 + 0.6 * front) * q0.s * (H / 700)), 0, 6.283);
        ctx.fillStyle = rgba(c, (0.16 + 0.8 * front) * seen);
        ctx.fill();
      }
    }
  }

  /* ── moving the reader ──────────────────────────────────────────── */
  function scrollTo(k) {
    const span = Math.max(1, track.offsetHeight - innerHeight);
    const top = docTop(track) + stopOf(k) * span;
    if (typeof window.__zyrnScrollTo === 'function') window.__zyrnScrollTo(top, 1100);
    else window.scrollTo({ top, behavior: 'smooth' });
  }
  /** Take the room to slab `k`: the view goes now, the page follows. */
  function go(k, lag) {
    k = clamp(k, 0, N - 1);
    const from = fView === null ? focusOf(pNow) : fView;
    hold = { to: k, t0: performance.now(), w: W_HOLD / Math.sqrt(Math.max(1, Math.abs(k - from))) };
    if (lag) setTimeout(() => scrollTo(k), lag); else scrollTo(k);
  }
  const current = () => clamp(Math.round(hold ? hold.to : fView === null ? focusOf(pNow) : fView), 0, N - 1);
  const inFan = () => pNow > (FAN_A + FAN_B) / 2;

  if (prevEl) prevEl.addEventListener('click', () => go(current() - 1));
  if (nextEl) nextEl.addEventListener('click', () => go(current() + 1));
  pips.forEach((b) => b.addEventListener('click', () =>
    go(parseInt(b.getAttribute('data-go'), 10) || 0)));

  /* ── THE CUT ────────────────────────────────────────────────────── */
  function cut() {
    const o = opening, el = panels[o.i];
    const r = el.getBoundingClientRect();
    const ov = document.createElement('div');
    ov.className = 'bay-open';
    ov.setAttribute('aria-hidden', 'true');
    ov.dataset.size = rig.dataset.size || 'm';
    const set = (k, v) => ov.style.setProperty(k, v);
    set('--hc', hues[o.i].join(' '));
    set('--x', r.left.toFixed(1) + 'px'); set('--y', r.top.toFixed(1) + 'px');
    set('--w', r.width.toFixed(1) + 'px'); set('--h', r.height.toFixed(1) + 'px');
    set('--sy', (r.top + r.height / 2).toFixed(1) + 'px');
    set('--bu', (r.height / 100).toFixed(3) + 'px');
    set('--ph', r.height.toFixed(1) + 'px');
    ov.innerHTML =
      '<span class="bay-open__band"></span>' +
      '<span class="bay-open__half bay-open__half--top"></span>' +
      '<span class="bay-open__half bay-open__half--bot"></span>' +
      '<span class="bay-open__flash"></span>' +
      '<span class="bay-open__edge bay-open__edge--up"></span>' +
      '<span class="bay-open__edge bay-open__edge--dn"></span>';
    Array.prototype.forEach.call(ov.querySelectorAll('.bay-open__half'), (half) => {
      const c = el.cloneNode(true);
      c.removeAttribute('style');
      c.removeAttribute('href');
      c.setAttribute('tabindex', '-1');
      c.style.setProperty('--hc', hues[o.i].join(' '));
      c.classList.add('is-front');
      Array.prototype.forEach.call(c.querySelectorAll('[id]'), (n) => n.removeAttribute('id'));
      half.appendChild(c);
    });
    document.body.appendChild(ov);
    o.ov = ov;
    o.built = true;
    /* then hand the page to field.js, which morphs the bed to the
       destination's formation and navigates. The click is our own, so the
       scene's handler lets it through. */
    setTimeout(() => {
      if (opening !== o) return;
      passing = true;
      try { o.a.click(); } finally { passing = false; }
    }, CUT_NAV);
  }
  function openSlab(i, a) {
    hold = null; drag = null;
    view.classList.remove('is-drag');
    opening = { i, a, t0: performance.now(), built: false, ready: false, ov: null };
  }
  addEventListener('pageshow', (e) => {
    if (!e.persisted || !opening) return;
    if (opening.ov) opening.ov.remove();
    opening = null;
    for (const m of memo) { m.tf = ''; m.hid = null; }
  });

  /* A slab is a link, and the one in front behaves like one. A neighbour
     comes to the front first — it is turned away and half read. When all
     five are in one view, any of them opens. Runs before field.js's
     handler on `document`, which leaves a prevented click alone. */
  scene.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('.bay__p');
    if (!a || passing) return;
    if (swallow) { swallow = false; e.preventDefault(); return; }
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (opening) return;
    const i = parseInt(a.getAttribute('data-i'), 10) || 0;
    if (!inFan() && i !== current()) { go(i); return; }
    openSlab(i, a);
  });

  /* keyboard focus brings a slab to the front, so what is focused is
     what is being shown */
  scene.addEventListener('focusin', (e) => {
    const a = e.target.closest && e.target.closest('.bay__p');
    if (!a || !a.matches(':focus-visible') || inFan() || opening) return;
    const i = parseInt(a.getAttribute('data-i'), 10) || 0;
    if (i !== current()) go(i);
  });

  /* ── the hand ───────────────────────────────────────────────────── */
  const slabStep = () => Math.max(40, G.R * Math.sin(A_RUN));   // px the hand moves per slab
  view.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || opening || inFan() || pNow < OPEN_B || pNow >= 1) return;
    drag = { id: e.pointerId, type: e.pointerType, x: e.clientX, y: e.clientY, live: false,
             base: 0, f: 0, lt: performance.now(), trail: [[performance.now(), e.clientX]] };
  });
  view.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) {
      /* the pointer over the slab in front, in its half-extents */
      if (COARSE || e.pointerType === 'touch') return;
      /* the view's rect is still while the section is pinned, which is the
         only time this matters; re-read it at most four times a second
         rather than on every scroll event */
      const t0 = performance.now();
      if (!G.vr || t0 - G.vrT > 250) { G.vr = view.getBoundingClientRect(); G.vrT = t0; }
      const cx = G.vr.left + G.vr.width / 2, cy = G.vr.top + G.vr.height / 2;
      const x = (e.clientX - cx) / (G.pw / 2), y = (e.clientY - cy) / (G.ph / 2);
      hov.in = Math.abs(x) < 1.08 && Math.abs(y) < 1.08;
      hov.x = clamp(x, -1, 1); hov.y = clamp(y, -1, 1);
      return;
    }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.live) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }  // the page's
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
      drag.live = true;
      drag.base = fView === null ? focusOf(pNow) : fView;   // from where it IS, not where the scroll is
      drag.x = e.clientX;
      hold = null;
      view.classList.add('is-drag');
      try { view.setPointerCapture(drag.id); } catch (err) { /* already gone */ }
    }
    let raw = drag.base - (e.clientX - drag.x) / slabStep();
    if (raw < 0) raw = -rubber(-raw);
    if (raw > N - 1) raw = N - 1 + rubber(raw - (N - 1));
    drag.f = raw;
    /* the last tenth of a second of the hand, for its speed at release —
       an average over a window, not the last two events, which a coalesced
       or late pointer event can make read as nothing at all */
    const t = performance.now();
    drag.trail.push([t, e.clientX]);
    while (drag.trail.length > 2 && t - drag.trail[0][0] > 110) drag.trail.shift();
    drag.lt = t;
  });
  view.addEventListener('pointerleave', () => { hov.in = false; });
  function release(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag;
    drag = null;
    view.classList.remove('is-drag');
    if (!d.live) return;                       // a press, not a drag: the click decides
    swallow = true;                            // the click that ends a drag opens nothing
    setTimeout(() => { swallow = false; }, 60);
    const tr = d.trail, a0 = tr[0], a1 = tr[tr.length - 1];
    const vx = tr.length > 1 ? (a1[1] - a0[1]) / Math.max(8, a1[0] - a0[0]) : 0;   // px / ms
    const stale = performance.now() - d.lt > 160;            // the hand had stopped
    /* where it lands: where the hand left it, carried on by its speed —
       and past 0.6 slabs a second a release is a FLICK, which takes the
       next slab in its direction however little it travelled. Speed is in
       SLABS per second, not pixels: a phone's slab is half a desktop's,
       and a pixel threshold made the same gesture a flick on one and a
       nudge on the other. */
    const v = stale ? 0 : -vx * 1000 / slabStep();            // slabs / s
    const from = Math.round(d.base);
    let to = Math.round(d.f + v * 0.35);
    if (v > 0.6) to = Math.max(to, Math.floor(d.f) + 1);
    if (v < -0.6) to = Math.min(to, Math.ceil(d.f) - 1);
    to = clamp(to, Math.max(0, from - 2), Math.min(N - 1, from + 2));
    /* A finger lifting is two events — pointerup, then touchend — and
       Lenis stops a running scroll on the second, so a touch waits. */
    go(to, d.type === 'touch' ? 70 : 0);
    /* and the spring starts from the hand's speed, so the release is one
       continuous movement rather than a stop and a start */
    vView = clamp(v, -8, 8);
  }
  view.addEventListener('pointerup', release);
  view.addEventListener('pointercancel', release);
  scene.addEventListener('dragstart', (e) => e.preventDefault());

  /* the arrow keys, while the room is the thing on screen */
  addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || opening) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (document.body.classList.contains('is-navopen')) return;
    const r = track.getBoundingClientRect();
    if (r.top > innerHeight * 0.35 || r.bottom < innerHeight * 0.65) return;
    if (pNow <= 0 || pNow >= 1 || inFan()) return;
    e.preventDefault();
    go(pNow < stopOf(0) - 0.02 ? 0 : current() + (e.key === 'ArrowRight' ? 1 : -1));
  });

  /* ── run ────────────────────────────────────────────────────────── */
  measure();
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(() => measure());
    ro.observe(view);
    ro.observe(stage);
  } else {
    addEventListener('resize', measure, { passive: true });
  }
  /* a wheel is the reader taking the page back: a destination the room
     was holding gives way to wherever they scroll */
  addEventListener('wheel', () => { if (hold) hold = null; }, { passive: true });
  onNear(track, frame);
  frame(0, { px: 0, py: 0, vel: 0 });
}
