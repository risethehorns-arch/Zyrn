/* ══════════════════════════════════════════════════════════════════════
   THE INTERLUDES — the five bands between the landing page's scenes
   (owner-requested 2026-10-03; assets/css/interlude.css has the brief).

   One loop serves all five and runs only while one of them is on
   screen. Everything that moves is a transform, an opacity or an SVG
   attribute on a handful of nodes; nothing animates layout. Under
   reduced motion every interlude renders its legible end state and the
   hands-on ones (gate, index, clock) still work by hand.

   What is real and what is authored: the clock's NOW is Amman's actual
   time; the gate's tally counts the reader's own presses; the index is
   whatever the reader drags. The messages, the tasks and the day are
   authored demonstrations, and each band that shows them says so.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = (t) => t * t * (3 - 2 * t);
  const pad2 = (n) => String(n).padStart(2, '0');
  const $ = (r, s) => r.querySelector(s);

  /* ── the shared loop ─────────────────────────────────────────────── */
  const live = new Set();
  let raf = 0, last = 0;
  function loop(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    live.forEach((it) => it.frame && it.frame(dt, now));
    if (live.size) raf = requestAnimationFrame(loop);
    else { raf = 0; last = 0; }
  }
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      const it = e.target.__il;
      if (!it) return;
      if (e.isIntersecting) { live.add(it); it.on && it.on(); }
      else { live.delete(it); it.off && it.off(); }
    });
    if (live.size && !raf) raf = requestAnimationFrame(loop);
  }, { rootMargin: '140px 0px' });
  function register(el, it) { if (!el) return; el.__il = it; io.observe(el); }


  /* ── 1 · THE FOLD — scroll ──────────────────────────────────────────
     Seven steps of an offer handled by hand. As the band crosses the
     screen the six a machine can do fly into the one a person must, and
     a pipe of light grows through it. Reversible: scroll back up and the
     work comes back out. */
  function fold(root) {
    const stage = $(root, '.fold');
    const steps = [...root.querySelectorAll('.fold__s')];
    const keep = $(root, '.fold__s--keep');
    const auto = steps.filter((s) => s !== keep);
    const beam = $(root, '.fold__beam'), pipe = $(root, '.fold__pipe'), num = $(root, '.fold__num');
    const vert = matchMedia('(max-width: 699px)');
    let geo = [], lastP = -1, vertical = vert.matches;

    function measure() {
      vertical = vert.matches;
      auto.forEach((s) => { s.style.transform = ''; });
      const f = stage.getBoundingClientRect(), k = keep.getBoundingClientRect();
      const kx = k.left + k.width / 2, ky = k.top + k.height / 2;
      stage.style.setProperty('--py', (ky - f.top).toFixed(1) + 'px');
      stage.style.setProperty('--px', (kx - f.left).toFixed(1) + 'px');
      geo = auto.map((s) => {
        const r = s.getBoundingClientRect();
        return { dx: kx - (r.left + r.width / 2), dy: ky - (r.top + r.height / 2) };
      });
      const pr = pipe.getBoundingClientRect();
      stage.style.setProperty('--pw', pr.width.toFixed(0) + 'px');
      stage.style.setProperty('--ph', pr.height.toFixed(0) + 'px');
      lastP = -1;
    }
    function frame() {
      const r = stage.getBoundingClientRect(), vh = innerHeight;
      const p = RM ? 1 : clamp01((vh * 0.9 - r.top) / (vh * 0.62));
      if (Math.abs(p - lastP) < 0.0008) return;
      lastP = p;
      let byHand = steps.length;
      auto.forEach((s, j) => {
        const f = smooth(clamp01((p - (0.06 + j * 0.1)) / 0.2));
        const g = geo[j];
        s.style.transform = f > 0
          ? 'translate3d(' + (g.dx * f).toFixed(1) + 'px,' + (g.dy * f).toFixed(1) + 'px,0) scale(' + (1 - 0.72 * f).toFixed(3) + ')'
          : '';
        s.style.opacity = (1 - f).toFixed(3);
        s.style.visibility = f > 0.995 ? 'hidden' : '';
        if (f > 0.5) byHand--;
      });
      const b = smooth(clamp01((p - 0.04) / 0.8)).toFixed(3);
      beam.style.transform = vertical ? 'scaleY(' + b + ')' : 'scaleX(' + b + ')';
      stage.classList.toggle('is-done', p > 0.88);
      num.textContent = pad2(byHand);
    }
    measure();
    addEventListener('resize', () => { measure(); frame(); });
    vert.addEventListener && vert.addEventListener('change', () => { measure(); frame(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); frame(); });
    frame();
    register(root, { frame, on: () => { measure(); } });
  }


  /* ── 2 · THE RIVER — hover ──────────────────────────────────────────
     Three lanes of messages flowing through one bot. A message crossing
     the seam turns into its answer, in the lane it came from; one that
     asks for a person turns into a hand-over and lights the person at
     the end. Hover slows the river, a held chip stops it; a tap pauses. */
  const RIVER = [
    // whatsapp
    [['Do you have Saturday 11am?', 'Saturday 11:00 is free — booked.', 'BOOK'],
     ['Are you open on Friday?', 'Closed Fridays. Saturday from 9.', 'HOURS'],
     ['Can I move it to 4pm?', 'Moved to 16:00 — confirmed.', 'BOOK'],
     ['Send me the brochure?', 'Sent — twelve pages, PDF.', 'SEND']],
    // telegram
    [['How much is the 2-bed in Abdoun?', '95,000 JOD — floor plan sent.', 'PRICE'],
     ['Can I speak to a person?', 'Handing you to a person — thread attached.', 'PERSON', 1],
     ['Is parking included?', 'One space, underground.', 'FACT'],
     ['What documents do I need?', 'ID and proof of address — list sent.', 'FACT']],
    // web chat
    [['Where is my order #4471?', 'Out for delivery, arriving today.', 'ORDER'],
     ['Can I pay by card?', 'Card, transfer or cash.', 'PAY'],
     ['I want to make a complaint.', 'Passing you to a person now — they have the thread.', 'PERSON', 1],
     ['Do you deliver to Zarqa?', 'Yes — next day.', 'ORDER']],
  ];
  const CH = ['wa', 'tg', 'web'];
  function river(root) {
    const stage = $(root, '.river'), host = $(root, '.river__chips');
    const lanes = [...root.querySelectorAll('.river__lane')];
    const seam = $(root, '.river__seam'), person = $(root, '.river__person');
    let W = 0, cw = 236, lane = [], chips = [], seq = [0, 0, 0], spd = 1, target = 1, held = null, paused = false;
    let hitT = 0, personT = 0;

    function make(li) {
      const d = RIVER[li][seq[li]++ % RIVER[li].length];
      const el = document.createElement('div');
      el.className = 'river__c river__c--' + CH[li];
      el.innerHTML = '<span class="river__q"></span><span class="river__a"></span><i class="mono river__tag"></i>';
      el.children[0].textContent = d[0]; el.children[1].textContent = d[1]; el.children[2].textContent = d[2];
      host.appendChild(el);
      const c = { el, li, x: 0, hand: !!d[3], ans: false, out: false, tf: '' };
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') held = c; });
      el.addEventListener('pointerleave', () => { if (held === c) held = null; });
      chips.push(c);
      return c;
    }
    function gapFor(li, n) { return 46 + ((n * 37 + li * 53) % 5) * 26; }   // deterministic, never random
    function measure() {
      const r = stage.getBoundingClientRect();
      W = r.width;
      cw = W < 700 ? 168 : W < 1100 ? 210 : 240;
      stage.style.setProperty('--cw', cw + 'px');
      stage.style.setProperty('--lh', (W < 700 ? 92 : 84) + 'px');
      lane = lanes.map((l) => l.offsetTop + l.offsetHeight / 2);
    }
    function place(c) {
      const h = c.el.offsetHeight || 52;
      const tf = 'translate3d(' + c.x.toFixed(1) + 'px,' + (lane[c.li] - h / 2).toFixed(1) + 'px,0)';
      if (tf !== c.tf) { c.tf = tf; c.el.style.transform = tf; }
    }
    function cross(c) {
      const mid = c.x + cw / 2, isAns = mid >= W / 2;
      if (isAns !== c.ans) {
        c.ans = isAns;
        c.el.classList.toggle(c.hand ? 'is-hand' : 'is-ans', isAns);
        if (isAns && !RM) { seam.classList.add('is-hit'); hitT = 0.28; }
      }
    }
    function fill() {
      // the river is already running when it is first seen
      chips.forEach((c) => c.el.remove()); chips = [];
      for (let li = 0; li < 3; li++) {
        let x = -cw * (0.2 + li * 0.45), n = 0;
        while (x < W + cw) { const c = make(li); c.x = x; cross(c); place(c); x += cw + gapFor(li, n++); }
      }
    }
    function frame(dt) {
      target = paused ? 0 : held ? 0 : stage.matches(':hover') ? 0.16 : 1;
      spd += (target - spd) * Math.min(1, dt * 5);
      const v = Math.max(38, Math.min(96, W / 15)) * spd;
      for (let li = 0; li < 3; li++) {
        let minX = Infinity;
        chips.forEach((c) => { if (c.li === li && c.x < minX) minX = c.x; });
        const gap = gapFor(li, seq[li]);
        if (minX === Infinity) { const c = make(li); c.x = -cw; place(c); }
        else if (minX - gap > -10) { const c = make(li); c.x = minX - cw - gap; place(c); }
      }
      chips.forEach((c) => {
        c.x += v * dt;
        cross(c);
        if (c.hand && c.ans && !c.out && c.x + cw > W - 4) { c.out = true; person.classList.add('is-on'); personT = 1.4; }
        place(c);
      });
      chips = chips.filter((c) => { if (c.x > W + 8) { c.el.remove(); return false; } return true; });
      if (hitT > 0 && (hitT -= dt) <= 0) seam.classList.remove('is-hit');
      if (personT > 0 && (personT -= dt) <= 0) person.classList.remove('is-on');
    }
    stage.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse') return;
      paused = !paused; stage.classList.toggle('is-paused', paused);
    });
    measure(); fill();
    addEventListener('resize', () => { const w = W; measure(); if (Math.abs(w - W) > 40) fill(); else chips.forEach(place); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { chips.forEach((c) => { c.tf = ''; place(c); }); });
    if (!RM) register(root, { frame });
  }


  /* ── 3 · THE GATE — press ───────────────────────────────────────────
     An agent takes a brief, does the work, checks it, and then STOPS.
     Nothing ships until the reader presses ALLOW; HOLD changes nothing.
     If nobody presses anything it waits — that is the point. The tally
     counts the reader's own decisions, so it is the one number on this
     page the reader wrote. */
  const TASKS = [
    { brief: 'Rewrite the pricing page in the brand voice.',
      work: ['reading brand/voice.md', 'rewriting pricing.html', 'writing pricing.test.js'],
      check: 'checks   layout ✓   contrast ✓   phone ✓',
      ask: 'Publish pricing.html?', done: 'published · approved by you' },
    { brief: 'Answer last night’s open enquiries.',
      work: ['reading 9 threads · whatsapp, web', 'looking up prices and slots in the desk', 'drafting 9 replies in the firm’s voice'],
      check: 'checks   every fact looked up ✓   tone ✓',
      ask: 'Send 9 replies?', done: 'sent · approved by you' },
    { brief: 'Move Saturday’s viewings to the new calendar.',
      work: ['reading calendar · 4 viewings', 'writing 4 changes', 'drafting 4 notes to the clients'],
      check: 'checks   no clashes ✓   clients notified: draft ✓',
      ask: 'Apply 4 calendar changes?', done: 'applied · approved by you' },
    { brief: 'Draft the quarterly owner report from the desk.',
      work: ['reading desk · 48 records', 'writing report.pdf · 6 pages', 'tracing every figure to its record'],
      check: 'checks   figures traced ✓   no guesses ✓',
      ask: 'Share report.pdf with the partners?', done: 'shared · approved by you' },
  ];
  function gate(root) {
    const g = $(root, '.gate'), log = $(root, '.gate__log'), ask = $(root, '.gate__ask');
    const ok = $(root, '.gate__key--ok'), hold = $(root, '.gate__key--hold'), task = $(root, '.gate__task');
    const nA = $(root, '.gate__a'), nH = $(root, '.gate__h'), ring = $(root, '.gate__ring');
    let i = 0, a = 0, h = 0, visible = false, started = false, armed = false, steps = [], si = 0, tm = 0, parked = false;

    function line(kind, text) {
      const el = document.createElement('div');
      el.className = 'gate__l gate__l--' + kind;
      el.textContent = text;
      if (kind === 'brief') { el.style.setProperty('--n', text.length); el.style.setProperty('--d', Math.min(1400, text.length * 26) + 'ms'); }
      log.appendChild(el);
      while (log.children.length > 9) log.firstChild.remove();
      return el;
    }
    function arm(on) {
      armed = on; g.classList.toggle('is-armed', on);
      ok.disabled = hold.disabled = !on;
    }
    function run() {
      if (tm) return;
      if (!visible) { parked = true; return; }
      if (si >= steps.length) return;
      const [ms, fn] = steps[si];
      tm = setTimeout(() => { tm = 0; si++; fn(); run(); }, RM ? 60 : ms);
    }
    function next() {
      const T = TASKS[i % TASKS.length]; i++;
      log.textContent = ''; ask.textContent = 'Nothing to approve yet — it is working.'; arm(false);
      task.textContent = 'TASK ' + pad2(i);
      steps = [[250, () => line('brief', '› ' + T.brief)]];
      T.work.forEach((w, k) => steps.push([k ? 650 : 1300, () => line('work', w)]));
      steps.push([700, () => line('check', T.check)]);
      steps.push([550, () => { line('wait', 'ready — waiting for you'); ask.textContent = T.ask; arm(true); }]);
      si = 0; run();
    }
    function decide(yes) {
      if (!armed) return;
      arm(false);
      const T = TASKS[(i - 1) % TASKS.length];
      const w = $(log, '.gate__l--wait'); if (w) w.classList.replace('gate__l--wait', 'gate__l--work');
      line(yes ? 'ok' : 'held', yes ? T.done : 'held · nothing changed');
      if (yes) { a++; ring.classList.remove('is-go'); void ring.offsetWidth; ring.classList.add('is-go'); } else h++;
      nA.textContent = pad2(a); nH.textContent = pad2(h);
      steps = [[2000, next]]; si = 0; run();
    }
    ok.addEventListener('click', () => decide(true));
    hold.addEventListener('click', () => decide(false));
    arm(false);
    register(root, {
      on() { visible = true; if (!started) { started = true; next(); } else if (parked) { parked = false; run(); } },
      off() { visible = false; },
    });
  }


  /* ── 4 · THE INDEX — drag ───────────────────────────────────────────
     Five dimensions, five columns; drag any of them. The plane of light
     rests on the LOWEST, because a firm cannot do what its weakest
     dimension will not allow — the same rule as THE WELL on the AI page
     and the ladder just below. The mean is printed, and struck through. */
  const DIMS = ['STRATEGY', 'WORKFORCE', 'WORKFLOW', 'GOVERNANCE', 'DATA'];
  const LEVELS = ['Exploratory', 'Implemented', 'Aligned', 'Scaled', 'Self-calibrating'];
  const SEED = [2.8, 3.3, 1.4, 2.1, 3.0];
  function rdx(root) {
    const box = $(root, '.rdx'), plot = $(root, '.rdx__plot'), plane = $(root, '.rdx__plane');
    const cols = [...root.querySelectorAll('.rdx__col')];
    const fills = cols.map((c) => $(c, '.rdx__fill')), knobs = cols.map((c) => $(c, '.rdx__knob'));
    const vEl = $(root, '.rdx__v'), lvEl = $(root, '.rdx__lv'), mEl = $(root, '.rdx__mean b'), why = $(root, '.rdx__why');
    const vals = RM ? SEED.slice() : [0, 0, 0, 0, 0];
    let intro = RM ? 1 : -1, drag = null;
    const f1 = (v) => (v < 10 ? '0' : '') + v.toFixed(1);

    function render() {
      const min = Math.min(...vals), low = vals.indexOf(min);
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      cols.forEach((c, k) => {
        const v = vals[k];
        fills[k].style.height = (v / 4 * 100).toFixed(2) + '%';
        fills[k].style.setProperty('--pl', v > 0 ? (min / v * 100).toFixed(1) + '%' : '100%');
        knobs[k].style.bottom = (v / 4 * 100).toFixed(2) + '%';
        knobs[k].setAttribute('aria-valuenow', v.toFixed(1));
        knobs[k].setAttribute('aria-valuetext', DIMS[k].toLowerCase() + ' ' + v.toFixed(1) + ' of 4');
        c.classList.toggle('is-low', k === low && intro >= 1);
      });
      plane.style.bottom = (min / 4 * 100).toFixed(2) + '%';
      const lv = Math.min(4, Math.floor(min + 1e-6));
      vEl.textContent = f1(min);
      lvEl.textContent = 'Level ' + pad2(lv) + ' — ' + LEVELS[lv];
      mEl.textContent = f1(mean);
      why.textContent = min >= 3.95
        ? 'Every dimension at the top. The firm tunes itself — and Zyrn is no longer required.'
        : DIMS[low].charAt(0) + DIMS[low].slice(1).toLowerCase() + ' is holding the whole firm at level ' + pad2(lv) +
          '. Lift it and the index moves. Lift any other and it does not.';
    }
    function setFrom(k, clientY) {
      const r = plot.getBoundingClientRect();
      vals[k] = Math.max(0, Math.min(4, (r.bottom - clientY) / r.height * 4));
      render();
    }
    function start(k, e) {
      if (intro < 1) { intro = 1; for (let j = 0; j < 5; j++) vals[j] = vals[j] || SEED[j]; }
      e.preventDefault();
      drag = { k, id: e.pointerId };
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
      box.classList.add('is-drag'); cols[k].classList.add('is-drag');
      setFrom(k, e.clientY);
    }
    function move(e) { if (drag && e.pointerId === drag.id) setFrom(drag.k, e.clientY); }
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      vals[drag.k] = Math.round(vals[drag.k] * 10) / 10;
      cols[drag.k].classList.remove('is-drag'); box.classList.remove('is-drag'); drag = null; render();
    }
    cols.forEach((c, k) => {
      const kn = knobs[k], bar = $(c, '.rdx__bar');
      kn.addEventListener('pointerdown', (e) => start(k, e));
      bar.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') start(k, e); });
      [kn, bar].forEach((el) => {
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', end);
        el.addEventListener('pointercancel', end);
      });
      kn.addEventListener('keydown', (e) => {
        const step = { ArrowUp: 0.1, ArrowRight: 0.1, ArrowDown: -0.1, ArrowLeft: -0.1, PageUp: 0.5, PageDown: -0.5 }[e.key];
        if (step === undefined && e.key !== 'Home' && e.key !== 'End') return;
        e.preventDefault();
        if (intro < 1) { intro = 1; for (let j = 0; j < 5; j++) vals[j] = SEED[j]; }
        vals[k] = e.key === 'Home' ? 0 : e.key === 'End' ? 4 : Math.max(0, Math.min(4, Math.round((vals[k] + step) * 10) / 10));
        render();
      });
    });
    render();
    register(root, {
      on() { if (intro < 0) intro = 0; },
      frame(dt) {
        if (intro < 0 || intro >= 1) return;
        intro = Math.min(1, intro + dt / 1.6);
        SEED.forEach((s, k) => { vals[k] = s * smooth(clamp01((intro - k * 0.07) / 0.72)); });
        render();
      },
    });
  }


  /* ── 5 · THE NIGHT SHIFT — scrub ────────────────────────────────────
     A day on one ring, starting from Amman's real time. The firm's people
     are off from 22:00 to 07:00 (the shaded arc). The bot answers all the
     way round; work an agent finishes at night queues at the GATE until
     a person arrives at 07:00. Drag the hand to scrub; it resumes. */
  const BOT = [0.4, 1.2, 2.1, 3.6, 5.0, 6.3, 7.2, 7.8, 8.4, 9.0, 9.5, 10.1, 10.7, 11.2, 11.9, 12.5, 13.1, 13.8,
               14.4, 15.0, 15.7, 16.3, 17.0, 17.6, 18.3, 19.0, 19.8, 20.6, 21.4, 22.3, 23.1];
  const AGENT = [23.6, 1.3, 4.2, 10.4, 14.1, 16.8];
  const OFF_A = 22, OFF_B = 7;
  const offHours = (t) => t >= OFF_A || t < OFF_B;
  function ammanNow() {
    try {
      const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Amman', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      const hh = +p.find((x) => x.type === 'hour').value % 24, mm = +p.find((x) => x.type === 'minute').value;
      return hh + mm / 60;
    } catch (_) { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  }
  const hhmm = (t) => { const m = Math.floor(((t % 24) + 24) % 24 * 60); return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); };
  function night(root) {
    const box = $(root, '.night'), svg = $(root, '.night__svg'), sweep = $(root, '.night__sweep');
    const NS = 'http://www.w3.org/2000/svg', C = 200, R = 140, RB = 160, RA = 96;
    const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; };
    const ang = (t) => (t / 24) * Math.PI * 2 - Math.PI / 2;
    const pt = (r, t) => [C + r * Math.cos(ang(t)), C + r * Math.sin(ang(t))];
    const tEl = $(root, '.night__time'), sEl = $(root, '.night__st');
    const bEl = $(root, '.night__b'), qEl = $(root, '.night__q'), yEl = $(root, '.night__y'), back = $(root, '.night__back');

    // the off-hours arc, the ring, the ticks
    const a0 = pt(R, OFF_A), a1 = pt(R, OFF_B + 24);
    el('path', { class: 'night__off', d: 'M' + a0[0].toFixed(1) + ' ' + a0[1].toFixed(1) + 'A' + R + ' ' + R + ' 0 0 1 ' + a1[0].toFixed(1) + ' ' + a1[1].toFixed(1) });
    el('circle', { class: 'night__track', cx: C, cy: C, r: R });
    for (let hr = 0; hr < 24; hr++) {
      const m = hr % 6 === 0, p0 = pt(R - (m ? 9 : 5), hr), p1 = pt(R + (m ? 9 : 5), hr);
      el('line', { class: 'night__tick' + (m ? ' night__tick--m' : ''), x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1] });
      if (m) { const l = pt(R - 26, hr); const tx = el('text', { class: 'night__hl', x: l[0], y: l[1] }); tx.textContent = pad2(hr); }
    }
    const ol = pt(R, 2.5), ot = el('text', { class: 'night__offl', x: ol[0], y: ol[1] + 3, 'text-anchor': 'middle' }); ot.textContent = 'OFF HOURS';
    // the gate at 07:00
    const g0 = pt(RA - 10, OFF_B), g1 = pt(R - 12, OFF_B);
    el('line', { class: 'night__gate', x1: g0[0], y1: g0[1], x2: g1[0], y2: g1[1] });
    // the events
    const bots = BOT.map((t) => { const p = pt(RB, t); return { t, e: el('circle', { class: 'night__ev night__ev--bot', cx: p[0], cy: p[1], r: 3 }) }; });
    const tethers = el('g', {});
    const agents = AGENT.map((t) => {
      const p = pt(RA, t);
      const night = offHours(t);
      const tet = night ? el('path', { class: 'night__tether', d: '' }, tethers) : null;
      return { t, night, tet, e: el('circle', { class: 'night__ev night__ev--ag', cx: p[0], cy: p[1], r: 4.2 }) };
    });
    // now, the hand, the knob
    const nowL = el('line', { class: 'night__now' }), nowT = el('text', { class: 'night__nowl', 'text-anchor': 'middle' }); nowT.textContent = 'NOW';
    const hand = el('g', { class: 'night__hand' });
    const hl = el('line', { x1: C, y1: C - 40, x2: C, y2: C - RB - 8 }, hand);
    const knob = el('circle', { class: 'night__knob', cx: C, cy: C - R, r: 7 }, hand);
    const hit = el('circle', { class: 'night__hit', cx: C, cy: C - R, r: 24 }, hand);
    hl.setAttribute('stroke-linecap', 'round');

    let tau = ammanNow(), now = tau, drag = null, nowTick = 0;
    function placeNow() {
      now = ammanNow();
      const p0 = pt(RB + 10, now), p1 = pt(RB + 22, now), pl = pt(RB + 33, now);
      nowL.setAttribute('x1', p0[0]); nowL.setAttribute('y1', p0[1]); nowL.setAttribute('x2', p1[0]); nowL.setAttribute('y2', p1[1]);
      nowT.setAttribute('x', pl[0]); nowT.setAttribute('y', pl[1] + 3);
      if (back) back.textContent = 'Back to now · Amman ' + hhmm(now);
    }
    // hours since an event, looking back round the ring from the hand
    const since = (t) => ((tau - t) % 24 + 24) % 24;
    function render() {
      const deg = (tau / 24) * 360;
      hand.setAttribute('transform', 'rotate(' + deg.toFixed(2) + ' ' + C + ' ' + C + ')');
      if (sweep) sweep.style.transform = 'rotate(' + deg.toFixed(2) + 'deg)';
      bots.forEach((b) => {
        const s = since(b.t);
        const o = s < 0.35 ? 1 : 0.18 + 0.62 * Math.max(0, 1 - s / 14);
        b.e.setAttribute('opacity', o.toFixed(2));
        b.e.setAttribute('r', s < 0.35 ? (5.5 - s * 7).toFixed(2) : '3');
      });
      let queued = 0, morning = 0;
      agents.forEach((a) => {
        const s = since(a.t), wait = a.night ? ((OFF_B - a.t) % 24 + 24) % 24 : 0.25;
        const q = s < wait, okd = !q && s < 14;
        a.e.setAttribute('class', 'night__ev night__ev--ag' + (q ? ' is-q' : okd ? ' is-ok' : ''));
        a.e.setAttribute('opacity', q || okd ? '1' : '0.3');
        if (a.tet) {
          if (q) {
            const p = pt(RA, a.t), gx = pt(RA, OFF_B);
            a.tet.setAttribute('d', 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + 'Q' + C + ' ' + C + ' ' + gx[0].toFixed(1) + ' ' + gx[1].toFixed(1));
          } else a.tet.setAttribute('d', '');
        }
        if (q) queued++;
      });
      const off = offHours(tau);
      morning = off ? 0 : agents.filter((a) => a.night).length;
      // answered since the office closed, counted off the authored day
      const closedFor = off ? ((tau - OFF_A) % 24 + 24) % 24 : 9;
      const answered = BOT.filter((t) => { const s = since(t); return off ? s <= closedFor : (((t - OFF_A) % 24 + 24) % 24) < 9; }).length;
      tEl.textContent = hhmm(tau);
      sEl.textContent = off ? 'OFF HOURS' : 'OFFICE HOURS';
      bEl.innerHTML = (off ? 'Answered since 22:00 — <b>' : 'Answered overnight — <b>') + pad2(answered) + '</b>';
      qEl.innerHTML = queued ? 'Waiting at the gate — <b>' + pad2(queued) + '</b>' : (off ? 'Nothing waiting yet' : 'Nothing waiting');
      yEl.innerHTML = off ? 'Asleep. The gate opens at <b>07:00</b>' : 'Approved this morning — <b>' + pad2(morning) + '</b>';
      box.classList.toggle('is-off', off);
    }
    function fromPointer(e) {
      const r = svg.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * 400 - C, y = (e.clientY - r.top) / r.height * 400 - C;
      let a = Math.atan2(y, x) + Math.PI / 2;
      if (a < 0) a += Math.PI * 2;
      tau = (a / (Math.PI * 2)) * 24;
      render();
    }
    hit.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = e.pointerId; try { hit.setPointerCapture(e.pointerId); } catch (_) {} box.classList.add('is-drag'); });
    hit.addEventListener('pointermove', (e) => { if (drag === e.pointerId) fromPointer(e); });
    const stop = (e) => { if (drag === e.pointerId) { drag = null; box.classList.remove('is-drag'); } };
    hit.addEventListener('pointerup', stop); hit.addEventListener('pointercancel', stop);
    svg.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.target !== hit) { fromPointer(e); } });
    if (back) back.addEventListener('click', () => { placeNow(); tau = now; render(); });
    placeNow(); render();
    register(root, {
      frame(dt) {
        if ((nowTick += dt) > 20) { nowTick = 0; placeNow(); }
        if (RM || drag !== null) return;
        tau = (tau + dt * (24 / 40)) % 24;     // a day in forty seconds
        render();
      },
    });
  }

  /* ── THE HANDOVER — SYS.05's middle (2026-10-04) ────────────────────
     Two ribbons over eight quarters. Zyrn's hands on the work taper to
     nothing by the end of Q6; the firm's own grow to all of it; the
     readiness number climbs underneath. The playhead runs the engagement
     once when first seen and rests on the end state, which is the claim
     ("Zyrn is no longer required"); drag or press to scrub. The curve is
     authored — the shape of an engagement, not a client's record. */
  const Q = [['Q1', 'Diagnose'], ['Q2', 'Install'], ['Q3', 'Run together'], ['Q4', 'Run together'],
             ['Q5', 'Hand over'], ['Q6', 'Hand over'], ['Q7', 'Alone'], ['Q8', 'Alone']];
  const LEAVE = 0.78;
  const sZ = (t) => smooth(clamp01((t - 0.08) / (LEAVE - 0.08)));
  const share = (t) => 1 - sZ(t);                                   // Zyrn's hands on it
  const ready = (t) => 0.4 + 3.6 * smooth(clamp01(t / 0.9));
  function hand(root) {
    const stage = $(root, '.hand__stage'), head = $(root, '.hand__head');
    const knob = $(root, '.hand__knob'), qEl = $(root, '.hand__q'), out = $(root, '.hand__lbl--out'), ring = $(root, '.hand__ring');
    const clipR = $(root, '#handClip rect');
    const vZ = $(root, '.hand__n--z .hand__v'), vF = $(root, '.hand__n--f .hand__v'), vR = $(root, '.hand__n--r .hand__v');
    const lv = $(root, '.hand__n--r .hand__k'), qts = [...root.querySelectorAll('.hand__qt')];
    const W = 1000, N = 64;
    // ribbon geometry: centres cross, thicknesses swap
    const cZ = (t) => 62 + 76 * sZ(t), cF = (t) => 138 - 76 * sZ(t);
    const hZ = (t) => (t < LEAVE ? 40 * (1 - sZ(t)) : 0);
    const hF = (t) => 7 + 40 * sZ(t);
    function ribbon(centre, half, upto) {
      const top = [], bot = [];
      for (let i = 0; i <= N; i++) {
        const t = Math.min(upto, i / N), x = t * W, c = centre(t), h = half(t);
        top.push(x.toFixed(1) + ' ' + (c - h).toFixed(1)); bot.push(x.toFixed(1) + ' ' + (c + h).toFixed(1));
        if (t >= upto) break;
      }
      return 'M' + top.join('L') + 'L' + bot.reverse().join('L') + 'Z';
    }
    const edge = (centre, half, sgn, upto) => {
      let d = '';
      for (let i = 0; i <= N; i++) { const t = Math.min(upto, i / N); d += (i ? 'L' : 'M') + (t * W).toFixed(1) + ' ' + (centre(t) + sgn * half(t)).toFixed(1); if (t >= upto) break; }
      return d;
    };
    const dZ = ribbon(cZ, hZ, LEAVE), dF = ribbon(cF, hF, 1);
    root.querySelectorAll('.hand__rib--z').forEach((e) => e.setAttribute('d', dZ));
    root.querySelectorAll('.hand__rib--f').forEach((e) => e.setAttribute('d', dF));
    $(root, '.hand__edge--z').setAttribute('d', edge(cZ, hZ, -1, LEAVE));
    $(root, '.hand__edge--f').setAttribute('d', edge(cF, hF, 1, 1));
    const px = (t) => t * stage.getBoundingClientRect().width;
    let t = 0, played = false, drag = null, lastQ = -1;
    const pct = (v) => pad2(Math.round(v * 100)) + '%';
    function render() {
      head.style.transform = 'translate3d(' + px(t).toFixed(1) + 'px,0,0)';
      knob.style.left = 'clamp(22px,' + (t * 100).toFixed(2) + '%,calc(100% - 22px))';   // the 44px knob stays inside the stage at both ends
      clipR.setAttribute('width', (t * W).toFixed(1));
      const q = Math.min(7, Math.floor(t * 8));
      if (q !== lastQ) { lastQ = q; qEl.textContent = Q[q][0] + ' \u00b7 ' + Q[q][1].toUpperCase(); qts.forEach((e, k) => e.classList.toggle('is-past', k <= q)); }
      const z = share(t), r = ready(t);
      vZ.textContent = pct(z); vF.textContent = pct(1 - z); vR.textContent = (r < 10 ? '0' : '') + r.toFixed(1);
      lv.textContent = 'READINESS \u00b7 LEVEL ' + pad2(Math.min(4, Math.floor(r)));
      const isOut = t >= LEAVE;
      if (isOut !== root.classList.contains('is-out')) root.classList.toggle('is-out', isOut);
      knob.setAttribute('aria-valuenow', Math.round(t * 100));
      root.classList.toggle('is-late', t > 0.8);
    }
    function fromX(clientX) {
      const r = stage.getBoundingClientRect();
      t = clamp01((clientX - r.left) / r.width); render();
    }
    const start = (e) => { e.preventDefault(); played = true; drag = e.pointerId; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} root.classList.add('is-drag'); fromX(e.clientX); };
    const move = (e) => { if (drag === e.pointerId) fromX(e.clientX); };
    const end = (e) => { if (drag === e.pointerId) { drag = null; root.classList.remove('is-drag'); } };
    knob.addEventListener('pointerdown', start);
    stage.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.target !== knob) start(e); });
    [knob, stage].forEach((el) => { el.addEventListener('pointermove', move); el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); });
    knob.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 0.02, ArrowUp: 0.02, ArrowLeft: -0.02, ArrowDown: -0.02, PageUp: 0.125, PageDown: -0.125 }[e.key];
      if (d === undefined && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault(); played = true;
      t = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : clamp01(t + d); render();
    });
    // the out marker and the ring sit where Zyrn leaves
    const place = () => { const x = px(LEAVE); out.style.left = x + 'px'; ring.style.left = x + 'px'; render(); };
    place(); addEventListener('resize', place);
    if (RM) { t = 1; played = true; render(); }
    register(root, {
      frame(dt) {
        if (played || drag !== null) return;
        t = Math.min(1, t + dt / 22);
        if (t >= 1) played = true;
        render();
      },
    });
  }


  /* ── THE CLIMB — SYS.04's ladder, lit by scroll ─────────────────────── */
  function ladder(root) {
    const steps = [...root.querySelectorAll('.step')];
    const run = document.createElement('i'); run.className = 'ladder__run'; run.setAttribute('aria-hidden', 'true');
    root.appendChild(run);
    let last = -1;
    function frame() {
      const r = root.getBoundingClientRect(), vh = innerHeight;
      const p = RM ? 1 : clamp01((vh * 0.88 - r.top) / (vh * 0.55));
      if (Math.abs(p - last) < 0.002) return;
      last = p;
      root.style.setProperty('--p', p.toFixed(4));
      root.style.setProperty('--on', p > 0.01 && p < 0.995 ? '1' : '0');
      steps.forEach((s, k) => s.classList.toggle('is-lit', p >= k / (steps.length - 1) - 0.01));
    }
    frame();
    register(root, { frame });
  }


  /* ── THE BOOT — the hero cluster (2026-10-04) ───────────────────────
     Mono lines DECODE: every character shows glyph noise until the cursor
     reaches it, left to right. The lede's words slam in (CSS). The
     tagline's letters cascade (CSS). On scroll the mono lines re-encode
     from the right and the two rows take depth. Starts the moment the
     entrance hands the page over (body.is-intro removed), or at once if
     there is no entrance. Never touches the shear mark. */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\u2014\u00b7<>[]=+*#';
  const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
  function heroBoot() {
    const hero = document.querySelector('[data-sys-section="01"]');
    if (!hero) return;
    hero.classList.add('hero--boot');
    const scan = document.createElement('i'); scan.className = 'hero__scan'; scan.setAttribute('aria-hidden', 'true');
    hero.appendChild(scan);
    // the lines that decode: every text node inside them, by reference
    const monoEls = [...hero.querySelectorAll('.index__item, .badge, .lockup__live')];
    const lines = monoEls.map((el, i) => {
      const nodes = [];
      const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType === 3 && c.nodeValue.trim()) nodes.push({ n: c, f: c.nodeValue }); else if (c.nodeType === 1 && c.id !== 'hCount') walk(c); } };
      walk(el);
      return { el, nodes, len: nodes.reduce((s, x) => s + x.f.length, 0), delay: i * 90 };
    });
    function write(line, resolved) {
      let k = 0;
      for (const x of line.nodes) {
        let out = '';
        for (let i = 0; i < x.f.length; i++, k++) {
          const ch = x.f[i];
          out += ch === ' ' || k < resolved ? ch : glyph();
        }
        if (x.n.nodeValue !== out) x.n.nodeValue = out;
      }
    }
    function restore(line) { for (const x of line.nodes) if (x.n.nodeValue !== x.f) x.n.nodeValue = x.f; }
    // the lede: words; the tagline: characters
    const lede = hero.querySelector('.lede');
    if (lede && !RM) {
      const words = lede.textContent.trim().split(/(\s+)/);
      lede.textContent = '';
      let wi = 0;
      words.forEach((w) => {
        if (!w.trim()) { lede.appendChild(document.createTextNode(w)); return; }
        const sp = document.createElement('span'); sp.className = 'bt-w'; sp.textContent = w;
        sp.style.setProperty('--d', (260 + wi++ * 38) + 'ms'); lede.appendChild(sp);
      });
    }
    const tag = hero.querySelector('.lockup__sub');
    if (tag && !RM) {
      const t = tag.textContent; tag.textContent = '';
      [...t].forEach((c, i) => { const sp = document.createElement('span'); sp.className = 'bt-c'; sp.textContent = c; sp.style.setProperty('--d', (380 + i * 22) + 'ms'); tag.appendChild(sp); });
    }
    const rowTop = hero.querySelector('.row--top'), lockCol = hero.querySelector('.row--bottom > div');
    let t0 = 0, booting = false, booted = RM, scramble = 0, roll = 0;
    const DUR = 760;
    function bootFrame(now) {
      const e = now - t0;
      let doneAll = true;
      lines.forEach((l) => {
        const p = clamp01((e - 180 - l.delay) / DUR);
        if (p < 1) { doneAll = false; write(l, Math.floor(p * (l.len + 1))); } else restore(l);
      });
      if (!doneAll) requestAnimationFrame(bootFrame);
      else { booting = false; booted = true; }
    }
    function startBoot() {
      if (booting || booted) return;
      booting = true; t0 = performance.now();
      hero.style.setProperty('--hh', hero.offsetHeight + 'px');
      hero.classList.add('is-boot');
      lines.forEach((l) => write(l, 0));
      requestAnimationFrame(bootFrame);
    }
    // on scroll: depth, and the mono lines re-encode from the right
    function frame(dt) {
      const vh = innerHeight, p = clamp01(scrollY / (vh * 0.9));
      if (rowTop) { rowTop.style.transform = p ? 'translate3d(0,' + (-p * vh * 0.22).toFixed(1) + 'px,0)' : ''; rowTop.style.opacity = (1 - p * 0.85).toFixed(3); }
      if (lockCol) { lockCol.style.transform = p ? 'translate3d(0,' + (-p * vh * 0.1).toFixed(1) + 'px,0)' : ''; lockCol.style.opacity = (1 - p * 0.7).toFixed(3); }
      if (!booted) return;
      const a = clamp01((p - 0.22) / 0.5);
      if (a === 0) { if (scramble !== 0) { scramble = 0; lines.forEach(restore); } return; }
      roll += dt;
      if (roll < 0.08 && scramble > 0) return;      // re-roll the noise at ~12fps, not 60
      roll = 0; scramble = a;
      lines.forEach((l) => write(l, Math.floor((1 - a) * l.len)));
    }
    if (document.body.classList.contains('is-intro')) {
      new MutationObserver((_, mo) => { if (!document.body.classList.contains('is-intro')) { mo.disconnect(); setTimeout(startBoot, 60); } })
        .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } else setTimeout(startBoot, 120);
    if (!RM) register(hero, { frame });
  }

  function boot() {
    heroBoot();
    const map = { fold, river, gate, rdx, night, hand, ladder };
    document.querySelectorAll('[data-ilude]').forEach((r) => { const f = map[r.getAttribute('data-ilude')]; if (f) f(r); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
