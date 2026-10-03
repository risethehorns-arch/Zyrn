/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE SWITCHBOARD   (services/bot-building.html)

   Six messages arrive on three channels and pile up unread. Then one
   bot: every channel into one door, every message read for what it
   wants, looked up in the firm's own systems, answered in the lane it
   came from — and the one the bot should not answer is handed to a
   person, with the whole thread attached.

   AUTHORED, not recorded, and the stage says so. The six messages, the
   three channels, the lookups and the one hand-over are a demonstration
   of a bot we would build. Every count on the key rail is counted off
   the demonstration itself — the MESSAGES array is the only source.

   ── HOW IT IS DRIVEN ────────────────────────────────────────────────
   One number, T = station + progress within it (0..6). Every message has
   a position per station; it travels between two of them in the second
   half of the station it is leaving, each one a little after the last.
   Everything else — the tags, the lookups, the ticks, the hand-over — is
   a reveal keyed to a moment on that line. The scroll is the only clock.

   Messages are DOM (real type), moved by transform only. The lanes and
   the net are SVG drawn in by progress. Positions are in units of the
   stage and baked to pixels on resize, so a resize redraws.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, onNear, swapText, pad3, REDUCED } from './_track.js';

const BEATS = [
  ['00 — THE INBOX',
   'Six messages on three channels, which is how they actually arrive: at once, in different voices, and unread. Everything after this is the same six messages — none dropped, none answered twice.'],
  ['01 — ONE DOOR',
   'Every channel into one bot. Not three bots with three memories: one, which knows that the person on WhatsApp this morning is the person on the website tonight, and answers them the same way.'],
  ['02 — READ, NOT GUESSED',
   'Each message is read for what it wants — a booking, a price, an order, a place, a payment, a person — before anything is decided. Five intents in six messages. The sixth is the one that matters most.'],
  ['03 — LOOKED UP',
   'The bot reaches into the firm’s own systems and answers with what is actually there: the calendar for the slot, the desk for the price, the orders for the parcel. An answer that is not looked up is a guess. The bot does not guess.'],
  ['04 — ANSWERED, IN THE LANE THEY CAME',
   'Five replies travel back the way their questions arrived, in the firm’s own voice, each one saying where it looked. The same answer at two in the morning as at ten.'],
  ['05 — HANDED OVER, WHOLE',
   'The sixth asked for a person, and gets one — with the whole thread attached, not a ticket number and a blank page. The hand-over is the part of a bot that goes wrong everywhere else, which is why ours is designed first.'],
];

const RUN_A = 0.03, RUN_B = 0.95;
const N = BEATS.length;

/* the three channels, and where each lane sits (unit y) */
const CHANNELS = [
  { k: 'wa', name: 'WHATSAPP', y: 0.20 },
  { k: 'tg', name: 'TELEGRAM', y: 0.50 },
  { k: 'web', name: 'WEB CHAT', y: 0.80 },
];
/* the six messages: channel, text, intent, which system answers it, the reply */
const MESSAGES = [
  { ch: 0, t: 'Do you have Saturday 11am?',          intent: 'BOOK',   sys: 'cal',    reply: 'Saturday 11:00 is free — booked.' },
  { ch: 1, t: 'How much is the 2-bed in Abdoun?',    intent: 'PRICE',  sys: 'desk',   reply: '2-bed, Abdoun: 95,000 JOD.' },
  { ch: 2, t: 'My order hasn’t arrived.',            intent: 'ORDER',  sys: 'orders', reply: '#4471 is out for delivery today.' },
  { ch: 0, t: 'Where are you located?',              intent: 'WHERE',  sys: 'desk',   reply: 'Abdoun, Amman — map sent.' },
  { ch: 2, t: 'Can I pay by card?',                  intent: 'PAY',    sys: 'desk',   reply: 'Yes — card, transfer or cash.' },
  { ch: 1, t: 'I’d rather speak to a person.',       intent: 'PERSON', sys: 'person', reply: null },
];
/* the firm's systems, right column (unit y) */
const SYSTEMS = [
  { k: 'cal',    name: 'CALENDAR', y: 0.16, val: 'SAT 11:00 — FREE' },
  { k: 'desk',   name: 'THE DESK', y: 0.40, val: '2-BED ABDOUN — 95,000' },
  { k: 'orders', name: 'ORDERS',   y: 0.62, val: '#4471 — OUT FOR DELIVERY' },
  { k: 'person', name: 'A PERSON', y: 0.86, val: 'THREAD ATTACHED' },
];

const X = { lane: 0.02, laneW: 0.24, hub: 0.50, sys: 0.80, sysW: 0.19 };

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (t) => t * t * (3 - 2 * t);
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

export function initSwitch() {
  const sec = document.getElementById('sigSwitch');
  const rig = document.getElementById('swb');
  if (!sec || !rig) return;

  const track  = sec.querySelector('.sig__track');
  const view   = rig.querySelector('.rig__view');
  const net    = document.getElementById('swbNet');
  const lanesH = document.getElementById('swbLanes');
  const hub    = document.getElementById('swbHub');
  const sysH   = document.getElementById('swbSys');
  const msgsH  = document.getElementById('swbMsgs');
  const pksH   = document.getElementById('swbPks');
  const stepEl = document.getElementById('swbStep');
  const noteEl = document.getElementById('swbNote');
  const pctEl  = document.getElementById('swbPct');
  const keyEl  = document.getElementById('swbKey');
  const rows   = keyEl ? Array.prototype.slice.call(keyEl.children) : [];
  const nodes = {
    read: hub.querySelector('.swb__node--read'), look: hub.querySelector('.swb__node--look'),
    ans: hub.querySelector('.swb__node--ans'), hand: hub.querySelector('.swb__node--hand'),
  };

  /* ── build ──────────────────────────────────────────────────────── */
  const lanes = CHANNELS.map((c) => {
    const el = document.createElement('div');
    el.className = 'swb__lane swb__lane--' + c.k;
    el.innerHTML = '<span class="mono swb__ll"></span><i class="swb__rail"></i>';
    el.firstChild.textContent = c.name;
    lanesH.appendChild(el);
    return el;
  });
  const systems = SYSTEMS.map((s) => {
    const el = document.createElement('div');
    el.className = 'swb__s swb__s--' + s.k;
    el.innerHTML = '<span class="mono swb__sn"></span><span class="mono swb__sv"></span>';
    el.firstChild.textContent = s.name;
    el.lastChild.textContent = s.val;
    sysH.appendChild(el);
    return { el, on: null, lit: null };
  });
  const msgs = MESSAGES.map((m, i) => {
    const el = document.createElement('div');
    el.className = 'swb__m swb__m--' + CHANNELS[m.ch].k + (m.reply ? '' : ' swb__m--hand');
    el.innerHTML = '<span class="swb__mt"></span><i class="mono swb__tag"></i><span class="swb__rep"></span><i class="swb__tick"></i>';
    el.children[0].textContent = m.t;
    el.children[1].textContent = m.intent;
    el.children[2].textContent = m.reply || 'Handing you to a person — they have the thread.';
    msgsH.appendChild(el);
    return { el, i, m, tf: '', cls: '' };
  });
  const packets = MESSAGES.filter((m) => m.reply).map(() => {
    const el = document.createElement('i');
    el.className = 'swb__pk';
    pksH.appendChild(el);
    return { el, tf: '' };
  });

  /* counted off the demonstration, never typed on the rail */
  if (keyEl) {
    const c = {
      msgs: MESSAGES.length,
      chan: CHANNELS.length,
      intents: new Set(MESSAGES.map((m) => m.intent)).size - 1,     // PERSON is a hand-over, not an intent the bot answers
      looks: new Set(MESSAGES.filter((m) => m.reply).map((m) => m.sys)).size,
      answered: MESSAGES.filter((m) => m.reply).length,
      handed: MESSAGES.filter((m) => !m.reply).length,
    };
    Object.keys(c).forEach((k) => {
      const t = keyEl.querySelector('[data-c="' + k + '"]');
      if (t) t.textContent = String(c[k]).padStart(2, '0');
    });
  }

  /* ── geometry, baked on resize ──────────────────────────────────── */
  let W = 0, H = 0;
  const px = (u) => u * W, py = (u) => u * H;
  /* two per lane, one above the rail and one below it, clear of the line */
  /* positions are a message's TOP-LEFT corner */
  const laneSlot = (ch, j) => ({ x: X.lane + 0.01 + j * 0.012, y: CHANNELS[ch].y + (j ? 0.028 : -0.17) });

  /* where each message is at each station: six positions per message */
  function placeAll() {
    const perLane = [[], [], []];
    MESSAGES.forEach((m, i) => perLane[m.ch].push(i));
    return MESSAGES.map((m, i) => {
      const j = perLane[m.ch].indexOf(i);
      const lane = laneSlot(m.ch, j);
      const queue = { x: X.hub - 0.305 + (i % 2) * 0.012, y: 0.13 + i * 0.118 };     // stacked at the door, left of the bot
      const sys = SYSTEMS.find((s) => s.k === m.sys);
      const back = { x: lane.x, y: lane.y };
      const hand = { x: X.sys - 0.245, y: sys.y - 0.07 };
      return [
        { x: lane.x - 0.03, y: lane.y, o: 0 },   // 00 — arriving: a short slide in, from inside the stage
        lane,                               // 00 landed / 01 start
        queue,                              // 01 — at the one door
        queue,                              // 02 — read (tagged)
        queue,                              // 03 — looked up
        m.reply ? back : queue,            // 04 — answered, back in its lane
        m.reply ? back : hand,             // 05 — the hand-over travels
      ];
    });
  }
  let POS = placeAll();

  function measure() {
    W = view.clientWidth; H = view.clientHeight;
    if (!W || !H) return;
    net.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    while (net.firstChild) net.removeChild(net.firstChild);
    const NS = 'http://www.w3.org/2000/svg';
    const path = (d, cls) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d); p.setAttribute('class', cls); p.setAttribute('pathLength', '1');
      net.appendChild(p); return p;
    };
    const hx = px(X.hub), hy = py(0.5);
    /* lanes into the door */
    CHANNELS.forEach((c) => {
      const x0 = px(X.lane + X.laneW), y0 = py(c.y);
      path('M' + x0 + ' ' + y0 + 'C' + px(X.hub - 0.14) + ' ' + y0 + ' ' + px(X.hub - 0.14) + ' ' + hy + ' ' + (hx - px(0.075)) + ' ' + hy, 'swb__in');
    });
    /* the hub out to each system, and back */
    SYSTEMS.forEach((s) => {
      const x1 = px(X.sys), y1 = py(s.y);
      path('M' + (hx + px(0.075)) + ' ' + hy + 'C' + px(X.sys - 0.12) + ' ' + hy + ' ' + px(X.sys - 0.1) + ' ' + y1 + ' ' + x1 + ' ' + y1, 'swb__out swb__out--' + s.k);
    });
    POS = placeAll();
    msgs.forEach((m) => { m.tf = ''; });
    packets.forEach((k) => { k.tf = ''; });
    lastT = -1;
  }

  /* ── one frame ──────────────────────────────────────────────────── */
  let shown = -1, lastT = -1;
  function beat(i) {
    if (i === shown) return;
    shown = i;
    swapText(stepEl, BEATS[i][0]);
    swapText(noteEl, BEATS[i][1]);
    rows.forEach((r, k) => r.classList.toggle('is-on', k === i));
    rig.dataset.act = String(i);
  }
  const rev = (T, t0, dur) => clamp01((T - t0) / dur);
  const q = (v) => Math.round(v * 100) / 100;
  const route = (k, t) => {
    /* hub → system k and back: a quadratic-ish curve, mirrored */
    const s = SYSTEMS[k];
    const ax = X.hub + 0.075, ay = 0.5, bx = X.sys, by = s.y;
    const u = t < 0.5 ? t * 2 : 2 - t * 2;            // out, then back
    const e = smooth(u);
    return { x: ax + (bx - ax) * e, y: ay + (by - ay) * e };
  };

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);
    const u = clamp01((p - RUN_A) / (RUN_B - RUN_A));
    const T = u * N;
    const k = Math.min(N - 1, Math.floor(T));
    beat(k);
    if (Math.abs(T - lastT) < 0.0005 || !W) return;
    lastT = T;

    /* the structure: lanes, the door, the systems */
    rig.style.setProperty('--lanes', q(smooth(rev(T, 0.0, 0.5))));
    rig.style.setProperty('--door', q(smooth(rev(T, 1.05, 0.55))));
    rig.style.setProperty('--sys', q(smooth(rev(T, 2.9, 0.4))));
    rig.style.setProperty('--hand', q(smooth(rev(T, 5.05, 0.5))));
    const nodeOn = (el, on) => { if (el && el.__on !== on) { el.__on = on; el.classList.toggle('is-on', on); } };
    nodeOn(nodes.read, T >= 2.0 && T < 3.0);
    nodeOn(nodes.look, T >= 3.0 && T < 4.0);
    nodeOn(nodes.ans, T >= 4.0 && T < 5.0);
    nodeOn(nodes.hand, T >= 5.0);

    /* each message: where it is on the station line */
    msgs.forEach((m, i) => {
      const s = Math.floor(T), f = T - s;
      /* travel in the second half of a station, staggered per message */
      const lag = (i * 0.07) % 0.3;
      let a, b, t;
      if (s >= N) { a = POS[i][N]; b = a; t = 1; }
      else if (s === 0) {
        /* arriving: each lands in turn across the first station */
        a = POS[i][0]; b = POS[i][1]; t = smoother(rev(T, 0.08 + i * 0.12, 0.3));
      } else {
        a = POS[i][s]; b = POS[i][s + 1];
        t = smoother(rev(f, 0.52 + lag, 0.36));
      }
      const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      const o = a.o === 0 ? t : 1;
      const tf = 'translate3d(' + px(x).toFixed(1) + 'px,' + py(y).toFixed(1) + 'px,0)';
      if (tf !== m.tf) { m.tf = tf; m.el.style.transform = tf; m.el.style.opacity = o.toFixed(2); }

      /* its state: unread → queued → tagged → looked up → answered / handed */
      const tagged = T >= 2.08 + i * 0.13;
      const answered = m.m.reply ? T >= 4.0 + 0.52 + lag : false;
      const handed = !m.m.reply && T >= 5.6;
      const cls = (tagged ? ' is-tagged' : '') + (answered ? ' is-answered' : '') + (handed ? ' is-handed' : '') +
                  (T >= 1 && T < 4.5 && m.m.reply ? ' is-queued' : '') + (!m.m.reply && T >= 1 ? ' is-queued' : '');
      if (cls !== m.cls) { m.cls = cls; m.el.className = m.el.className.replace(/ is-\w+/g, '') + cls; }
    });

    /* the lookups: one packet per answered message, out to its system and back */
    let pi = 0;
    MESSAGES.forEach((m, i) => {
      if (!m.reply) return;
      const k2 = packets[pi++];
      const si = SYSTEMS.findIndex((s) => s.k === m.sys);
      const t = rev(T, 3.05 + pi * 0.13, 0.36);
      let tf = 'scale(0)';
      if (t > 0 && t < 1) {
        const r = route(si, t);
        tf = 'translate3d(' + px(r.x).toFixed(1) + 'px,' + py(r.y).toFixed(1) + 'px,0) scale(' + (0.7 + 0.5 * Math.sin(Math.PI * t)).toFixed(2) + ')';
      }
      if (tf !== k2.tf) { k2.tf = tf; k2.el.style.transform = tf; }
    });
    /* a system lights while a lookup is inside it, and shows what it found */
    systems.forEach((s, si) => {
      const sys = SYSTEMS[si];
      let lit = false, found = false;
      let pj = 0;
      MESSAGES.forEach((m) => {
        if (!m.reply) return;
        pj++;
        if (m.sys !== sys.k) return;
        const t = rev(T, 3.05 + pj * 0.13, 0.36);
        if (t > 0.4 && t < 0.6) lit = true;
        if (t >= 0.5) found = true;
      });
      if (sys.k === 'person') { found = T >= 5.6; lit = T >= 5.45 && T < 5.75; }
      if (lit !== s.lit) { s.lit = lit; s.el.classList.toggle('is-lit', lit); }
      if (found !== s.on) { s.on = found; s.el.classList.toggle('is-found', found); }
    });
  }

  measure();
  let lastP = 0;
  const drawP = (p) => { lastP = p; draw(p); };
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { measure(); draw(lastP); }).observe(view);

  if (REDUCED) {
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
