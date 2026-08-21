/* ══════════════════════════════════════════════════════════════════════
   ZYRN — THE SPLITTER  (axes.html §02)

   The whole decomposition as one moving picture: a brief arrives as a
   single body on the left, opens into six streams that run in parallel at
   six different rates, one of them returns something nobody asked for,
   and all six resolve into one artefact on the right.

   It replaces a pinned scroll instrument that did the same job with a
   430vh track, a sticky stage, six rAF-translated lanes and two
   absolutely-positioned payoff boxes. That version had a defect waiting
   in every viewport it had not been authored at — clipped on a short
   window, collided with itself on a phone, sprawled on an ultrawide — and
   the reason was structural rather than a bug: a composition pinned to
   one viewport height, layered by absolute position, is only correct at
   the sizes you happen to test.

   So the constraint here is the design. This draws inside a box whose
   size it is GIVEN — a fixed aspect ratio in normal flow — and it reads
   nothing about the page: not scroll, not viewport height, not the
   position of any other element. It cannot clip anything, cannot collide
   with anything, and cannot move the layout. Resize it to any width and
   any height and it recomposes, because every coordinate below is a
   fraction of w and h rather than a pixel.

   2D canvas, not WebGL, for the same reason as axent.js: the page is
   already running a 90k-point GPU field and this is a strip of it.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LANES = 6;
  /* Six rates, deliberately not multiples of each other, so nothing ever
     lines up into a single pulse. Parallel work does not finish together
     and should not look like it does. */
  const RATE = [0.170, 0.139, 0.203, 0.121, 0.157, 0.188];
  /* Lane 2 is ACCESS — the axis nobody commissions, and the one that
     reliably pays. Stated once, here, so the drawing cannot drift from
     the card grid underneath it. */
  const OFF = 2;

  /* deterministic; a picture that lands differently on every load cannot
     make the same argument twice */
  function rnd(i) {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));

  function build(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    /* Never desynchronized:true anywhere in this project — CLAUDE.md. */

    const N = 300;
    const dots = [];
    for (let i = 0; i < N; i++) {
      dots.push({
        lane: i % LANES,
        /* where in its own lane's cycle this dot sits */
        u: rnd(i),
        /* lateral wander inside the lane, constant per dot */
        j: rnd(i * 3.3) * 2 - 1,
        sz: 0.7 + rnd(i * 7.7) * 1.5,
        ph: rnd(i * 13.1) * Math.PI * 2,
      });
    }

    let w = 0, h = 0, dpr = 1;

    function size() {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    /* ── the path a dot takes ──────────────────────────────────────────
       u runs 0..1 left to right. Three acts, all as fractions of the box
       so the composition survives any aspect ratio:
         0.00 .. 0.20   held as one body at the origin
         0.20 .. 0.34   fanning out to its own lane
         0.34 .. 0.72   running that lane
         0.72 .. 0.88   converging
         0.88 .. 1.00   held as one body at the artefact             */
    function place(d, u, time) {
      const x0 = w * 0.085, x1 = w * 0.915;
      const x = x0 + (x1 - x0) * u;

      const cy = h * 0.5;
      /* the lane's own height, centred: 6 lanes across the middle 74% */
      const laneY = cy + (d.lane - (LANES - 1) / 2) * (h * 0.74 / LANES);

      const open = ease((u - 0.20) / 0.14);
      const shut = ease((u - 0.72) / 0.16);
      const spread = open * (1 - shut);

      const wobble = Math.sin(time * 1.6 + d.ph + u * 9) * h * 0.012;
      const y = cy + (laneY - cy) * spread
                  + d.j * h * 0.022 * spread
                  + wobble * (0.25 + 0.75 * spread);
      return [x, y];
    }

    let raf = 0, live = false, t = 0, last = 0;

    function frame(ts) {
      if (!live) { raf = 0; return; }
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;
      t += dt;
      draw.dt = dt;
      draw(t);
    }

    function draw(time) {
      if (!w && !size()) return;
      ctx.clearRect(0, 0, w, h);
      const cy = h * 0.5;
      const x0 = w * 0.085, x1 = w * 0.915;
      /* advance per SECOND, not per frame — a 120Hz phone must not
         run the whole decomposition at double speed */
      const dtq = (draw.dt || 0.016) * 0.16;

      /* ── the six lanes, as hairlines ─────────────────────────────── */
      ctx.lineWidth = 1;
      for (let k = 0; k < LANES; k++) {
        const laneY = cy + (k - (LANES - 1) / 2) * (h * 0.74 / LANES);
        const hot = k === OFF ? 0.5 + 0.5 * Math.sin(time * 0.9) : 0;
        ctx.strokeStyle = 'rgba(242,243,245,' + (0.07 + hot * 0.13).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(x0 + (x1 - x0) * 0.30, laneY);
        ctx.lineTo(x0 + (x1 - x0) * 0.76, laneY);
        ctx.stroke();
      }

      /* ── the dots ────────────────────────────────────────────────── */
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.u += RATE[d.lane] * dtq;
        if (d.u > 1) d.u -= 1;
        const u = d.u;
        const p = place(d, u, time);

        /* Brightest at the two ends, where it is ONE thing, and quieter
           through the middle where it is six. The argument the picture
           makes is that the brief and the artefact are the same object
           seen before and after the work. */
        let a = 0.26 + 0.34 * Math.abs(u - 0.5) * 2;
        if (d.lane === OFF) a += 0.26 * (0.5 + 0.5 * Math.sin(time * 0.9));
        a *= 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(time * 2.1 + d.ph));

        ctx.fillStyle = 'rgba(242,243,245,' + a.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p[0], p[1], d.sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      /* ── the two bodies ──────────────────────────────────────────── */
      const r = Math.max(2.4, h * 0.018);
      ctx.fillStyle = 'rgba(242,243,245,0.92)';
      ctx.beginPath(); ctx.arc(x0, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x1, cy, r, 0, Math.PI * 2); ctx.fill();

      /* a ring on the artefact, breathing — it is the only thing here
         that is a RESULT rather than a stage */
      ctx.strokeStyle = 'rgba(242,243,245,'
        + (0.18 + 0.16 * (0.5 + 0.5 * Math.sin(time * 1.1))).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x1, cy, r + 5 + 2.5 * Math.sin(time * 1.1), 0, Math.PI * 2);
      ctx.stroke();
    }

    function start() { if (!live && !REDUCED) { live = true; last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { live = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    size();

    if (REDUCED) {
      /* One frame, with the dots distributed across the whole path, so a
         still reader still sees one body opening into six and closing
         into one. Nothing about the picture needs it to be moving. */
      dots.forEach((d, i) => { d.u = (i + 0.5) / dots.length; });
      draw(0.4);
      addEventListener('resize', () => { if (size()) draw(0.4); }, { passive: true });
      return;
    }

    if ('ResizeObserver' in window) new ResizeObserver(() => size()).observe(canvas);
    else addEventListener('resize', size, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { es[0].isIntersecting ? start() : stop(); },
        { rootMargin: '140px' }).observe(canvas);
    } else start();

    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : start();
    });
  }

  function init() { document.querySelectorAll('canvas[data-axsplit]').forEach(build); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
