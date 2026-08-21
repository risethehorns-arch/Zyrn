/* ══════════════════════════════════════════════════════════════════════
   ZYRN — THE AXES ENTITY

   The panel on the Axes card in the production band, and the only place
   on the landing page where a product is represented by the thing itself
   rather than by a picture of it.

   Axes has no interface. It is a module, not an app: there is no window
   to photograph, no dashboard, no chrome. A screenshot of it would have
   to be invented, and an invented screenshot of a product that is running
   right now is the one lie this site cannot afford — the whole Axes page
   argues that its evidence is the artefact, not a description of the
   artefact. So the panel shows its BEHAVIOUR instead, drawn live, in the
   same three formations the WebGL bed uses on every other page:

     CORE     one brief arrives, held as a single body
     AXES     it is taken apart along six axes and all six are worked
              at once — each arm has its own sweep head, at its own rate
     RESOLVE  the six come back as one boundary, and the artefact is what
              is left standing on it

   That is the entire product, in about fourteen seconds, on a loop.

   Deliberately 2D canvas rather than WebGL. This runs on the LANDING
   page, where a 90,000-particle GPU field already owns the frame budget;
   a second WebGL context for a 385x240 panel would cost a context, a
   compile and a share of the same GPU for a card that is a third of one
   band. ~330 circular particles on the CPU is a rounding error next to
   the bed and it never touches the governor.

   It parks itself the moment the band leaves the viewport, and reduced
   motion gets a single still frame of the AXES formation — the state
   that says the most with nothing moving.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Six arms, because six axes. Stated once, here, so the drawing and the
     copy on the card cannot drift apart. */
  const ARMS = 6;

  /* The loop, in seconds. Long enough that a reader who glances at the
     band twice sees two different things, slow enough that it never
     competes with the copy beside it for attention. */
  const CYCLE = [
    { k: 'core',    hold: 2.4, into: 1.5 },
    { k: 'axes',    hold: 4.2, into: 1.8 },
    { k: 'resolve', hold: 2.6, into: 1.6 },
  ];
  const SPAN = CYCLE.reduce((n, s) => n + s.hold + s.into, 0);

  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));

  function build(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* Never `desynchronized:true` anywhere in this project — it detaches
       the canvas from the compositor and tears against the WebGL bed.
       (CLAUDE.md; it has been tried twice and reverted twice.) */

    const N = 330;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const arm = i % ARMS;
      /* Position along its own arm. Pushed off the origin so the CORE
         state is a body with a hole in it rather than a solid blob —
         a solid blob at this size reads as a bullet point. */
      const t = 0.14 + 0.86 * ((Math.floor(i / ARMS) + 0.5) / (N / ARMS));
      pts.push({
        arm,
        t,
        /* lateral scatter, constant per particle so an arm looks like a
           spray of work rather than a drawn line */
        off: (Math.sin(i * 12.9898) * 43758.5453 % 1) * 2 - 1,
        ph: (Math.sin(i * 78.233) * 43758.5453 % 1) * Math.PI * 2,
        /* per-particle lag on the state change, so a formation arrives as
           a ripple across the entity instead of a hard cut */
        lag: 0.55 + 0.45 * ((Math.sin(i * 4.1414) * 43758.5453 % 1 + 1) % 1),
        r: 0.8 + 1.15 * ((Math.sin(i * 31.416) * 43758.5453 % 1 + 1) % 1),
        x: 0, y: 0, seeded: false,
      });
    }

    let w = 0, h = 0, dpr = 1, unit = 1;

    function size() {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return false;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      unit = Math.min(w, h);          // formations are square, the panel is not
      return true;
    }

    /* ── the three formations ─────────────────────────────────────────
       Each returns a position in panel pixels for one particle. */

    function core(p, time) {
      const a = p.arm * (Math.PI * 2 / ARMS) + p.ph * 0.4 + time * 0.12;
      const rad = unit * (0.085 + 0.135 * p.t) + unit * 0.018 * Math.sin(time * 0.9 + p.ph);
      return [Math.cos(a) * rad, Math.sin(a) * rad];
    }

    function axes(p, time) {
      /* Each arm runs its own sweep at its own rate — the point Axes
         makes about working six things in parallel rather than in
         sequence is not made by six bars finishing together. */
      const a = p.arm * (Math.PI * 2 / ARMS) - Math.PI / 2;
      const rad = unit * (0.07 + 0.405 * p.t);
      const lat = unit * 0.032 * p.off * (0.35 + p.t);
      return [
        Math.cos(a) * rad - Math.sin(a) * lat,
        Math.sin(a) * rad + Math.cos(a) * lat,
      ];
    }

    function resolve(p, time) {
      /* One boundary. The arms are gone; what they found is the ring. */
      const a = p.arm * (Math.PI * 2 / ARMS) + p.t * (Math.PI * 2 / ARMS) + time * 0.16;
      const rad = unit * (0.355 + 0.022 * p.off);
      return [Math.cos(a) * rad, Math.sin(a) * rad];
    }

    const FORM = { core, axes, resolve };

    /* Where in the loop are we, and how far between which two states */
    function phaseAt(time) {
      let t = time % SPAN;
      for (let i = 0; i < CYCLE.length; i++) {
        const s = CYCLE[i];
        if (t < s.hold) return { a: s.k, b: s.k, m: 0, k: s.k };
        t -= s.hold;
        if (t < s.into) {
          const nx = CYCLE[(i + 1) % CYCLE.length];
          return { a: s.k, b: nx.k, m: t / s.into, k: s.k };
        }
        t -= s.into;
      }
      return { a: 'core', b: 'core', m: 0, k: 'core' };
    }

    let raf = 0, live = false, rate = 1, shown = 0;

    function frame(ts) {
      if (!live) { raf = 0; return; }
      raf = requestAnimationFrame(frame);
      shown += ((ts - (frame.last || ts)) / 1000) * rate;
      frame.last = ts;
      draw(shown);
    }

    function draw(time) {
      if (!w && !size()) return;
      ctx.clearRect(0, 0, w, h);
      const st = phaseAt(time);
      const cx = w / 2, cy = h / 2;

      /* The sweep head, only while the axes are being worked: a value in
         0..1 per arm that travels outward at that arm's own rate. */
      const working = st.a === 'axes' || st.b === 'axes';
      const heads = [];
      for (let k = 0; k < ARMS; k++) {
        heads.push(working ? ((time * (0.34 + k * 0.043)) % 1.35) : -9);
      }

      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const m = ease(Math.min(1, st.m * p.lag * 1.45));
        const A = FORM[st.a](p, time);
        const B = st.a === st.b ? A : FORM[st.b](p, time);
        const x = cx + A[0] + (B[0] - A[0]) * m;
        const y = cy + A[1] + (B[1] - A[1]) * m;

        /* First frame lands them where they belong rather than sliding
           them in from 0,0 — the entity is already running when you
           scroll to it, it does not assemble on arrival. */
        if (!p.seeded) { p.x = x; p.y = y; p.seeded = true; }
        else { p.x += (x - p.x) * 0.24; p.y += (y - p.y) * 0.24; }

        let a = 0.30 + 0.34 * p.t;
        const d = Math.abs(p.t - heads[p.arm]);
        if (d < 0.16) a += (1 - d / 0.16) * 0.62;        // under the sweep
        a *= 0.68 + 0.32 * (0.5 + 0.5 * Math.sin(time * 1.6 + p.ph));

        ctx.fillStyle = 'rgba(242,243,245,' + a.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* The core. One brief, one artefact — the only thing on the panel
         that is present in all three states, because it is the same
         object throughout. */
      const solid = st.a === 'core' ? 1 - st.m : (st.b === 'core' ? st.m : 0);
      ctx.fillStyle = 'rgba(242,243,245,' + (0.34 + 0.5 * solid).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2 + 1.5 * solid, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = 'source-over';
    }

    function start() {
      if (live || REDUCED) return;
      live = true; frame.last = 0; raf = requestAnimationFrame(frame);
    }
    function stop() {
      live = false;
      if (raf) cancelAnimationFrame(raf), raf = 0;
    }

    size();
    if (REDUCED) {
      /* One still frame of the formation that carries the idea: taken
         apart, all six being worked. */
      draw(CYCLE[0].hold + CYCLE[0].into + 1.2);
      addEventListener('resize', () => {
        if (size()) draw(CYCLE[0].hold + CYCLE[0].into + 1.2);
      }, { passive: true });
      return;
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { size(); }).observe(canvas);
    } else {
      addEventListener('resize', size, { passive: true });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        es[0].isIntersecting ? start() : stop();
      }, { rootMargin: '120px' }).observe(canvas);
    } else start();

    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : start();
    });

    /* Answers the pointer the same way Duk's mark does, through the same
       idea: the card does not have to know how the entity works, it just
       asks for more of it. Hover only — there is nothing to press. */
    const card = canvas.closest('.proof__card');
    if (card && matchMedia('(hover:hover) and (pointer:fine)').matches) {
      card.addEventListener('mouseenter', () => { rate = 2.1; });
      card.addEventListener('mouseleave', () => { rate = 1; });
    }
  }

  function init() {
    document.querySelectorAll('canvas[data-axent]').forEach(build);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();
})();
