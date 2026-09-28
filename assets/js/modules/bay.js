/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE BAY   (services.html)

   Five services standing in one room as slabs of glass, and a scroll that
   walks the reader along them. Replaced `orbit.js` on 2026-09-28 at the
   owner's direction.

   ── THE ROOM ────────────────────────────────────────────────────────
   The slabs stand on the inside of a cylinder whose axis is BETWEEN the
   reader and the slab in front. So the one being read faces them square
   on, and its neighbours come round on either side, nearer and turned
   in — the reader is inside the curve, not looking at the outside of a
   carousel.

       phi   = (i - focus) * A          where a slab is, round the curve
       x     = R sin(phi)
       z     = R (1 - cos(phi))         toward the reader as it goes round
       turn  = rotateY(-phi)            and it faces the axis

   `focus` is a float. It rests on a whole number while a slab is being
   read and travels between two of them on a smootherstep, so the slab in
   front is set square and its type is not resampled through a rotation.

   ── THE HANDOFF ─────────────────────────────────────────────────────
   Going from one service to the next is five things at once, all derived
   from that one float:

     1. the curve turns                       (phi, above)
     2. the camera breathes — back to take in the change, in on the
        result. `transit = sin(pi * frac)`, the same law field.js uses
        for its own dolly, so the room and the bed move as one camera
     3. the slab leaving powers down and the one arriving powers up:
        brackets travel out to the corners, the drawing draws and the
        figure is uncovered left to right   (`--on`, per slab)
     4. the arriving slab passes UNDER the reticle, which is fixed in the
        gap and closes on it as it lands
     5. the floor turns with the curve and its lights trail by exactly
        how fast it is turning — so the streaks are a measurement of the
        reader's own scroll, not a loop

   ── WHAT IS DRAWN WHERE ─────────────────────────────────────────────
   Slabs are DOM: real links, real type, five elements, one transform
   each. The room — floor, core, lights — is one 2D canvas behind them,
   projected through the SAME camera as the CSS scene (`project()` below
   mirrors the transform in bay.css term for term). No layout is read in
   the frame loop; everything is measured on resize.

   Reduced motion, or no JavaScript: `.is-live` is never added and the
   five are a plain grid (bay.css). The figures are still plotted.
   ══════════════════════════════════════════════════════════════════════ */

import { onNear, swapText, pad3, REDUCED } from './_track.js';
import { LINES as COVER, DIMENSIONS } from './matrix.js';

const N = 5;
const DEG = Math.PI / 180;
const A_RUN = 36 * DEG;          // between neighbours, while walking
const A_FAN = 21 * DEG;          // and when all five are in one view
const PERSP = 3.0;               // camera distance, in rig heights

/* the score, in track progress */
const OPEN_A = 0.015, OPEN_B = 0.105;   // the core alone, then the seams open
const RUN_A  = 0.105, RUN_B  = 0.895;   // the walk: five stops
const FAN_A  = 0.915, FAN_B  = 0.985;   // all five, in one view
const EDGE   = 0.06;                    // how far inside the walk the first stop sits
const STEP   = (1 - 2 * EDGE) / (N - 1);

const NAMES = ['WEBSITE DESIGN', 'BRAND KIT', 'BUSINESS STRUCTURING', 'AI ADOPTION', 'CUSTOMIZABLE CRM'];
const AXIS  = ['SUR', 'IDE', 'AUT', 'WOR', 'MEA'];

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (p, a, b) => {
  const t = clamp01((p - a) / Math.max(1e-5, b - a));
  return t * t * (3 - 2 * t);
};
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const pad2 = (n) => String(n).padStart(2, '0');

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

/* ── the figures ─────────────────────────────────────────────────────
   A line's coverage by dimension, out of matrix.js — the same five
   numbers the matrix below combines, so the two cannot disagree. The CRM
   is not in that table ("a build, not a claim about coverage"), so its
   figure is the forty-eight records its own page opens on. */
function plotFigures(panels) {
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };
  panels.forEach((el, i) => {
    const svg = el.querySelector('.bay__cov');
    const ax = el.querySelector('.bay__ax');
    const key = el.querySelector('.bay__k');
    if (!svg || svg.childNodes.length) return;
    const line = COVER[i];
    if (line) {
      const xs = line.c.map((_, j) => 10 + j * 45);
      const ys = line.c.map((c) => 46 - c * 40);
      const pts = xs.map((x, j) => x + ' ' + ys[j].toFixed(1));
      xs.forEach((x) => svg.appendChild(mk('path', { class: 'tk', d: 'M' + x + ' 6V46' })));
      svg.appendChild(mk('path', { class: 'ar', d: 'M10 46L' + pts.join('L') + 'L190 46Z' }));
      svg.appendChild(mk('path', { class: 'bs', d: 'M0 46H200' }));
      svg.appendChild(mk('path', { class: 'ln', pathLength: '1', d: 'M' + pts.join('L') }));
      let peak = 0;
      line.c.forEach((c, j) => { if (c > line.c[peak]) peak = j; });
      AXIS.forEach((a, j) => {
        const s = document.createElement('span');
        s.textContent = a;
        s.style.left = (xs[j] / 2) + '%';
        if (j === peak) s.className = 'is-peak';
        ax.appendChild(s);
      });
      if (key) key.textContent = 'COVERAGE — PEAK ' + DIMENSIONS[peak][0];
    } else {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
        const d = mk('circle', { class: 'dt', cx: 12 + c * 16, cy: 7 + r * 12.500, r: 2.1 });
        d.style.setProperty('--i', String(r * 12 + c));
        svg.appendChild(d);
      }
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
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
  plotFigures(panels);
  if (REDUCED) return;                       // the grid, with its figures

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
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

  const memo = panels.map(() => ({ tf: '', on: -1, vis: -1, hid: null }));

  sec.classList.add('is-live');

  /* ── measured on resize, never in the frame ─────────────────────── */
  const G = { H: 0, W: 0, pw: 0, ph: 0, R: 0, Rf: 0, Rc: 0, P: 0, gap: 0, yf: 0,
              cw: 0, ch: 0, dpr: 1, vx: 0, vy: 0, fanPull: 0 };
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

    /* THE FAN has its own radius. The angle between neighbours closes
       from A_RUN to A_FAN so the outer slabs turn toward the reader
       instead of toward the axis — and at the walking radius that would
       stand each slab on top of the next, so the curve opens out by
       exactly what the smaller angle takes away. */
    const Rf = (pw / 2 * (1 + Math.cos(A_FAN)) + Math.max(0.03 * H, gap * 0.5)) / Math.sin(A_FAN);

    /* how far back the camera must go for all five to fit the window
       when they fan, measured rather than guessed: the outermost slab's
       centre and half its turned width, projected, against half the
       stage */
    const phi = 2 * A_FAN;
    const xo = Rf * Math.sin(phi) + pw / 2 * Math.cos(phi);
    const zo = Rf * (1 - Math.cos(phi)) + pw / 2 * Math.sin(phi);
    const want = (W / 2 - Math.max(10, 0.02 * W)) / xo;        // the scale that fits
    const fanPull = Math.max(0.55 * H, P / Math.min(0.92, want) - P + zo);

    Object.assign(G, { H, W, pw, ph, R, Rf, P, gap, fanPull, yf: ph / 2 + 0.045 * H });
    rig.style.setProperty('--pw', pw.toFixed(1) + 'px');
    rig.style.setProperty('--ph', ph.toFixed(1) + 'px');
    rig.style.setProperty('--bu', (ph / 100).toFixed(3) + 'px');
    rig.dataset.size = ph < 250 ? 'xs' : ph < 350 ? 's' : 'm';
    view.style.perspective = P.toFixed(0) + 'px';

    if (ctx) {
      const sr = stage.getBoundingClientRect(), vr = view.getBoundingClientRect();
      G.cw = sr.width; G.ch = sr.height;
      G.vx = vr.left - sr.left; G.vy = vr.top - sr.top;
      G.dpr = Math.min(window.devicePixelRatio || 1, sr.width > 1920 ? 1.25 : 1.5);
      canvas.width = Math.round(G.cw * G.dpr);
      canvas.height = Math.round(G.ch * G.dpr);
    }
    for (const m of memo) { m.tf = ''; m.on = -1; m.vis = -1; }
  }

  /* ── state ──────────────────────────────────────────────────────── */
  let pNow = 0, lastP = -1;
  let shownBeat = -2, shownIdx = -2;
  let drag = null, dragOff = 0;              // the curve follows the hand
  let dive = null;                           // { i, t0 } — a slab being opened
  let floorPrev = 0, omega = 0, lastT = 0;
  let pulseT = -1e9, settled = -1;
  const pal = { a: [143, 124, 249], b: [201, 192, 252], c: [242, 243, 245] };
  let palTick = 0;
  const cam = { pull: 0, sa: 0, ca: 1, sb: 0, cb: 1 };

  function readPalette() {
    const cs = getComputedStyle(document.documentElement);
    pal.a = hexRgb(cs.getPropertyValue('--glint-1'), pal.a);
    pal.b = hexRgb(cs.getPropertyValue('--glint-2'), pal.b);
    pal.c = hexRgb(cs.getPropertyValue('--glint-3'), pal.c);
  }
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';

  /* The CSS scene's camera, for the canvas. Scene space is centred on the
     view; the vanishing point is the view's perspective-origin (50% 46%,
     svc-modules.css). Order matches `translateZ rotateX rotateY`: a point
     is turned about Y, then about X, then pushed back. */
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
      : i >= N ? '06 — ONE ROOM, FIVE CHANNELS'
      : pad2(i + 1) + ' — ' + NAMES[i]);
  }
  function mark(i, inRoom) {
    const k = inRoom ? i : -1;
    if (k === shownIdx) return;
    shownIdx = k;
    swapText(nameEl, k < 0 ? (pNow > 0.5 ? 'ALL FIVE' : 'STANDBY') : NAMES[k]);
    pips.forEach((b, j) => {
      if (j === k) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    if (prevEl) prevEl.disabled = k === 0;
    if (nextEl) nextEl.disabled = k === N - 1;
  }

  /* ── one frame ──────────────────────────────────────────────────── */
  function frame(p, room) {
    const now = performance.now();
    const dt = lastT ? Math.min(64, now - lastT) : 16.7;
    lastT = now;
    pNow = p;

    if (p !== lastP) {
      lastP = p;
      if (pctEl) pctEl.textContent = pad3(p);
    }

    const open = ramp(p, OPEN_A, OPEN_B);
    const fan  = ramp(p, FAN_A, FAN_B);
    const A = lerp(A_RUN, A_FAN, fan);
    G.Rc = lerp(G.R, G.Rf, fan);

    /* the hand eases back to the scroll once it lets go */
    if (!drag && dragOff) {
      dragOff *= Math.pow(0.0025, dt / 1000);
      if (Math.abs(dragOff) < 0.0008) dragOff = 0;
    }
    let f = focusOf(p) + dragOff;
    f = lerp(Math.max(-0.35, Math.min(N - 0.65, f)), (N - 1) / 2, fan);
    const near = Math.max(0, Math.min(N - 1, Math.round(f)));
    const frac = f - Math.floor(f);
    const transit = Math.abs(Math.sin(Math.PI * frac)) * (1 - fan);

    /* the dive: a slab opened, flying at the camera while field.js takes
       the page down */
    const dv = dive ? smoother(clamp01((now - dive.t0) / 560)) : 0;

    /* the camera */
    cam.pull = transit * 0.30 * G.H + fan * G.fanPull + (1 - open) * 0.10 * G.H;
    const tilt = transit * 2.6 + fan * 3.2;
    const ax = (tilt + room.py * 1.4) * DEG;
    const ay = (room.px * -2.2 + room.vel * 1.6) * DEG;
    cam.sa = Math.sin(ax); cam.ca = Math.cos(ax);
    cam.sb = Math.sin(ay); cam.cb = Math.cos(ay);
    rig.style.setProperty('--pull', cam.pull.toFixed(1));
    rig.style.setProperty('--tilt', tilt.toFixed(3));
    rig.style.setProperty('--px', room.px.toFixed(4));
    rig.style.setProperty('--py', room.py.toFixed(4));
    rig.style.setProperty('--lean', room.vel.toFixed(4));

    /* the slabs */
    const reach = lerp(1.78, 2.7, fan);
    for (let i = 0; i < N; i++) {
      const el = panels[i], m = memo[i];
      const d = i - f, ad = Math.abs(d);
      let vis = clamp01((reach - ad) / 0.72);
      const born = i === 0 ? ramp(open, 0.08, 0.66) : ramp(open, 0.34, 1);
      let on = smoother(clamp01(1 - ad * 1.08)) * ramp(born, 0.55, 1);
      on = Math.max(on, fan * 0.9);
      if (born <= 0) vis = 0;
      if (dv && dive.i !== i) vis *= 1 - dv;

      const hid = vis <= 0.002;
      if (hid !== m.hid) { m.hid = hid; el.style.visibility = hid ? 'hidden' : 'visible'; }
      if (hid) {
        /* out of the way of the field's keep-out rects as well as of the
           eye: a hidden slab still has a box */
        if (m.tf !== 'x') { m.tf = 'x'; el.style.transform = 'scale(0.001)'; }
        continue;
      }
      const phi = d * A;
      const x = G.Rc * Math.sin(phi);
      let z = G.Rc * (1 - Math.cos(phi));
      if (dv && dive.i === i) z += dv * (G.P * 0.5 + cam.pull);
      const sy = Math.max(0.004, born);
      const tf = 'translate3d(' + x.toFixed(2) + 'px,0,' + z.toFixed(2) + 'px) rotateY(' +
                 (-phi / DEG).toFixed(3) + 'deg)' + (sy < 1 ? ' scale3d(1,' + sy.toFixed(4) + ',1)' : '');
      if (tf !== m.tf) { m.tf = tf; el.style.transform = tf; }

      const onR = Math.round(on * 200) / 200, visR = Math.round(vis * 100) / 100;
      /* `--on` lights a slab; it never changes what the slab SAYS. A
         count that ran up from zero would print five false numbers on
         the way to the true one. */
      if (onR !== m.on) { m.on = onR; el.style.setProperty('--on', String(onR)); }
      if (visR !== m.vis) { m.vis = visR; el.style.setProperty('--vis', String(visR)); }
    }

    /* the readouts follow the ROOM, not the raw progress */
    if (open < 0.5) { beat(-1); mark(0, false); }
    else if (fan > 0.5) { beat(N); mark(near, false); }
    else { beat(near); mark(near, true); }

    /* a slab has landed: one pulse across the floor */
    const still = transit < 0.06 && open > 0.98 && fan < 0.02 && !drag;
    if (still && settled !== near) { settled = near; pulseT = now; }
    if (!still && transit > 0.4) settled = -1;

    /* the reticle: in the gap to the right of the slab in front, turning
       with the curve, and closing on whatever lands under it */
    if (ret) {
      const gx = lerp(0, G.pw / 2 + G.gap / 2, open);
      const lock = 1 - 0.22 * (1 - transit) * open;
      /* at the start it rings the field's own core, which is the only
         thing in the room */
      const sc = lerp(4.4, 1, open) * lock * (1 + 0.04 * Math.sin(now / 900));
      const spin = f * 120 + now / 140;
      ret.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,0,0) rotate(' + spin.toFixed(2) +
                            'deg) scale(' + sc.toFixed(3) + ')';
      ret.style.opacity = ((0.5 + 0.5 * transit) * (1 - fan) * (1 - dv)).toFixed(3);
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
    const fade = 1 - dv;

    /* the floor turns with the curve, and keeps turning a little with the
       scroll while a slab is being read — so the page never moves without
       the room answering */
    const floorA = -f * A - pNow * 1.1;
    const w = (floorA - floorPrev) / Math.max(1, dt) * 1000;      // rad / s
    floorPrev = floorA;
    omega += (Math.max(-3, Math.min(3, w)) - omega) * 0.16;

    const lit = (0.35 + 0.65 * open) * fade;

    /* rings */
    for (let j = 0; j < RINGS.length; j++) {
      const r = R * RINGS[j];
      const rail = RINGS[j] === 1;
      ctx.beginPath();
      arc(r, -Math.PI, Math.PI, yf);
      ctx.lineWidth = rail ? 1.3 : 1;
      ctx.strokeStyle = rail ? rgba(pal.b, 0.30 * lit)
        : rgba(pal.c, (0.105 - j * 0.009) * lit);
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
    ctx.strokeStyle = rgba(pal.c, 0.06 * lit);
    ctx.stroke();

    /* the lights on the floor, and how fast it is turning */
    const trail = Math.max(-0.9, Math.min(0.9, omega * 0.2));
    for (let m = 0; m < 21; m++) {
      const r = R * RINGS[2 + (m % 3)];
      const t = floorA * (1 + (m % 3) * 0.18) + m * (2 * Math.PI / 21);
      const hot = Math.min(1, Math.abs(trail) * 2.4);
      if (hot > 0.02) {
        for (let k = 0; k < 5; k++) {
          ctx.beginPath();
          arc(r, t - trail * (k / 5), t - trail * ((k + 1) / 5), yf);
          ctx.lineWidth = 1.6 - k * 0.22;
          ctx.strokeStyle = rgba(pal.b, (0.6 - k * 0.11) * hot * lit);
          ctx.stroke();
        }
      }
      project(r * Math.sin(t), yf, R - r * Math.cos(t), q0);
      if (q0.ok) {
        ctx.beginPath();
        ctx.arc(q0.x, q0.y, Math.max(0.7, 1.25 * q0.s), 0, 6.283);
        ctx.fillStyle = rgba(pal.c, (0.32 + 0.5 * hot) * lit);
        ctx.fill();
      }
    }

    /* under every slab, the stretch of rail it stands on */
    for (let i = 0; i < N; i++) {
      const m = memo[i];
      if (m.hid || m.vis <= 0) continue;
      const phi = (i - f) * A;
      const span = (7 + 5 * m.on) * DEG;
      ctx.beginPath();
      arc(R, phi - span, phi + span, yf);
      ctx.lineWidth = 1.4 + 1.6 * m.on;
      ctx.strokeStyle = rgba(pal.b, (0.18 + 0.62 * m.on) * m.vis * fade);
      ctx.stroke();
    }

    /* a slab landed */
    const pa = (now - pulseT) / 1100;
    if (pa >= 0 && pa < 1) {
      const e = 1 - Math.pow(1 - pa, 3);
      ctx.beginPath();
      arc(R * lerp(0.25, 2.3, e), -Math.PI, Math.PI, yf);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = rgba(pal.b, 0.55 * (1 - pa) * (1 - pa) * fade);
      ctx.stroke();
    }

    /* the seam between two slabs, while the focus is in transit */
    if (transit > 0.04) {
      const k = Math.floor(f);
      const pa1 = (k - f) * A, pb1 = (k + 1 - f) * A;
      project(R * Math.sin(pa1), 0, R * (1 - Math.cos(pa1)), q0);
      project(R * Math.sin(pb1), 0, R * (1 - Math.cos(pb1)), q1);
      if (q0.ok && q1.ok) {
        ctx.beginPath();
        ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = rgba(pal.a, 0.5 * transit * fade);
        ctx.stroke();
      }
    }

    /* THE CORE — alone in the room at the start, then home on the axis,
       low in the foreground, where the five were cut from */
    const cx = 0;
    const cy = lerp(-0.04 * H, yf - 0.075 * H, open);
    const cz = lerp(0.2 * H, R, open);
    const cr = lerp(0.105, 0.036, open) * H * (1 + 0.35 * fan);
    /* It is the whole room at the start and the closing view's centre;
       between them it shows only while the camera is back, which is also
       the only time there is floor in front of the slabs to stand it on */
    const seen = Math.max(1 - open, Math.min(1, transit * 1.5), fan) * fade;
    const rot = now / 5200 + pNow * 6 + f * 0.9;
    const cr0 = Math.cos(rot), sr0 = Math.sin(rot);
    for (let i = 0; seen > 0.01 && i < SPHERE.length; i++) {
      const s = SPHERE[i];
      const sx = s[0] * cr0 + s[2] * sr0, sz = -s[0] * sr0 + s[2] * cr0;
      project(cx + sx * cr, cy + s[1] * cr, cz + sz * cr, q0);
      if (!q0.ok) continue;
      const front = (sz + 1) / 2;
      const c = front > 0.62 ? pal.c : front > 0.3 ? pal.b : pal.a;
      ctx.beginPath();
      ctx.arc(q0.x, q0.y, Math.max(0.5, (0.35 + 0.6 * front) * q0.s * (H / 700)), 0, 6.283);
      ctx.fillStyle = rgba(c, (0.16 + 0.8 * front) * seen);
      ctx.fill();
    }
  }

  /* ── moving the reader ──────────────────────────────────────────── */
  function go(k) {
    k = Math.max(0, Math.min(N - 1, k));
    const span = Math.max(1, track.offsetHeight - innerHeight);
    const top = docTop(track) + stopOf(k) * span;
    if (typeof window.__zyrnScrollTo === 'function') window.__zyrnScrollTo(top, 1150);
    else window.scrollTo({ top, behavior: 'smooth' });
  }
  const current = () => Math.max(0, Math.min(N - 1, Math.round(focusOf(pNow))));
  const inFan = () => pNow > (FAN_A + FAN_B) / 2;

  if (prevEl) prevEl.addEventListener('click', () => go(current() - 1));
  if (nextEl) nextEl.addEventListener('click', () => go(current() + 1));
  pips.forEach((b) => b.addEventListener('click', () =>
    go(parseInt(b.getAttribute('data-go'), 10) || 0)));

  /* A slab is a link, and the one in front behaves like one. A neighbour
     comes to the front first — it is turned away and half read, and
     opening a page from it would be opening something the reader has not
     looked at. When all five are in one view, any of them opens.
     This runs before field.js's handler on `document`, which leaves a
     prevented click alone. */
  let swallow = false;
  scene.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('.bay__p');
    if (!a) return;
    if (swallow) { swallow = false; e.preventDefault(); return; }
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const i = parseInt(a.getAttribute('data-i'), 10) || 0;
    if (!inFan() && i !== Math.round(focusOf(pNow) + dragOff)) {
      e.preventDefault();
      go(i);
      return;
    }
    dive = { i, t0: performance.now() };
  });
  addEventListener('pageshow', (e) => { if (e.persisted) dive = null; });

  /* keyboard focus brings a slab to the front, so what is focused is
     what is being shown */
  scene.addEventListener('focusin', (e) => {
    const a = e.target.closest && e.target.closest('.bay__p');
    if (!a || !a.matches(':focus-visible') || inFan()) return;
    const i = parseInt(a.getAttribute('data-i'), 10) || 0;
    if (i !== current()) go(i);
  });

  /* drag: the curve follows the hand, and letting go past a fifth of a
     step takes the next slab. Vertical movement is left to the page. */
  view.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || inFan() || pNow < OPEN_B) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, live: false, from: current() };
  });
  view.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.live) {
      if (Math.abs(dx) < 9 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      drag.live = true;
      view.classList.add('is-drag');
      try { view.setPointerCapture(drag.id); } catch (err) { /* already gone */ }
    }
    const step = G.R * Math.sin(A_RUN);
    dragOff = Math.max(-1.1, Math.min(1.1, -dx / Math.max(1, step)));
  });
  function release(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag;
    drag = null;
    view.classList.remove('is-drag');
    if (!d.live) return;
    swallow = true;                          // the click that ends a drag opens nothing
    setTimeout(() => { swallow = false; }, 60);
    const to = d.from + (dragOff > 0.2 ? 1 : dragOff < -0.2 ? -1 : 0);
    if (to === d.from || to < 0 || to >= N) return;
    /* A finger lifting is two events — pointerup, then touchend — and
       Lenis stops whatever scroll is running when it sees the second. A
       scroll started on the first is cancelled one event later, so after
       a touch it waits for the touch to be over. */
    if (e && e.pointerType === 'touch') setTimeout(() => go(to), 70);
    else go(to);
  }
  view.addEventListener('pointerup', release);
  view.addEventListener('pointercancel', release);
  scene.addEventListener('dragstart', (e) => e.preventDefault());

  /* the arrow keys, while the room is the thing on screen */
  addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
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
  onNear(track, frame);
  frame(0, { px: 0, py: 0, vel: 0 });
}

