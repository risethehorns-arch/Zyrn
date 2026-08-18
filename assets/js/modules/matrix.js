/* ══════════════════════════════════════════════════════════════════════
   THE COMBINATION MATRIX  (services.html)

   The landing page asserts "run separately they are advice, run together
   they are an operating core." This is that sentence made operable: pick
   any subset of the four lines and read what the combination actually
   covers.

   Coverage combines as a SATURATING UNION, not a sum:

       covered = 1 - Π (1 - c_i)

   Two lines that each touch a dimension partially do not add up to full
   coverage of it, and nothing can exceed 1. A sum would let any three
   lines claim 100% of everything, which is the exact overclaim this tool
   exists to avoid — see the doctrine's rule 2, and docs/strategy.md §5.
   ══════════════════════════════════════════════════════════════════════ */

const DIMENSIONS = [
  ['SURFACE',     'what the market sees before it speaks to anyone'],
  ['IDENTITY',    'what the firm means, written down'],
  ['AUTHORITY',   'who decides what, and what that costs'],
  ['WORKFLOW',    'how work actually moves between people'],
  ['MEASUREMENT', 'what gets counted, and what that changes'],
];

/* per line: coverage of each dimension, 0..1. Authored, not computed —
   these are claims the firm is willing to make, in the order above. */
const LINES = [
  { id: 'web',   idx: '01', name: 'Website design',
    href: 'services/website-design.html',
    c: [1.00, 0.45, 0.00, 0.15, 0.55] },
  { id: 'brand', idx: '02', name: 'Brand kit',
    href: 'services/brand-kit.html',
    c: [0.50, 1.00, 0.10, 0.10, 0.20] },
  { id: 'struc', idx: '03', name: 'Business structuring',
    href: 'services/business-structuring.html',
    c: [0.00, 0.20, 1.00, 0.70, 0.50] },
  { id: 'ai',    idx: '04', name: 'AI adoption',
    href: 'services/ai-transformation.html',
    c: [0.10, 0.00, 0.45, 1.00, 0.75] },
];

/* named readings for the combinations worth naming. Key is the selected
   indices joined — anything unnamed gets the generated sentence below. */
const NAMED = {
  '':     ['NO LINES SELECTED',
           'Select a line. The diagnostic that decides which ones you need is free; the engagement is not.'],
  '0':    ['SURFACE ONLY',
           'The fastest visible change and the least structural one. It moves what the market sees without touching what produced it.'],
  '1':    ['IDENTITY ONLY',
           'Decisions written down so they survive the people who made them. Useful alone, and quietly wasted if nobody has the authority to apply them.'],
  '2':    ['AUTHORITY ONLY',
           'The least visible line and the one that moves the other three. Most firms that think they have a marketing problem are here.'],
  '3':    ['WORKFLOW ONLY',
           'Adoption is an operating-model problem wearing a technology costume. Run alone, this line spends most of its first quarter finding that out.'],
  '0,1':  ['THE FRONT',
           'The firm reads as one thing. Surface and meaning stop contradicting each other — which is worth doing, and does not change who decides anything.'],
  '2,3':  ['THE OPERATING CORE',
           'Decision rights and workflow rebuilt together. This is the pairing most engagements should start from, and the one clients ask for last.'],
  '0,1,2': ['COHERENT FIRM',
           'What the firm says, what it means, and who gets to decide are aligned. The gap left is measurement: nothing here proves the change took.'],
  '0,1,2,3': ['FULL ENGAGEMENT',
           'Every dimension load-bearing on the others. Two quarters minimum, by referral, and the only configuration where the loop closes on itself.'],
};

const LEVELS = ['00 EMERGENT', '01 REACTIVE', '02 DEFINED', '03 MANAGED', '04 ENGINEERED'];

export function initMatrix() {
  const root = document.getElementById('matrix');
  if (!root) return;

  const toggles = [...root.querySelectorAll('.mx__line')];
  const bars    = [...root.querySelectorAll('.mx__bar')];
  const vals    = [...root.querySelectorAll('.mx__val')];
  const idxEl   = root.querySelector('#mxIndex');
  const lvlEl   = root.querySelector('#mxLevel');
  const nameEl  = root.querySelector('#mxName');
  const readEl  = root.querySelector('#mxRead');
  const goEl    = root.querySelector('#mxGo');
  if (!toggles.length) return;

  const on = new Set();

  function compute() {
    const sel = [...on].sort((a, b) => a - b);

    const cov = DIMENSIONS.map((_, d) => {
      let miss = 1;
      for (const i of sel) miss *= (1 - LINES[i].c[d]);
      return 1 - miss;
    });

    for (let d = 0; d < cov.length; d++) {
      if (bars[d]) bars[d].style.setProperty('--v', cov[d].toFixed(4));
      if (vals[d]) vals[d].textContent = String(Math.round(cov[d] * 100)).padStart(3, '0');
      const row = bars[d] && bars[d].closest('.mx__dim');
      if (row) row.classList.toggle('is-thin', cov[d] > 0 && cov[d] < 0.5);
    }

    const index = cov.reduce((a, b) => a + b, 0) / cov.length;
    if (idxEl) idxEl.textContent = String(Math.round(index * 100)).padStart(3, '0');
    if (lvlEl) lvlEl.textContent = LEVELS[Math.min(4, Math.floor(index * 4.999))];

    const key = sel.join(',');
    let name, read;
    if (NAMED[key]) {
      [name, read] = NAMED[key];
    } else {
      /* generated reading: name the weakest dimension, because that is the
         thing the combination is actually failing to do */
      let worst = 0;
      for (let d = 1; d < cov.length; d++) if (cov[d] < cov[worst]) worst = d;
      name = sel.length + ' LINES';
      read = 'Covered where it counts, with ' + DIMENSIONS[worst][0].toLowerCase() +
             ' left at ' + Math.round(cov[worst] * 100) + '%. ' +
             (cov[worst] < 0.35
               ? 'That gap is where the engagement will stall — it is ' +
                 DIMENSIONS[worst][1] + '.'
               : 'Enough to run on, not enough to close the loop.');
    }
    if (nameEl) nameEl.textContent = name;
    if (readEl) readEl.textContent = read;

    root.classList.toggle('is-empty', sel.length === 0);
    if (goEl) {
      goEl.hidden = sel.length !== 1;
      if (sel.length === 1) {
        goEl.href = LINES[sel[0]].href;
        goEl.textContent = 'Open ' + LINES[sel[0]].name.toLowerCase();
      }
    }
  }

  toggles.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if (on.has(i)) on.delete(i); else on.add(i);
      btn.setAttribute('aria-pressed', String(on.has(i)));
      btn.classList.toggle('is-on', on.has(i));
      compute();
    });
  });

  /* start on the pairing the copy argues for, so the panel is never a dead
     empty state on arrival and the default reading is the useful one */
  on.add(2); on.add(3);
  toggles.forEach((b, i) => {
    b.classList.toggle('is-on', on.has(i));
    b.setAttribute('aria-pressed', String(on.has(i)));
  });
  compute();
}
