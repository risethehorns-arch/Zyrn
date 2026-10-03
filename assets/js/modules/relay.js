/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE RELAY   (services/agent-training.html)

   The whole programme in one picture: a machine the firm owns on the
   left, the reader's hand on the right, and a private link between them.
   An agent is installed on the machine, briefed from the phone, does the
   work where the work lives, stops at a gate that only the hand can open,
   and hands the result back — to the phone.

   It is AUTHORED, not recorded, and the stage says so. The brief, the
   files and the checks are a demonstration of the method — the same
   method this site was built with — not a transcript. Every count on the
   key rail is counted off what the demonstration itself puts on screen.

   ── HOW IT IS DRIVEN ────────────────────────────────────────────────
   Six stations across the track. One number, T = station + progress
   within it (0..6), and every element on the stage is a reveal keyed to
   a moment on that line: a console line types in from t0 over `dur`, a
   packet travels the link from t0 over `dur`, a card arrives at t0. So
   the scroll is the only clock, every dwell answers the wheel, and
   nothing can run ahead of the reader or be left behind by them.

   Per frame: a custom property per element that changed, a transform per
   packet. The link's path is computed once per resize, never per frame.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, onNear, swapText, pad3, REDUCED } from './_track.js';

const BEATS = [
  ['00 — YOUR MACHINE',
   'Everything runs here, on hardware the firm owns. Nothing of yours leaves it unless you send it. The programme starts by making that true, and then by making it comfortable: the agent lives where the work lives.'],
  ['01 — THE AGENT, INSTALLED',
   'Installed on this machine, pointed at this firm’s work, set to ask before it changes anything. Then the private link: a name only your own devices can reach, so the phone in your pocket is a door to this desk and nothing else.'],
  ['02 — THE BRIEF, FROM YOUR PHONE',
   'A brief is a sentence with a standard in it. This one carries three: what to build, what to keep, where to show it. It travels the link, lands on the machine, and the agent reads it for the standard, not just the task.'],
  ['03 — THE WORK, WHERE THE WORK LIVES',
   'The agent reads the files that matter, rewrites the one it was asked to, and writes the check that proves it. Three files, three checks. You can watch, or not: the console is the record, and it stays on the machine.'],
  ['04 — THE GATE',
   'Publishing is a decision, and decisions are the reader’s. The agent stops at the gate and asks — on the phone, wherever it is. Allow, or hold. Nothing ships on a guess, and nothing ships while you are not looking.'],
  ['05 — HANDED BACK',
   'The result returns to the hand that briefed it: a live preview, the three checks that passed, the three files that changed. What the programme leaves behind is a person who runs this loop on their own machine, from anywhere.'],
];

const RUN_A = 0.03, RUN_B = 0.95;
const N = BEATS.length;

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (t) => t * t * (3 - 2 * t);

/* ── the console, authored ───────────────────────────────────────────
   [t0, dur, class, text] — t0 on the station line (0..6) */
const CONSOLE = [
  [0.30, 0.40, 'dim', 'the-firm / site    ·    1 machine    ·    yours'],
  [1.05, 0.35, 'cmd', '› install the agent'],
  [1.40, 0.45, 'out', '  ready · on this machine · asks before any change'],
  [1.78, 0.30, 'out', '  permission: ask   ·   workspace: the-firm/site'],
  [2.62, 0.30, 'cmd', '› brief received — from your phone'],
  [2.90, 0.50, 'q',   '  “Rebuild the pricing page. Keep the brand tokens. Show me on my phone before it ships.”'],
  [3.05, 0.25, 'cmd', '› reading   assets/tokens.css'],
  [3.30, 0.30, 'cmd', '› rewriting pricing.html'],
  [3.58, 0.28, 'cmd', '› writing   pricing.test.js'],
  [3.84, 0.34, 'ok',  '  checks   layout ✓   contrast ✓   phone ✓'],
  [4.08, 0.30, 'wait','› ready to publish — waiting for you'],
  [4.72, 0.28, 'ok',  '  approved · from your phone'],
  [5.08, 0.30, 'cmd', '› published  pricing.html'],
  [5.40, 0.40, 'ok',  '  03 files changed · 03 checks passed · handed back'],
];

/* the file tree: [t0 of appearing, name, depth, mark, t0 of the mark] */
const TREE = [
  [1.20, 'the-firm/site', 0, '', 0],
  [1.30, 'index.html', 1, '', 0],
  [1.38, 'pricing.html', 1, 'M', 3.30],
  [1.46, 'assets/', 1, '', 0],
  [1.52, 'tokens.css', 2, 'R', 3.05],
  [1.58, 'pricing.test.js', 2, 'A', 3.58],
  [1.64, 'docs/', 1, '', 0],
];

/* the phone: [t0, kind, text] */
const CHAT = [
  [1.55, 'pill', 'PRIVATE LINK · ON'],
  [2.08, 'you',  'Rebuild the pricing page. Keep the brand tokens. Show me on my phone before it ships.'],
  [3.00, 'work', 'Working · 03 files · 03 checks'],
  [4.12, 'gate', 'Publish pricing.html?'],
  [5.20, 'done', 'Live · preview · 03 checks passed'],
];

/* the packets on the link: [t0, dur, direction] — 1 = phone → machine */
const PACKETS = [
  [2.40, 0.30, 1],
  [4.00, 0.26, -1],
  [4.60, 0.24, 1],
  [5.00, 0.30, -1],
];

export function initRelay() {
  const sec = document.getElementById('sigRelay');
  const rig = document.getElementById('rly');
  if (!sec || !rig) return;

  const track  = sec.querySelector('.sig__track');
  const view   = rig.querySelector('.rig__view');
  const scene  = document.getElementById('rlyScene');
  const mach   = document.getElementById('rlyMach');
  const cons   = document.getElementById('rlyCons');
  const tree   = document.getElementById('rlyTree');
  const phone  = document.getElementById('rlyPhone');
  const chat   = document.getElementById('rlyChat');
  const link   = document.getElementById('rlyLink');
  const pkHost = document.getElementById('rlyPks');
  const stepEl = document.getElementById('rlyStep');
  const noteEl = document.getElementById('rlyNote');
  const pctEl  = document.getElementById('rlyPct');
  const keyEl  = document.getElementById('rlyKey');
  const rows   = keyEl ? Array.prototype.slice.call(keyEl.children) : [];

  /* ── build ──────────────────────────────────────────────────────── */
  const lines = CONSOLE.map((c) => {
    const el = document.createElement('div');
    el.className = 'rly__ln rly__ln--' + c[2];
    el.textContent = c[3];
    el.style.setProperty('--w', '0');
    cons.appendChild(el);
    return { el, t0: c[0], dur: c[1], w: -1 };
  });
  const files = TREE.map((f) => {
    const el = document.createElement('div');
    el.className = 'rly__f rly__f--' + f[2];
    el.innerHTML = '<span class="rly__fn"></span><i class="mono rly__fm"></i>';
    el.firstChild.textContent = f[1];
    el.lastChild.textContent = f[3];
    el.style.setProperty('--w', '0');
    tree.appendChild(el);
    return { el, t0: f[0], mk: f[4], w: -1, on: null };
  });
  const cards = CHAT.map((c) => {
    const el = document.createElement('div');
    el.className = 'rly__c rly__c--' + c[1];
    if (c[1] === 'you') {
      el.innerHTML = '<span class="rly__ct"></span><i class="rly__cur"></i>';
      el.firstChild.textContent = c[2];
    } else if (c[1] === 'work') {
      el.innerHTML = '<span class="mono rly__ck">THE AGENT</span><span class="rly__ct"></span><span class="rly__bar"><i></i></span>';
      el.children[1].textContent = c[2];
    } else if (c[1] === 'gate') {
      el.innerHTML = '<span class="mono rly__ck">THE GATE</span><span class="rly__ct"></span>' +
        '<span class="rly__btns"><span class="mono rly__btn rly__btn--ok">ALLOW</span><span class="mono rly__btn">HOLD</span></span>';
      el.children[1].textContent = c[2];
    } else if (c[1] === 'done') {
      el.innerHTML = '<span class="mono rly__ck">HANDED BACK</span><span class="rly__prev" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="rly__ct"></span>';
      el.children[2].textContent = c[2];
    } else {
      el.innerHTML = '<span class="mono"></span>';
      el.firstChild.textContent = c[2];
    }
    el.style.setProperty('--w', '0');
    chat.appendChild(el);
    return { el, t0: c[0], kind: c[1], w: -1 };
  });
  const packets = PACKETS.map((p) => {
    const el = document.createElement('i');
    el.className = 'rly__pk';
    pkHost.appendChild(el);
    return { el, t0: p[0], dur: p[1], dir: p[2], tf: '' };
  });
  const gateBtn = chat.querySelector('.rly__btn--ok');
  const workBar = chat.querySelector('.rly__bar > i');

  /* counted off the demonstration itself, never typed on the rail */
  if (keyEl) {
    const c = {
      files: TREE.filter((f) => f[3]).length,
      checks: (CONSOLE.find((l) => l[2] === 'ok' && /checks/.test(l[3])) || [0, 0, '', ''])[3].split('✓').length - 1,
      gates: CHAT.filter((x) => x[1] === 'gate').length,
    };
    Object.keys(c).forEach((k) => {
      const t = keyEl.querySelector('[data-c="' + k + '"]');
      if (t) t.textContent = String(c[k]).padStart(2, '0');
    });
  }

  /* ── the link, measured once per resize ────────────────────────── */
  const geo = { ax: 0, ay: 0, bx: 0, by: 0, c1x: 0, c1y: 0, c2x: 0, c2y: 0 };
  function measure() {
    chatPad = parseFloat(getComputedStyle(chat).paddingBottom) || 0;
    const v = view.getBoundingClientRect();
    const m = mach.getBoundingClientRect();
    const p = phone.getBoundingClientRect();
    geo.ax = m.right - v.left; geo.ay = m.top - v.top + m.height * 0.46;
    geo.bx = p.left - v.left;  geo.by = p.top - v.top + p.height * 0.30;
    const dx = geo.bx - geo.ax;
    geo.c1x = geo.ax + dx * 0.45; geo.c1y = geo.ay + (geo.by - geo.ay) * 0.1 + v.height * 0.06;
    geo.c2x = geo.ax + dx * 0.55; geo.c2y = geo.by - v.height * 0.04;
    const d = 'M' + geo.ax.toFixed(1) + ' ' + geo.ay.toFixed(1) +
      'C' + geo.c1x.toFixed(1) + ' ' + geo.c1y.toFixed(1) + ' ' + geo.c2x.toFixed(1) + ' ' + geo.c2y.toFixed(1) +
      ' ' + geo.bx.toFixed(1) + ' ' + geo.by.toFixed(1);
    link.setAttribute('viewBox', '0 0 ' + v.width.toFixed(0) + ' ' + v.height.toFixed(0));
    Array.prototype.forEach.call(link.querySelectorAll('path'), (q) => q.setAttribute('d', d));
    const tag = document.getElementById('rlyTagLink');
    if (tag) {
      /* the caption sits under the link's midpoint, but the link is only
         as long as the gap between the machine and the phone — where the
         caption is wider than that gap it is held off, not laid over the
         phone's bezel */
      const tw = tag.firstElementChild ? tag.firstElementChild.offsetWidth : tag.offsetWidth;
      const gap = geo.bx - geo.ax;
      tag.classList.toggle('is-off', tw + 16 > gap);
      const mx = Math.min(geo.bx - tw / 2 - 8, Math.max(geo.ax + tw / 2 + 8, bez(0.5, geo.ax, geo.c1x, geo.c2x, geo.bx)));
      const my = bez(0.5, geo.ay, geo.c1y, geo.c2y, geo.by);
      tag.style.transform = 'translate3d(' + mx.toFixed(1) + 'px,' + (my + 12).toFixed(1) + 'px,0)';
    }
    packets.forEach((k) => { k.tf = ''; });
    lastT = -1;
  }
  const bez = (t, a, b, c, d) => {
    const u = 1 - t;
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
  };

  /* ── one frame ──────────────────────────────────────────────────── */
  let shown = -1, lastT = -1, gateOn = null;
  function beat(i) {
    if (i === shown) return;
    shown = i;
    swapText(stepEl, BEATS[i][0]);
    swapText(noteEl, BEATS[i][1]);
    rows.forEach((r, k) => r.classList.toggle('is-on', k === i));
    rig.dataset.act = String(i);
  }
  const rev = (T, t0, dur) => clamp01((T - t0) / (dur || 0.3));
  const q = (v) => Math.round(v * 100) / 100;

  let lastFollow = -1, chatPad = 0;
  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);
    const u = clamp01((p - RUN_A) / (RUN_B - RUN_A));
    const T = u * N;
    const k = Math.min(N - 1, Math.floor(T));
    beat(k);
    if (Math.abs(T - lastT) < 0.0005) return;
    lastT = T;

    /* the room comes on: machine, then phone */
    rig.style.setProperty('--mach', q(smooth(rev(T, 0.05, 0.4))));
    rig.style.setProperty('--phone', q(smooth(rev(T, 0.55, 0.45))));
    rig.style.setProperty('--draw', q(smooth(rev(T, 1.15, 0.5))));
    rig.style.setProperty('--work', q(rev(T, 3.0, 1.0)));
    rig.style.setProperty('--done', q(smooth(rev(T, 5.1, 0.5))));

    for (const l of lines) {
      const w = q(rev(T, l.t0, l.dur));
      if (w !== l.w) { l.w = w; l.el.style.setProperty('--w', String(w)); }
    }
    for (const f of files) {
      const w = q(smooth(rev(T, f.t0, 0.25)));
      if (w !== f.w) { f.w = w; f.el.style.setProperty('--w', String(w)); }
      const on = f.mk ? T >= f.mk : false;
      if (on !== f.on) { f.on = on; f.el.classList.toggle('is-marked', on); }
    }
    /* the thread keeps its newest bubble in view, the way a phone does:
       the window slides to each bubble as it arrives, on the bubble's own
       entry, so a stage too short for the whole thread shows the part
       that is live rather than clipping the hand-back off the bottom */
    let follow = 0;
    for (const c of cards) {
      const w = q(c.kind === 'you' ? rev(T, c.t0, 0.42) : smooth(rev(T, c.t0, 0.3)));
      if (w !== c.w) { c.w = w; c.el.style.setProperty('--w', String(w)); }
      if (w > 0) {
        const want = Math.max(0, c.el.offsetTop - chat.offsetTop + c.el.offsetHeight + chatPad - chat.clientHeight);
        follow += (want - follow) * Math.min(1, w * 3);
      }
    }
    follow = Math.round(follow);
    if (follow !== lastFollow) { lastFollow = follow; chat.scrollTop = follow; }
    if (workBar) workBar.style.transform = 'scaleX(' + q(rev(T, 3.05, 0.95)).toFixed(2) + ')';
    const g = T >= 4.6;
    if (g !== gateOn) { gateOn = g; gateBtn && gateBtn.classList.toggle('is-on', g); rig.classList.toggle('is-allowed', g); }

    for (const k2 of packets) {
      const s = rev(T, k2.t0, k2.dur);
      let tf = 'scale(0)';
      if (s > 0 && s < 1) {
        const t = k2.dir > 0 ? 1 - s : s;                 // 1: phone → machine
        const x = bez(t, geo.ax, geo.c1x, geo.c2x, geo.bx);
        const y = bez(t, geo.ay, geo.c1y, geo.c2y, geo.by);
        const o = Math.sin(Math.PI * s);
        tf = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + (0.6 + 0.6 * o).toFixed(2) + ')';
      }
      if (tf !== k2.tf) { k2.tf = tf; k2.el.style.transform = tf; }
    }
  }

  measure();
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { measure(); lastFollow = -1; lastT = -1; draw(lastP); }).observe(view);
  let lastP = 0;
  const drawP = (p) => { lastP = p; draw(p); };

  if (REDUCED) {
    /* the whole loop, done: the claim is legible standing still */
    drawP(RUN_B);
    beat(N - 1);
    return;
  }
  onTrack(track, drawP);
  onNear(track, (p, room) => {
    rig.style.setProperty('--px', room.px.toFixed(4));
    rig.style.setProperty('--py', room.py.toFixed(4));
    rig.style.setProperty('--lean', room.vel.toFixed(4));
  });
}
