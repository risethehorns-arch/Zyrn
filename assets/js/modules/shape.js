/* ══════════════════════════════════════════════════════════════════════
   THE SHAPE   (all five service pages — "Shape it to your firm")

   Owner-requested, 2026-09-01: "each of those 5 services … the user can
   choose or drag … and the service will shape itself to fit the user's
   choices." So every service page carries three real decisions — two
   rows of choices and one drag — and a diagram of the engagement that
   recomposes live around them. The closing control is a mailto whose
   subject line CARRIES the choices, which is what makes this a brief
   the reader builds rather than a toy: the thing they shaped is the
   thing they send.

   ── WHAT THE ANSWERS CHANGE ─────────────────────────────────────────
   The diagram (an SVG of the engagement's actual mechanics), a counted
   manifest (three mono rows derived from the same state the diagram
   draws — never typed separately, so they cannot disagree), and the
   request subject. Nothing here invents a promise: no prices, no weeks,
   no fabricated outcomes — the answers reshape WHAT WE WOULD BUILD,
   which is the firm's own offer to describe.

   ── MECHANICS ───────────────────────────────────────────────────────
   One module, five authored configurations, injected into a
   `.shape[data-shape]` placeholder. Chips are real radiogroups (roving
   tabindex, arrow keys); the drag is a real slider (pointer capture,
   live snap while dragging, arrows/Home/End). Every recomposition is
   click-time paint: paths draw in with the dash trick, and ONE lit
   point — the same light the buttons and the lattice wear — glides by
   transitioned transform to whatever the last answer reshaped. The
   reader's light follows the reader's hand.
   ══════════════════════════════════════════════════════════════════════ */

import { swapText } from './_track.js';

const NS = 'http://www.w3.org/2000/svg';
const MAIL = 'info@zyrn.org';

/* ── tiny drawing helpers ──────────────────────────────────────────── */
const bx = (x, y, w, h) => 'M' + x + ' ' + y + 'H' + (x + w) + 'V' + (y + h) + 'H' + x + 'Z';
const ln = (x1, y1, x2, y2) => 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2;
function rows3(x, y, w, gap, n) {
  let d = '';
  for (let i = 0; i < n; i++) d += ln(x, y + i * gap, x + w, y + i * gap);
  return d;
}
const P = (d, cls) => ({ k: 'p', d, cls: cls || '' });
const G = (d) => ({ k: 'g', d });
const T = (x, y, s, cls) => ({ k: 't', x, y, s, cls: cls || '' });
const D = (x, y, key) => ({ k: 'd', x, y, key });

/* ══════════════════════════════════════════════════════════════════════
   THE FIVE CONFIGURATIONS — every option, sentence and diagram authored
   ══════════════════════════════════════════════════════════════════════ */
const CFG = {

  /* ── WEBSITE ─────────────────────────────────────────────────────── */
  web: {
    service: 'WEBSITE',
    q: [
      { k: 'job', label: 'THE JOB OF THE SITE', type: 'chips', def: 0, opts: [
        { v: 'CONVINCE', t: 'Convince',
          h: 'A case to close: proof up front, one ask.' },
        { v: 'EXPLAIN', t: 'Explain',
          h: 'A system to document: structure a reader can hold.' },
        { v: 'SELL', t: 'Sell',
          h: 'A catalogue to move: find, compare, act.' },
      ]},
      { k: 'motion', label: 'HOW IT MOVES', type: 'slider', def: 1, opts: [
        { v: 'STILL', t: 'Still' },
        { v: 'MEASURED', t: 'Measured' },
        { v: 'IMMERSIVE', t: 'Immersive' },
      ]},
      { k: 'start', label: 'WHERE IT STARTS', type: 'chips', def: 0, opts: [
        { v: 'FROM NOTHING', t: 'From nothing',
          h: 'Brand and site are decided together.' },
        { v: 'FROM A KIT', t: 'From a kit',
          h: 'Your tokens exist; the site reads them.' },
        { v: 'FROM A LIVE SITE', t: 'From a live site',
          h: 'What works is measured before it is replaced.' },
      ]},
    ],
    fig(s) {
      const o = [];
      /* the page frame is always the subject */
      o.push(G(bx(160, 28, 250, 344)));
      let lit = [385, 331];
      if (s.job === 0) {
        o.push(P(bx(180, 48, 210, 112)));                       // hero
        o.push(P(ln(196, 84, 340, 84) + ln(196, 104, 300, 104), 'sh__thin'));
        for (let i = 0; i < 3; i++) o.push(P(bx(180, 182, 210, 30).replace(/182/g, String(182 + i * 44))));
        o.push(P(bx(180, 318, 210, 28), 'sh__strong'));         // the ask
        o.push(T(285, 336, 'REQUEST', 'sh__tc'));
        lit = [385, 332];
      } else if (s.job === 1) {
        o.push(P(bx(180, 48, 58, 298)));                        // doc rail
        o.push(P(rows3(190, 72, 38, 22, 6), 'sh__thin'));
        for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++)
          o.push(P(bx(254, 48 + r * 104, 66, 88).replace('254', String(254 + c * 82))));
        lit = [209, 60];
      } else {
        o.push(P(bx(180, 48, 210, 22)));                        // filter bar
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
          o.push(P(bx(180 + c * 74, 86 + r * 74, 62, 60)));
        o.push(P(ln(376, 59, 384, 59), 'sh__strong'));
        lit = [389, 59];
      }
      /* motion: what the scroll is allowed to do */
      if (s.motion >= 1) {
        o.push(P('M436 96 V150 M430 142 L436 150 L442 142'));
        o.push(T(436, 82, 'REVEALS', 'sh__tc'));
      }
      if (s.motion === 2) {
        o.push(P(ln(436, 190, 436, 330), 'sh__strong'));
        for (let i = 0; i < 3; i++) o.push(P(bx(431, 208 + i * 40, 10, 10)));
        o.push(T(436, 356, 'PINNED TRACKS', 'sh__tc'));
      }
      if (s.last === 'motion') lit = s.motion === 0 ? [285, 372] : [436, s.motion === 2 ? 260 : 123];
      /* where it starts: the input at the left edge */
      const sy = 178;
      if (s.start === 0) { o.push(P(bx(52, sy, 66, 44), 'sh__dash')); o.push(T(85, sy + 62, 'BLANK', 'sh__tc')); }
      if (s.start === 1) {
        o.push(P(bx(52, sy, 66, 44)));
        for (let i = 0; i < 4; i++) o.push(P(bx(62 + i * 12, sy + 30, 6, 6)));
        o.push(P(ln(62, sy + 14, 108, sy + 14), 'sh__thin'));
        o.push(T(85, sy + 62, 'YOUR KIT', 'sh__tc'));
      }
      if (s.start === 2) {
        o.push(P(bx(52, sy, 66, 44)));
        o.push(P(rows3(60, sy + 12, 50, 10, 3), 'sh__thin'));
        o.push(T(85, sy + 62, 'LIVE SITE', 'sh__tc'));
      }
      o.push(P('M124 200 H152 M146 194 L154 200 L146 206'));
      if (s.last === 'start') lit = [85, sy + 22];
      if (s.last === 'job' || !s.last) lit = s.job === 0 ? [385, 332] : s.job === 1 ? [209, 60] : [389, 59];
      return { o, lit };
    },
    man(s) {
      return [
        ['STRUCTURE', ['HERO · PROOF · ONE ASK', 'RAIL · 06 DOCS · GRID', 'FILTER · 09 CARDS'][s.job]],
        ['MOTION SPEC', ['NONE — THE PAGE HOLDS STILL', 'REVEALS ONLY', 'REVEALS + PINNED TRACKS'][s.motion]],
        ['FIRST ARTIFACT', ['STRUCTURE MAP', 'TOKEN AUDIT', 'MEASURED BASELINE'][s.start]],
      ];
    },
  },

  /* ── BRAND KIT ───────────────────────────────────────────────────── */
  kit: {
    service: 'BRAND KIT',
    q: [
      { k: 'exists', label: 'WHAT EXISTS TODAY', type: 'chips', def: 0, opts: [
        { v: 'NOTHING YET', t: 'Nothing yet', h: 'The mark is constructed, not found.' },
        { v: 'A MARK WE KEEP', t: 'A mark we keep', h: 'The system is built around it.' },
        { v: 'A HISTORY', t: 'A history', h: 'What earned trust stays; the rest is retired.' },
      ]},
      { k: 'voice', label: 'HOW IT SPEAKS', type: 'slider', def: 1, opts: [
        { v: 'RESERVED', t: 'Reserved' },
        { v: 'DIRECT', t: 'Direct' },
        { v: 'BLUNT', t: 'Blunt' },
      ]},
      { k: 'media', label: 'WHERE IT MUST LIVE', type: 'chips', def: 1, opts: [
        { v: 'PRINT FIRST', t: 'Print first', h: 'Ink, paper sizes, one-colour falls.' },
        { v: 'SCREEN FIRST', t: 'Screen first', h: 'Dark grounds, motion, pixel hinting.' },
        { v: 'BOTH', t: 'Both', h: 'Every asset ships in both disciplines.' },
      ]},
    ],
    fig(s) {
      const o = [];
      /* the kit sheet: six cells */
      o.push(G(bx(40, 34, 480, 332) + ln(200, 34, 200, 366) + ln(360, 34, 360, 366) + ln(40, 200, 520, 200)));
      const cells = [['MARK', 46], ['PALETTE', 206], ['TYPE', 366], ['VOICE', 46], ['MOTION', 206], ['USAGE', 366]];
      cells.forEach((c, i) => o.push(T(c[1] + 8, i < 3 ? 52 : 218, c[0], 'sh__tl')));
      let lit = [120, 118];
      /* MARK cell */
      if (s.exists === 0) {
        o.push(P(ln(70, 80, 170, 180) + ln(170, 80, 70, 180), 'sh__dash'));
        o.push(P(bx(95, 105, 50, 50)));
      } else if (s.exists === 1) {
        o.push(P(bx(95, 105, 50, 50), 'sh__strong'));
        o.push(T(120, 174, 'KEPT', 'sh__tc'));
      } else {
        o.push(P(bx(101, 111, 50, 50), 'sh__strong'));
        o.push(P(bx(89, 99, 50, 50), 'sh__dash'));
        o.push(T(120, 178, 'CARRIED FORWARD', 'sh__tc'));
      }
      /* PALETTE: five tokens, always five */
      for (let i = 0; i < 5; i++) o.push(P(bx(216 + i * 26, 112, 14, 14)));
      o.push(T(280, 148, '05 TOKENS · NAMED', 'sh__tc'));
      /* TYPE: the scale */
      o.push(T(400, 130, 'Aa', 'sh__big'));
      o.push(P(ln(444, 92, 444, 138) + ln(440, 92, 448, 92) + ln(440, 115, 448, 115) + ln(440, 138, 448, 138), 'sh__thin'));
      /* VOICE: the measure of a sentence */
      const vw = [[120, 96, 72], [104, 64, 0], [72, 0, 0]][s.voice];
      vw.forEach((wd, i) => { if (wd) o.push(P(ln(64, 250 + i * 20, 64 + wd, 250 + i * 20), i === 0 ? 'sh__strong' : '')); });
      o.push(T(120, 320, ['EVERY CLAIM QUALIFIED', 'SHORT · PROVABLE', 'ONE CLAIM, COUNTED'][s.voice], 'sh__tc'));
      if (s.last === 'voice') lit = [64 + vw[0], 250];
      /* MOTION: one curve, always */
      o.push(P('M220 320 C250 320 260 254 290 250 C315 247 330 246 344 246'));
      /* USAGE */
      if (s.media === 0 || s.media === 2) { o.push(P(bx(392, 232, 44, 60))); o.push(T(414, 308, 'A4', 'sh__tc')); }
      if (s.media === 1 || s.media === 2) { o.push(P(bx(s.media === 2 ? 448 : 408, 240, 64, 40))); o.push(T(s.media === 2 ? 480 : 440, 296, '16:9', 'sh__tc')); }
      if (s.last === 'media') lit = [s.media === 0 ? 414 : 470, 252];
      if (s.last === 'exists' || !s.last) lit = [[120, 118], [120, 130], [113, 124]][s.exists];
      return { o, lit };
    },
    man(s) {
      return [
        ['THE MARK', ['CONSTRUCTED NEW', 'YOURS, KEPT', 'YOURS, RE-CUT'][s.exists]],
        ['VOICE RULE', ['NO SUPERLATIVES', 'NO SUPERLATIVES · SHORT FORMS', 'COUNTED CLAIMS ONLY'][s.voice]],
        ['SHIPS AS', ['PRINT MASTERS + SCREEN FALLS', 'SCREEN MASTERS + PRINT FALLS', 'DUAL MASTERS'][s.media]],
      ];
    },
  },

  /* ── BUSINESS STRUCTURING ────────────────────────────────────────── */
  org: {
    service: 'STRUCTURING',
    q: [
      { k: 'pain', label: 'WHAT HURTS MOST', type: 'chips', def: 0, opts: [
        { v: 'SLOW DECISIONS', t: 'Slow decisions', h: 'Answers cross four desks to come back.' },
        { v: 'UNCLEAR OWNERS', t: 'Unclear owners', h: 'Two names on everything; nobody on it.' },
        { v: 'TWO PEOPLE CARRY IT', t: 'Two people carry it', h: 'The org chart is not where the load is.' },
      ]},
      { k: 'depth', label: 'HOW DEEP WE MAY CUT', type: 'slider', def: 1, opts: [
        { v: 'ADVISE', t: 'Advise' },
        { v: 'REDRAW', t: 'Redraw' },
        { v: 'REBUILD', t: 'Rebuild' },
      ]},
      { k: 'size', label: 'THE FIRM', type: 'chips', def: 1, opts: [
        { v: 'UNDER 20', t: 'Under 20', h: 'Structure is habits; we write them down first.' },
        { v: '20 TO 100', t: '20–100', h: 'The size where the founder stops seeing everything.' },
        { v: 'OVER 100', t: 'Over 100', h: 'The structure IS the product now.' },
      ]},
    ],
    fig(s) {
      const o = [];
      o.push(G(ln(60, 96, 470, 96) + ln(60, 196, 470, 196) + ln(60, 296, 470, 296)));
      o.push(T(48, 92, 'T1', 'sh__tl')); o.push(T(48, 192, 'T2', 'sh__tl')); o.push(T(48, 292, 'T3', 'sh__tl'));
      /* the chart at three sizes: 1 / n2 / n3 per tier */
      const plan = [[1, 2, 4], [1, 3, 6], [1, 4, 8]][s.size];
      const pts = [[], [], []];
      for (let t = 0; t < 3; t++) {
        const n = plan[t], y = 96 + t * 100;
        for (let i = 0; i < n; i++) {
          const x = 265 + (i - (n - 1) / 2) * (t === 2 ? 46 : 84);
          pts[t].push([x, y]);
          o.push(D(x, y, 'n' + t + '-' + i));
        }
      }
      for (let t = 0; t < 2; t++) pts[t].forEach((a) => pts[t + 1].forEach((b) => {
        if (Math.abs(a[0] - b[0]) < 130) o.push(P(ln(a[0], a[1], b[0], b[1]), 'sh__thin'));
      }));
      let lit = [265, 96];
      /* the pain, drawn where it lives */
      if (s.pain === 0) {
        const a = pts[2][0], b = pts[1][0], c = pts[0][0], d = pts[1][pts[1].length - 1];
        o.push(P(ln(a[0], a[1], b[0], b[1]) + ln(b[0], b[1], c[0], c[1]) + ln(c[0], c[1], d[0], d[1]), 'sh__strong'));
        o.push(T(c[0], 66, '04 HOPS TO AN ANSWER', 'sh__tc'));
        lit = [c[0], c[1]];
      } else if (s.pain === 1) {
        const m = pts[1][Math.floor(pts[1].length / 2)];
        o.push(P(bx(m[0] - 14, m[1] - 14, 28, 28), 'sh__dash'));
        o.push(T(m[0], m[1] - 24, 'OWNER?', 'sh__tc'));
        lit = [m[0], m[1]];
      } else {
        const a = pts[1][0], b2 = pts[2][1];
        [a, b2].forEach((n2) => { for (let i = 0; i < 3; i++) o.push(P(ln(n2[0] + 12, n2[1] - 4 - i * 5, n2[0] + 12 + 18 - i * 5, n2[1] - 4 - i * 5), 'sh__strong')); });
        o.push(T(a[0], a[1] - 26, 'THE LOAD', 'sh__tc'));
        lit = [a[0], a[1]];
      }
      /* how deep the mandate goes */
      if (s.depth === 0) {
        o.push(P(ln(492, 96, 492, 296) + ln(486, 96, 492, 96) + ln(486, 296, 492, 296), 'sh__dash'));
        o.push(T(492, 320, 'OBSERVED · RECOMMENDED', 'sh__tc'));
        if (s.last === 'depth') lit = [492, 196];
      } else {
        const cy = s.depth === 1 ? 146 : 62;
        o.push(P(ln(70, cy, 490, cy), 'sh__dash'));
        o.push(T(280, cy - 12, s.depth === 1 ? 'REDRAWN BELOW THIS LINE' : 'EVERYTHING ON THE TABLE', 'sh__tc'));
        if (s.last === 'depth') lit = [80, cy];
      }
      if (s.last === 'size') lit = pts[2][pts[2].length - 1];
      return { o, lit };
    },
    man(s) {
      const nodes = [7, 10, 13][s.size];
      return [
        ['FIRST MAP', ['THE DECISION TRAIL', 'DECISION RIGHTS, PER DECISION', 'THE LOAD, MEASURED'][s.pain]],
        ['MANDATE', ['ADVISORY — YOU CUT', 'MID STRUCTURE REDRAWN', 'FULL REDESIGN'][s.depth]],
        ['CHART AS DRAWN', String(nodes).padStart(2, '0') + ' ROLES · 03 TIERS'],
      ];
    },
  },

  /* ── AI TRANSFORMATION ───────────────────────────────────────────── */
  ai: {
    service: 'AI',
    q: [
      { k: 'where', label: 'WHERE IT LANDS FIRST', type: 'chips', def: 1, opts: [
        { v: 'CLIENT-FACING', t: 'Client-facing', h: 'Highest stakes; tightest gate.' },
        { v: 'BACK OFFICE', t: 'Back office', h: 'Where most firms should actually start.' },
        { v: 'THE PRODUCT', t: 'The product', h: 'The system becomes what you sell.' },
      ]},
      { k: 'auto', label: 'WHAT IT MAY DO ALONE', type: 'slider', def: 0, opts: [
        { v: 'DRAFTS ONLY', t: 'Drafts only' },
        { v: 'ACTS, HUMAN SIGNS', t: 'Acts, human signs' },
        { v: 'ACTS WITHIN RULES', t: 'Acts within rules' },
      ]},
      { k: 'data', label: 'YOUR DATA TODAY', type: 'chips', def: 0, opts: [
        { v: 'SCATTERED', t: 'Scattered', h: 'The pipeline is built before the pilot.' },
        { v: 'ONE SYSTEM', t: 'One system', h: 'Trust is audited, then used.' },
        { v: 'CLEAN AND OWNED', t: 'Clean and owned', h: 'Rare. The pilot starts at the work.' },
      ]},
    ],
    fig(s) {
      const o = [];
      /* the lane */
      o.push(G(ln(40, 176, 520, 176)));
      o.push(P(bx(56, 152, 74, 48))); o.push(T(93, 220, 'INTAKE', 'sh__tc'));
      o.push(P(bx(432, 152, 74, 48))); o.push(T(469, 220, 'OUT', 'sh__tc'));
      /* the system, placed where it lands */
      const ax = [180, 262, 344][s.where];
      o.push(P('M' + ax + ' 156 L' + (ax + 20) + ' 176 L' + ax + ' 196 L' + (ax - 20) + ' 176 Z', 'sh__strong'));
      o.push(T(ax, 140, 'THE SYSTEM', 'sh__tc'));
      let lit = [ax, 176];
      /* the gate it must pass */
      const gx = ax + 52, gap = [7, 18, 30][s.auto];
      o.push(P(ln(gx, 176 - 26, gx, 176 - gap) + ln(gx, 176 + gap, gx, 176 + 26), 'sh__strong'));
      o.push(T(gx, 234, ['DRAFTS ONLY', 'HUMAN SIGNS', 'RULES SIGN'][s.auto], 'sh__tc'));
      if (s.auto < 2) o.push(P('M' + (gx + 14) + ' 156 l5 6 l9 -12', 'sh__thin'));
      if (s.last === 'auto') lit = [gx, 176];
      /* what feeds it */
      const dy = 306;
      if (s.data === 0) {
        for (let i = 0; i < 9; i++) o.push(P(bx(96 + (i % 5) * 26 + (i > 4 ? 13 : 0), dy - 12 + Math.floor(i / 5) * 20, 7, 7)));
        o.push(P(ln(230, dy, 262, dy) + ln(262, dy, 262, 208), 'sh__dash'));
        o.push(T(160, dy + 42, 'GATHERED FIRST', 'sh__tc'));
        if (s.last === 'data') lit = [160, dy];
      } else if (s.data === 1) {
        o.push(P(bx(130, dy - 22, 60, 44)));
        o.push(P(rows3(140, dy - 10, 40, 11, 3), 'sh__thin'));
        o.push(P(ln(190, dy, 262, dy) + ln(262, dy, 262, 208), 'sh__thin'));
        o.push(T(160, dy + 42, 'AUDITED, THEN USED', 'sh__tc'));
        if (s.last === 'data') lit = [160, dy];
      } else {
        for (let i = 0; i < 3; i++) o.push(P(bx(130, dy - 22 + i * 16, 60, 10)));
        o.push(P(ln(190, dy, 262, dy) + ln(262, dy, 262, 208), 'sh__thin'));
        o.push(T(160, dy + 42, 'READY', 'sh__tc'));
        if (s.last === 'data') lit = [160, dy];
      }
      if (s.last === 'where' || !s.last) lit = [ax, 176];
      return { o, lit };
    },
    man(s) {
      return [
        ['PILOT LANE', ['ONE CLIENT-FACING FLOW', 'ONE BACK-OFFICE FLOW', 'ONE PRODUCT FLOW'][s.where]],
        ['AUTHORITY', ['NOTHING SHIPS UNSIGNED', 'ACTS · EVERY ACT SIGNED', 'ACTS · ESCALATES BY RULE'][s.auto]],
        ['BEFORE THE PILOT', ['THE DATA PIPELINE', 'THE TRUST AUDIT', 'NOTHING — IT STARTS'][s.data]],
      ];
    },
  },

  /* ── CRM ─────────────────────────────────────────────────────────── */
  desk: {
    service: 'CRM',
    q: [
      { k: 'trade', label: 'WHAT THE DESK TRADES', type: 'chips', def: 0, opts: [
        { v: 'PROPERTY', t: 'Property', h: 'Listings, viewings, deals — the running system.' },
        { v: 'CLIENT WORK', t: 'Client work', h: 'Matters, tasks, invoices.' },
        { v: 'GOODS', t: 'Goods', h: 'Stock, orders, shipments.' },
      ]},
      { k: 'source', label: 'WHERE TRUTH LIVES TODAY', type: 'chips', def: 0, opts: [
        { v: 'A SPREADSHEET', t: 'A spreadsheet', h: 'It keeps feeding the system — one way.' },
        { v: 'ANOTHER SYSTEM', t: 'Another system', h: 'Exported once, reconciled, retired.' },
        { v: 'ON PAPER', t: 'On paper', h: 'Captured once, by us, during the build.' },
      ]},
      { k: 'team', label: 'WHO WORKS IN IT', type: 'slider', def: 1, opts: [
        { v: 'ONE DESK', t: 'One desk' },
        { v: 'A FEW SEATS', t: 'A few seats' },
        { v: 'TEAMS AND ROLES', t: 'Teams & roles' },
      ]},
    ],
    fig(s) {
      const o = [];
      const OBJ = [
        ['LISTING', 'CLIENT', 'VIEWING', 'DEAL', 'DOCUMENT'],
        ['CLIENT', 'MATTER', 'TASK', 'INVOICE', 'DOCUMENT'],
        ['ITEM', 'SUPPLIER', 'ORDER', 'SHIPMENT', 'INVOICE'],
      ][s.trade];
      const cx = 300, cy = 192, r = 86;
      const pts = OBJ.map((t, i) => {
        const a = (-90 + i * 72) * Math.PI / 180;
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92];
      });
      let ring = '';
      pts.forEach((p2, i) => { const q = pts[(i + 1) % 5]; ring += ln(p2[0], p2[1], q[0], q[1]); });
      o.push(P(ring, 'sh__thin'));
      pts.forEach((p2, i) => {
        o.push(D(p2[0], p2[1], 'o' + i));
        const lx = cx + (p2[0] - cx) * 1.42, ly2 = cy + (p2[1] - cy) * 1.36;
        o.push(T(lx, ly2 + 4, OBJ[i], 'sh__tc'));
      });
      o.push(T(cx, cy + 4, 'YOUR SCHEMA', 'sh__tl'));
      let lit = [pts[0][0], pts[0][1]];
      /* where truth lives, feeding it one way */
      const sy2 = 192;
      if (s.source === 0) { o.push(P(bx(56, sy2 - 26, 64, 52) + rows3(64, sy2 - 12, 48, 13, 3), 'sh__thin')); o.push(T(88, sy2 + 44, 'THE SHEET', 'sh__tc')); }
      if (s.source === 1) { o.push(P(bx(56, sy2 - 26, 64, 52))); o.push(P(rows3(66, sy2 - 12, 44, 12, 2), 'sh__thin')); o.push(T(88, sy2 + 44, 'THE OLD SYSTEM', 'sh__tc')); }
      if (s.source === 2) { o.push(P(bx(60, sy2 - 28, 48, 56) + ln(94, sy2 - 28, 108, sy2 - 14) , 'sh__thin')); o.push(T(88, sy2 + 44, 'PAPER, CAPTURED', 'sh__tc')); }
      o.push(P(ln(124, sy2, 196, sy2) + 'M188 ' + (sy2 - 6) + ' L198 ' + sy2 + ' L188 ' + (sy2 + 6)));
      o.push(T(160, sy2 - 14, 'ONE-WAY', 'sh__tc'));
      if (s.last === 'source') lit = [88, sy2];
      /* who works in it */
      const tx = 492;
      if (s.team === 0) { o.push(D(tx, 180, 't0')); o.push(T(tx, 216, '01 SEAT', 'sh__tc')); }
      else if (s.team === 1) {
        for (let i = 0; i < 3; i++) o.push(D(tx - 18 + i * 18, 180, 't' + i));
        o.push(T(tx, 216, '03 SEATS', 'sh__tc'));
      } else {
        for (let i = 0; i < 6; i++) o.push(D(tx - 18 + (i % 3) * 18, 170 + Math.floor(i / 3) * 20, 't' + i));
        o.push(P(bx(tx - 26, 160, 52, 40), 'sh__dash'));
        o.push(T(tx, 226, 'ROLES ENFORCED', 'sh__tc'));
      }
      o.push(P(ln(cx + r + 22, 192, tx - 34, 186), 'sh__thin'));
      if (s.last === 'team') lit = [tx, 182];
      if (s.last === 'trade' || !s.last) lit = [pts[s.trade][0], pts[s.trade][1]];
      return { o, lit };
    },
    man(s) {
      return [
        ['OBJECTS', ['LISTINGS · VIEWINGS · DEALS', 'MATTERS · TASKS · INVOICES', 'ORDERS · STOCK · SHIPMENTS'][s.trade]],
        ['THE FEED', ['ONE-WAY FROM THE SHEET', 'MIGRATED ONCE, RECONCILED', 'CAPTURED DURING BUILD'][s.source]],
        ['ACCESS', ['ONE DESK · FULL VIEW', 'SEATS · SHARED VIEW', 'ROLES · ENFORCED AT THE DATA'][s.team]],
      ];
    },
  },
};

/* ══════════════════════════════════════════════════════════════════════
   THE MACHINERY
   ══════════════════════════════════════════════════════════════════════ */

export function initShape() {
  const host = document.querySelector('.shape[data-shape]');
  if (!host) return;
  const cfg = CFG[host.dataset.shape];
  if (!cfg) return;

  const state = { last: null };
  cfg.q.forEach((q) => { state[q.k] = q.def; });
  const get = (q) => state[q.k];

  /* ── build the two columns ──────────────────────────────────────── */
  const qcol = document.createElement('div');
  qcol.className = 'shape__qs';
  const out = document.createElement('div');
  out.className = 'shape__out';
  host.appendChild(qcol); host.appendChild(out);

  /* the figure */
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'shape__fig');
  svg.setAttribute('viewBox', '0 0 560 400');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('aria-hidden', 'true');
  const gOld = document.createElementNS(NS, 'g');
  const gNew = document.createElementNS(NS, 'g');
  const gDots = document.createElementNS(NS, 'g');
  svg.appendChild(gOld); svg.appendChild(gNew); svg.appendChild(gDots);
  out.appendChild(svg);

  /* the manifest — derived from the same state the figure draws */
  const man = document.createElement('div');
  man.className = 'shape__man';
  const manVals = [];
  cfg.man(state).forEach((row) => {
    const r = document.createElement('div');
    r.className = 'shape__mr';
    const k = document.createElement('span'); k.className = 'mono shape__mk'; k.textContent = row[0];
    const v = document.createElement('span'); v.className = 'mono shape__mv'; v.textContent = row[1];
    r.appendChild(k); r.appendChild(v); man.appendChild(r);
    manVals.push(v);
  });
  out.appendChild(man);

  /* the request that carries the choices */
  const cta = document.createElement('a');
  cta.className = 'btn btn--hairline shape__cta';
  cta.textContent = 'Request exactly this';
  out.appendChild(cta);
  const note = document.createElement('p');
  note.className = 'mono shape__ctan';
  note.textContent = 'THE SUBJECT LINE CARRIES YOUR THREE ANSWERS.';
  out.appendChild(note);

  function subject() {
    const parts = cfg.q.map((q) => q.opts[get(q)].v);
    return 'ZYRN · ' + cfg.service + ' — ' + parts.join(' · ');
  }

  /* ── render ─────────────────────────────────────────────────────── */
  const dots = new Map();          // key -> circle element (they glide)

  function render(first) {
    const fig = cfg.fig(state);

    /* previous strokes step back, then leave */
    while (gOld.firstChild) gOld.removeChild(gOld.firstChild);
    while (gNew.firstChild) { gOld.appendChild(gNew.firstChild); }
    gOld.setAttribute('class', 'sh__out');
    const dying = gOld;
    setTimeout(() => { while (dying.firstChild) dying.removeChild(dying.firstChild); dying.removeAttribute('class'); }, 300);

    const seen = new Set(['lit']);
    let pi = 0;
    fig.o.forEach((el) => {
      if (el.k === 'p' || el.k === 'g') {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', el.d);
        p.setAttribute('class', el.k === 'g' ? 'sh__ghost' : 'sh__p ' + el.cls);
        if (el.k === 'p') {
          p.setAttribute('pathLength', '1');
          p.style.transitionDelay = (pi++ * 26) + 'ms';
        }
        gNew.appendChild(p);
      } else if (el.k === 't') {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', el.x); t.setAttribute('y', el.y);
        t.setAttribute('class', 'sh__t ' + el.cls);
        t.textContent = el.s;
        gNew.appendChild(t);
      } else if (el.k === 'd') {
        seen.add(el.key);
        let c = dots.get(el.key);
        if (!c) {
          c = document.createElementNS(NS, 'circle');
          c.setAttribute('r', 4);
          c.setAttribute('class', 'sh__d');
          c.style.transform = 'translate(' + el.x + 'px,' + el.y + 'px)';
          gDots.appendChild(c);
          dots.set(el.key, c);
        } else {
          c.style.transform = 'translate(' + el.x + 'px,' + el.y + 'px)';
        }
      }
    });
    /* dots that left the composition */
    dots.forEach((c, key) => {
      if (!seen.has(key)) { c.remove(); dots.delete(key); }
    });
    /* THE LIT POINT — one, and it follows the reader's last answer */
    let litEl = dots.get('lit');
    if (!litEl) {
      litEl = document.createElementNS(NS, 'circle');
      litEl.setAttribute('r', 4.6);
      litEl.setAttribute('class', 'sh__lit');
      litEl.style.transform = 'translate(' + fig.lit[0] + 'px,' + fig.lit[1] + 'px)';
      gDots.appendChild(litEl);
      dots.set('lit', litEl);
    } else {
      litEl.style.transform = 'translate(' + fig.lit[0] + 'px,' + fig.lit[1] + 'px)';
    }

    /* two frames so the dash draw-in actually transitions */
    gNew.removeAttribute('class');
    requestAnimationFrame(() => requestAnimationFrame(() => gNew.setAttribute('class', 'is-in')));

    /* the manifest and the request, from the same state */
    cfg.man(state).forEach((row, i) => {
      if (manVals[i].textContent !== row[1]) {
        if (first) manVals[i].textContent = row[1];
        else swapText(manVals[i], row[1]);
      }
    });
    cta.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject());
  }

  /* ── the questions ──────────────────────────────────────────────── */
  function set(q, idx) {
    if (state[q.k] === idx) return;
    state[q.k] = idx;
    state.last = q.k;
    render(false);
  }

  cfg.q.forEach((q) => {
    const row = document.createElement('div');
    row.className = 'shape__q';
    const lb = document.createElement('span');
    lb.className = 'mono shape__ql';
    lb.textContent = q.label;
    row.appendChild(lb);

    if (q.type === 'chips') {
      const grp = document.createElement('div');
      grp.className = 'shape__chips';
      grp.setAttribute('role', 'radiogroup');
      grp.setAttribute('aria-label', q.label.toLowerCase());
      const chips = q.opts.map((opt, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'shape__chip';
        b.setAttribute('role', 'radio');
        b.innerHTML = '<span class="shape__cht">' + opt.t + '</span>' +
                      '<span class="shape__chh">' + opt.h + '</span>';
        b.addEventListener('click', () => { set(q, i); paint(); chips[i].focus(); });
        grp.appendChild(b);
        return b;
      });
      function paint() {
        chips.forEach((b, i) => {
          const on = get(q) === i;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-checked', String(on));
          b.tabIndex = on ? 0 : -1;
        });
      }
      grp.addEventListener('keydown', (e) => {
        let d = 0;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') d = 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') d = -1;
        else return;
        e.preventDefault();
        const n = (get(q) + d + q.opts.length) % q.opts.length;
        set(q, n); paint(); chips[n].focus();
      });
      paint();
      row.appendChild(grp);
    } else {
      /* THE DRAG — a real slider snapping to three stops */
      const sl = document.createElement('div');
      sl.className = 'shape__sl';
      sl.tabIndex = 0;
      sl.setAttribute('role', 'slider');
      sl.setAttribute('aria-valuemin', '0');
      sl.setAttribute('aria-valuemax', String(q.opts.length - 1));
      sl.setAttribute('aria-label', q.label.toLowerCase());
      sl.innerHTML =
        '<span class="shape__slt"></span><span class="shape__slf"></span>' +
        q.opts.map((_, i) => '<span class="shape__sls" style="left:' + (i * 50) + '%"></span>').join('') +
        '<span class="shape__slk"></span>';
      const fill = sl.querySelector('.shape__slf');
      const knob = sl.querySelector('.shape__slk');
      const lbl = document.createElement('div');
      lbl.className = 'shape__sll';
      const lspans = q.opts.map((opt, i) => {
        const sp = document.createElement('span');
        sp.className = 'mono';
        sp.textContent = opt.t;
        sp.addEventListener('click', () => { set(q, i); paint(); });
        lbl.appendChild(sp);
        return sp;
      });
      function paint() {
        const v = get(q), f = v / (q.opts.length - 1);
        knob.style.left = (f * 100) + '%';
        fill.style.transform = 'scaleX(' + f + ')';
        sl.setAttribute('aria-valuenow', String(v));
        sl.setAttribute('aria-valuetext', q.opts[v].t);
        lspans.forEach((sp, i) => sp.classList.toggle('is-on', i === v));
      }
      function fromX(clientX) {
        const r = sl.getBoundingClientRect();
        const f = Math.min(1, Math.max(0, (clientX - r.left) / Math.max(1, r.width)));
        return Math.round(f * (q.opts.length - 1));
      }
      sl.addEventListener('pointerdown', (e) => {
        sl.setPointerCapture(e.pointerId);
        sl.classList.add('is-drag');
        set(q, fromX(e.clientX)); paint();
        e.preventDefault();
      });
      sl.addEventListener('pointermove', (e) => {
        if (!sl.classList.contains('is-drag')) return;
        /* LIVE snap — the figure reshapes under the drag, not after it */
        set(q, fromX(e.clientX)); paint();
      });
      const drop = () => sl.classList.remove('is-drag');
      sl.addEventListener('pointerup', drop);
      sl.addEventListener('pointercancel', drop);
      sl.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = Math.min(q.opts.length - 1, get(q) + 1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = Math.max(0, get(q) - 1);
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = q.opts.length - 1;
        else return;
        e.preventDefault();
        set(q, n); paint();
      });
      paint();
      row.appendChild(sl);
      row.appendChild(lbl);
    }
    qcol.appendChild(row);
  });

  render(true);
}
