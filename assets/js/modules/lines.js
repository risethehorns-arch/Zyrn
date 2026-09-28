/* ══════════════════════════════════════════════════════════════════════
   THE LINES — what each of the four covers   (services.html)

   One table, read by two instruments: the combination matrix combines
   these numbers (modules/matrix.js) and THE BAY plots them on each slab
   (modules/bay.js).

   Its own file, and a NEW one, on purpose. Module imports are not
   content-stamped (docs/stamp.py covers href/src only), so a returning
   reader can hold a cached matrix.js for as long as the host allows. Had
   this table been exported from matrix.js, their stale copy would have had
   no such export and the page's whole module script would have failed to
   link. A file that did not exist before cannot be stale.
   ══════════════════════════════════════════════════════════════════════ */

export const DIMENSIONS = [
  ['SURFACE',     'what the market sees before it speaks to anyone'],
  ['IDENTITY',    'what the firm means, written down'],
  ['AUTHORITY',   'who decides what, and what that costs'],
  ['WORKFLOW',    'how work actually moves between people'],
  ['MEASUREMENT', 'what gets counted, and what that changes'],
];

/* per line: coverage of each dimension, 0..1. Authored, not computed —
   these are claims the firm is willing to make, in the order above. */
export const LINES = [
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
