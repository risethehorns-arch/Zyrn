/* SYS.03 · DECISION RIGHTS ───────────────────────────────────────────
   The same eleven nodes, rewired. Scroll interpolates between two exact
   layouts: the chart as published — a tree where every decision climbs to
   the top and comes back — and authority placed where the work is, a ring
   with short local edges.

   Both layouts are authored as coordinates and lerped, rather than run
   through a force simulation. A layout that settles differently on every
   load is the wrong thing for an argument you are trying to make twice. */

import { onTrack, swapText, pad3 } from './_track.js';

const NS = 'http://www.w3.org/2000/svg';

/* id, label, [tree x,y], [ring x,y] */
const NODES = [
  ['ceo',  'CEO',  450,  46,  450, 230],
  ['coo',  'COO',  250, 140,  450,  74],
  ['cfo',  'CFO',  450, 140,  606, 118],
  ['cto',  'CTO',  650, 140,  700, 230],
  ['ops',  'OPS',  150, 250,  606, 342],
  ['sup',  'SUP',  270, 250,  450, 386],
  ['fin',  'FIN',  390, 250,  294, 342],
  ['rsk',  'RSK',  510, 250,  200, 230],
  ['eng',  'ENG',  620, 250,  294, 118],
  ['dat',  'DAT',  730, 250,  352,  60],
  ['sec',  'SEC',  830, 250,  548,  60],
];

/* every edge in the tree routes through the centre; in the ring the work
   nodes talk to their neighbours and the centre only arbitrates */
const EDGES = [
  ['ceo','coo'], ['ceo','cfo'], ['ceo','cto'],
  ['coo','ops'], ['coo','sup'], ['cfo','fin'], ['cfo','rsk'],
  ['cto','eng'], ['cto','dat'], ['cto','sec'],
  ['ops','ceo'], ['fin','ceo'], ['eng','ceo'], ['sec','ceo'],
];
const RING = [
  ['coo','cfo'], ['cfo','cto'], ['cto','ops'], ['ops','sup'],
  ['sup','fin'], ['fin','rsk'], ['rsk','eng'], ['eng','dat'],
  ['dat','sec'], ['sec','coo'],
  ['ceo','rsk'], ['ceo','sec'],
];

const STEPS = [
  ['01 — AS PUBLISHED',
   'Every decision travels to the top and back down. The chart is accurate, the reporting lines are correct, and the firm is still slow.',
   '4.2'],
  ['02 — WHERE IT ACTUALLY GOES',
   'The escalation paths people really use, drawn over the chart. Four routes carry load the structure never assigned them.',
   '3.6'],
  ['03 — AUTHORITY AT THE WORK',
   'Rights reassigned per decision rather than per title. The centre keeps what only it can arbitrate: risk and security.',
   '1.4'],
];

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);

export function initGraph() {
  const sec = document.getElementById('sigGraph');
  const svg = document.getElementById('grf');
  if (!sec || !svg) return;

  const track = sec.querySelector('.sig__track');
  const gE = document.getElementById('grfEdges');
  const gN = document.getElementById('grfNodes');
  const step = document.getElementById('graphStep');
  const note = document.getElementById('graphNote');
  const pct  = document.getElementById('graphPct');
  const stat = document.getElementById('grfStat');

  const pos = {};
  NODES.forEach(([id, , tx, ty, rx, ry]) => { pos[id] = { tx, ty, rx, ry, x: tx, y: ty }; });

  // build once; only attributes move afterwards
  const nodeEls = NODES.map(([id, label]) => {
    const g = document.createElementNS(NS, 'g');
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', id === 'ceo' ? 15 : 11);
    if (id === 'ceo') c.classList.add('is-hub');
    const t = document.createElementNS(NS, 'text');
    t.textContent = label;
    t.setAttribute('dy', 27);
    g.appendChild(c); g.appendChild(t); gN.appendChild(g);
    return { id, c, t };
  });

  const all = [...EDGES.map(e => ({ e, kind: 'tree' })),
               ...RING.map(e => ({ e, kind: 'ring' }))];
  const edgeEls = all.map(({ e, kind }) => {
    const p = document.createElementNS(NS, 'path');
    gE.appendChild(p);
    return { a: e[0], b: e[1], kind, p };
  });

  function render(t) {
    for (const id in pos) {
      const n = pos[id];
      n.x = lerp(n.tx, n.rx, t);
      n.y = lerp(n.ty, n.ry, t);
    }
    for (const { id, c, t: txt } of nodeEls) {
      const n = pos[id];
      c.setAttribute('cx', n.x.toFixed(1));
      c.setAttribute('cy', n.y.toFixed(1));
      txt.setAttribute('x', n.x.toFixed(1));
      txt.setAttribute('y', n.y.toFixed(1));
    }
    for (const ed of edgeEls) {
      const a = pos[ed.a], b = pos[ed.b];
      // bow the curve so overlapping tree edges stay readable
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const bow = ed.kind === 'ring' ? 0 : 26 * (1 - t);
      ed.p.setAttribute('d', `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${mx.toFixed(1)},${(my - bow).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`);
      const on = ed.kind === 'ring' ? t : 1 - t;
      ed.p.style.opacity = (0.08 + 0.92 * on).toFixed(3);
      ed.p.classList.toggle('is-own', ed.kind === 'ring' && t > 0.55);
      ed.p.classList.toggle('is-esc', ed.kind === 'tree' && t < 0.55);
    }
  }

  let stage = -1;
  onTrack(track, (p) => {
    if (pct) pct.textContent = pad3(p);
    // hold at each end so the two layouts are readable, morph in the middle
    render(ease(Math.min(1, Math.max(0, (p - 0.34) / 0.42))));

    const s = p < 0.34 ? 0 : (p < 0.72 ? 1 : 2);
    if (s !== stage) {
      stage = s;
      swapText(step, STEPS[s][0]);
      swapText(note, STEPS[s][1]);
      if (stat) stat.innerHTML = 'HOPS TO A DECISION &mdash; <b>' + STEPS[s][2] + '</b>';
    }
  });
}
