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
