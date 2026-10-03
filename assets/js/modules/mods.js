/* ══════════════════════════════════════════════════════════════════════
   THE MODULE CARDS OPEN   (every service page — "What it covers")

   Thirty modules across five pages were six static cards each: a title
   and one sentence, no depth behind the click a reader inevitably tries.
   Now each card is a disclosure. Open one and it gives two things:

     · a second paragraph — the part of the answer that did not fit in a
       card, authored per module in the page's own markup (`data-more`),
       never generated
     · a small line drawing of the module's actual mechanism, from a
       library of twelve (`data-viz`), drawn in when the card opens and
       carrying one point of the glint light

   ── WHY THE DRAWINGS ARE A LIBRARY, NOT PER-CARD ART ────────────────
   Twelve mechanisms cover thirty modules because most modules ARE one of
   a dozen shapes: a grid, a flow with handoffs, a ring of tokens, tiers
   with an escalation, columns through a gate. Drawing each card its own
   bespoke sketch would be slower AND worse — the repetition is the
   argument that the firm sees the same structures everywhere.

   ── MECHANICS ───────────────────────────────────────────────────────
   One open card per grid (an accordion): these sit three across, and two
   tall neighbours make the row jump. Opening animates
   `grid-template-rows: 0fr -> 1fr` on the card's own inner grid — a
   layout change, but a CLICK-TIME one, never per-frame. The drawing
   draws itself in with the dash trick on open, once.

   Cards are real disclosure widgets: `aria-expanded`, Enter and Space,
   and the whole card is the target because the whole card always looked
   like one.
   ══════════════════════════════════════════════════════════════════════ */

const NS = 'http://www.w3.org/2000/svg';

/* ── the library ─────────────────────────────────────────────────────
   Each entry returns {main, extra, lit}: `main` is the path that draws
   itself in, `extra` is static underlay, `lit` is [x, y] for the light.
   ViewBox is 0 0 220 84 everywhere. */
const VIZ = {
  /* a 12-column grid, one column carrying a block */
  grid: () => ({
    extra: range(12).map((i) => `M${18 + i * 17} 10 V74`).join(' '),
    main: 'M69 26 H154 V58 H69 Z',
    lit: [154, 26],
  }),
  /* structure: blocks placed in order */
  blocks: () => ({
    extra: 'M18 12 H202 M18 12 V74 M202 12 V74 M18 74 H202',
    main: 'M30 24 H128 M30 38 H98 M30 52 H76 M142 24 V62 H190 V24 Z',
    lit: [190, 24],
  }),
  /* a flow crossing lanes, with handoff dots */
  flow: () => ({
    extra: 'M18 24 H202 M18 46 H202 M18 68 H202',
    main: 'M22 68 L70 68 L92 46 L136 46 L158 24 L198 24',
    lit: [158, 24],
  }),
  /* bars, one over the line */
  bars: () => ({
    extra: 'M18 70 H202 M18 30 H202',
    main: 'M34 70 V52 M62 70 V44 M90 70 V58 M118 70 V22 M146 70 V50 M174 70 V40',
    lit: [118, 22],
  }),
  /* tiers with an escalation up and back */
  tiers: () => ({
    extra: 'M18 22 H202 M18 46 H202 M18 70 H202',
    main: 'M42 70 L82 22 L122 70 L162 70',
    lit: [82, 22],
  }),
  /* one outcome, one name: a line resolving to a single dot */
  split: () => ({
    extra: 'M18 16 H70 M18 42 H70 M18 68 H70',
    main: 'M70 16 C120 16 120 42 160 42 M70 42 H160 M70 68 C120 68 120 42 160 42 M160 42 H196',
    lit: [196, 42],
  }),
  /* a response curve with the point that matters */
  curve: () => ({
    extra: 'M18 74 H202 M18 10 V74',
    main: 'M18 74 C60 74 76 18 118 14 C156 11 180 10 202 10',
    lit: [118, 14],
  }),
  /* a ring of tokens, one lit */
  ring: () => ({
    extra: '',
    main: ringPath(110, 42, 30),
    lit: [110, 12],
  }),
  /* a ledger: rows arriving in time order */
  ledger: () => ({
    extra: 'M40 12 V74',
    main: 'M40 20 H120 M40 34 H170 M40 48 H140 M40 62 H190',
    lit: [190, 62],
  }),
  /* columns rising through a gate */
  gate: () => ({
    extra: 'M18 38 H202',
    main: 'M42 74 V50 M80 74 V30 M118 74 V58 M156 74 V26 M194 74 V44',
    lit: [156, 26],
  }),
  /* a document of panels, fanned */
  sheet: () => ({
    extra: 'M30 20 H120 V72 H30 Z',
    main: 'M58 14 H148 V66 H58 Z M86 8 H176 V60 H86 Z',
    lit: [176, 8],
  }),
  /* one-way sync: theirs to yours, never back */
  sync: () => ({
    extra: 'M22 24 H92 V60 H22 Z M128 24 H198 V60 H128 Z',
    main: 'M92 42 H120 M112 34 L124 42 L112 50',
    lit: [124, 42],
  }),

  /* ── the two agent programmes (2026-10-03) ─────────────────────── */
  /* a console: a prompt, lines typed under it, the cursor */
  console: () => ({
    extra: 'M18 12 H202 V72 H18 Z M18 24 H202',
    main: 'M30 38 H40 M46 38 H110 M46 50 H86 M46 62 H132 M138 62 V68',
    lit: [138, 65],
  }),
  /* the relay: a machine, a hand, and the private link between them */
  relay: () => ({
    extra: 'M22 20 H110 V62 H22 Z M30 68 H102 M156 16 H190 V70 H156 Z M168 62 H178',
    main: 'M110 40 C128 40 136 32 156 32',
    lit: [156, 32],
  }),
  /* a brief: one line that carries three things */
  brief: () => ({
    extra: 'M26 18 H194 V66 H26 Z',
    main: 'M40 34 H78 M86 34 H124 M132 34 H176 M40 50 H110',
    lit: [176, 34],
  }),
  /* deploy: from the machine, through a check, out — and a way back */
  deploy: () => ({
    extra: 'M20 30 H64 V58 H20 Z M100 36 L116 44 L100 52 M156 30 H200 V58 H156 Z',
    main: 'M64 44 H96 M120 44 H156 M156 64 C120 76 84 76 64 64',
    lit: [108, 44],
  }),
  /* three lanes into one door */
  lanes: () => ({
    extra: 'M18 22 H60 M18 42 H60 M18 62 H60',
    main: 'M60 22 C96 22 100 42 128 42 M60 42 H128 M60 62 C96 62 100 42 128 42 M128 42 H194',
    lit: [128, 42],
  }),
  /* intent: a message read, a label put on it */
  intent: () => ({
    extra: 'M18 26 H118 V58 H18 Z',
    main: 'M30 38 H84 M30 48 H64 M118 42 H150 M150 30 H198 V54 H150 Z',
    lit: [150, 42],
  }),
  /* the hub: in, looked up, out */
  hub: () => ({
    extra: 'M18 42 H74 M146 20 H202 M146 42 H202 M146 64 H202',
    main: 'M110 42 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 M126 42 C136 42 136 20 146 20 M126 42 H146 M126 42 C136 42 136 64 146 64',
    lit: [110, 42],
  }),
  /* the voice: the firm's phrases, and the ones it refuses */
  reply: () => ({
    extra: 'M18 18 H202 M18 66 H202',
    main: 'M30 34 H120 M30 48 H90 M140 34 H190 M140 48 L190 48 M146 42 L184 54',
    lit: [120, 34],
  }),
  /* hand-over: the thread goes to a person, whole */
  handoff: () => ({
    extra: 'M18 22 H100 V62 H18 Z M30 32 H88 M30 42 H70 M30 52 H80',
    main: 'M100 42 H150 M142 34 L154 42 L142 50 M168 30 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M160 62 C160 46 192 46 192 62',
    lit: [154, 42],
  }),
};

function range(n) { const a = []; for (let i = 0; i < n; i++) a.push(i); return a; }
function ringPath(cx, cy, r) {
  /* five arcs with gaps — the same partition the orbit draws */
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const a0 = (i * 72 - 90 + 6) * Math.PI / 180;
    const a1 = ((i + 1) * 72 - 90 - 6) * Math.PI / 180;
    parts.push('M' + (cx + r * Math.cos(a0)).toFixed(1) + ' ' + (cy + r * Math.sin(a0)).toFixed(1) +
               ' A' + r + ' ' + r + ' 0 0 1 ' +
               (cx + r * Math.cos(a1)).toFixed(1) + ' ' + (cy + r * Math.sin(a1)).toFixed(1));
  }
  return parts.join(' ');
}

function buildViz(kind) {
  const spec = (VIZ[kind] || VIZ.flow)();
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'vz');
  svg.setAttribute('viewBox', '0 0 220 84');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('aria-hidden', 'true');
  if (spec.extra) {
    const e = document.createElementNS(NS, 'path');
    e.setAttribute('class', 'vz__ghost');
    e.setAttribute('d', spec.extra);
    svg.appendChild(e);
  }
  const m = document.createElementNS(NS, 'path');
  m.setAttribute('class', 'vz__main');
  m.setAttribute('d', spec.main);
  /* pathLength=1 normalises every drawing to the same dash arithmetic:
     dasharray 1 / dashoffset 1 hides it, offset->0 draws it in — across
     subpaths in author order, so a bar chart draws bar by bar for free. */
  m.setAttribute('pathLength', '1');
  svg.appendChild(m);
  const dot = document.createElementNS(NS, 'circle');
  dot.setAttribute('class', 'vz__lit');
  dot.setAttribute('cx', spec.lit[0]);
  dot.setAttribute('cy', spec.lit[1]);
  dot.setAttribute('r', 3.2);
  svg.appendChild(dot);
  return svg;
}

export function initMods() {
  const grids = Array.prototype.slice.call(document.querySelectorAll('.mods'));
  grids.forEach((grid) => {
    const cards = Array.prototype.slice.call(grid.querySelectorAll('.mod'));
    cards.forEach((card) => {
      const more = card.dataset.more;
      if (!more) return;                       // a card with nothing more to say stays a card

      const wrap = document.createElement('div');
      wrap.className = 'mod__more';
      const inner = document.createElement('div');
      inner.className = 'mod__morein';
      inner.appendChild(buildViz(card.dataset.viz || 'flow'));
      const p = document.createElement('p');
      p.className = 'mod__brief';
      p.textContent = more;
      inner.appendChild(p);
      wrap.appendChild(inner);
      card.appendChild(wrap);

      const plus = document.createElement('span');
      plus.className = 'mod__plus';
      plus.setAttribute('aria-hidden', 'true');
      card.appendChild(plus);

      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-expanded', 'false');

      function set(open) {
        card.classList.toggle('is-open', open);
        card.setAttribute('aria-expanded', String(open));
      }
      function toggle() {
        const opening = !card.classList.contains('is-open');
        /* one open per grid — three-across cards with two tall neighbours
           make the whole row jump */
        cards.forEach((c) => {
          if (c !== card && c.classList.contains('is-open')) {
            c.classList.remove('is-open');
            c.setAttribute('aria-expanded', 'false');
          }
        });
        set(opening);
      }
      card.addEventListener('click', (e) => {
        // a real link inside a card keeps its own behaviour
        if (e.target.closest && e.target.closest('a')) return;
        toggle();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        toggle();
      });
    });
  });
}
