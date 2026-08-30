/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE WIPE   (thehub.html)

   The same page, in two designs, with a seam between them that moves with
   the scroll. LEFT IS ALWAYS BEFORE AND RIGHT IS ALWAYS AFTER, and every one
   of the three pairs sweeps the same way — the old retreating left, the new
   taking the window. Two labels, pinned to the two sides, each fading out
   before its own side gets too narrow to sit a word in.

   The first build alternated the sweep direction so the seam never had to
   jump back across the window between pairs, and carried one label that
   named whichever side you were seeing more of. Both were wrong for the same
   reason: a comparison whose sides swap meaning halfway is not a comparison.
   The seam now fades out over the last and first six percent of each pair
   instead, so the reset happens while there is no seam to see.

   Both halves of every pair were captured from a local server at the same
   viewport, the same scroll position and the same second: the BEFORE is
   `git archive HEAD` of the clone, the AFTER is the working tree, which is
   byte-identical to what is live now. A comparison has to differ in the
   design and in nothing else, or it is an advert rather than evidence.

   Everything here is opacity and clip-path. Nothing in this instrument can
   move a box, which is the standing lesson from the pinned instrument that
   had to be deleted from axes.html.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, swapText, pad3, REDUCED } from './_track.js';

const PAIRS = [
  {
    id: 'home', path: '/',
    cap: 'THE HOME PAGE — THE ONE SURFACE THAT WAS ALREADY CYAN',
    note: 'The palette was not the problem here; the structure was. The hero states what the site is, then hands over to a live count of what is actually in it — 38 AI &amp; automation, 54 online utilities, 32 apps, 18 open-source CLI, 138 reviews published — read from the index rather than typed into the page. Behind it, an ambient field that was not there before.',
  },
  {
    id: 'pillar', path: '/best-free-ai-tools-2026',
    cap: 'A CATEGORY PILLAR — THE PURPLE HALF OF THE SITE',
    note: 'This is the half nobody saw next to the other half. Thirty-one pillar, alternatives and about pages ran a violet accent on a lighter ground with their own container widths and their own navigation, while a hundred and forty-six review pages ran cyan. Same domain, same visit, two brands.',
  },
  {
    id: 'alt', path: '/free-alternative-to-figma',
    cap: 'AN ALTERNATIVES PAGE — SAME TABLE, ONE SYSTEM',
    note: 'The editorial is untouched — not one word of it was ours to change. What moved is everything around it: one accent, one ground, one set of container widths, one navigation, and a table that now belongs to the same document as the page it sits on.',
  },
];

const ramp = (p, a, b) => {
  const t = Math.min(1, Math.max(0, (p - a) / Math.max(1e-5, b - a)));
  return t * t * (3 - 2 * t);
};

export function initWipe() {
  const track = document.getElementById('wpTrack');
  const stage = document.getElementById('wp');
  const win   = document.getElementById('wpWin');
  if (!track || !stage || !win) return;

  const capEl  = document.getElementById('wpCap');
  const noteEl = document.getElementById('wpNote');
  const urlEl  = document.getElementById('wpUrl');
  const pctEl  = document.getElementById('wpPct');
  const idxEl  = document.getElementById('wpIdx');
  const dotsEl = document.getElementById('wpDots');
  const beforeEl = document.getElementById('wpBefore');
  const afterEl  = document.getElementById('wpAfter');

  /* Both halves of all three pairs live in the DOM from the start. Building
     a layer when it is needed means decoding a 1440-wide image mid-scroll,
     and the blank frame that costs is visible. */
  const layers = PAIRS.map((p, i) => {
    const wrap = document.createElement('span');
    wrap.className = 'wp__pair';
    /* NEW first: it is the base layer, always whole. OLD paints on top of it
       and is clipped to the left `--s` of the window, so the seam is that
       clip edge and there is no third element to fall out of step with. */
    for (const which of ['new', 'old']) {
      const im = document.createElement('img');
      im.className = 'wp__im wp__im--' + which;
      im.src = 'assets/media/work/hub-' + p.id + '-' + which + '.webp';
      im.alt = '';
      im.width = 1440; im.height = 900;
      im.decoding = 'async';
      if (i === 0) im.fetchPriority = 'high'; else im.loading = 'lazy';
      wrap.appendChild(im);
    }
    win.appendChild(wrap);
    return wrap;
  });

  if (dotsEl) {
    PAIRS.forEach(() => {
      const d = document.createElement('span');
      d.className = 'rk__dot2';
      dotsEl.appendChild(d);
    });
  }
  const dots = dotsEl ? Array.prototype.slice.call(dotsEl.children) : [];

  const N = PAIRS.length;
  let shown = -1;

  /* `seam` is how much of the window the OLD design still holds, measured
     from the left edge. 1 is all before, 0 is all after. */
  function show(idx, seam, edge) {
    for (let i = 0; i < N; i++) {
      layers[i].style.opacity = i === idx ? '1' : '0';
    }
    stage.style.setProperty('--s', (seam * 100).toFixed(2) + '%');
    stage.style.setProperty('--edge', edge.toFixed(3));
    /* A label sitting in a strip narrower than itself reads as a label for
       the other side, which is the one thing this instrument must never do. */
    if (beforeEl) beforeEl.style.opacity = seam > 0.16 ? '1' : '0';
    if (afterEl)  afterEl.style.opacity  = seam < 0.84 ? '1' : '0';
    if (idx !== shown) {
      shown = idx;
      const p = PAIRS[idx];
      swapText(capEl, p.cap);
      if (noteEl) swapText(noteEl, p.note);
      swapText(urlEl, 'qutaifan.com' + (p.path === '/' ? '' : p.path));
      if (idxEl) idxEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' +
                                     String(N).padStart(2, '0');
      dots.forEach((d, i) => d.classList.toggle('is-on', i === idx));
    }
  }

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);

    const inD = ramp(p, 0.00, 0.10) - 0.55 * ramp(p, 0.94, 1.00);
    stage.style.setProperty('--in', inD.toFixed(3));

    /* Held clear of both ends, so the stage is never arriving and wiping at
       the same time — two motions on one element read as a fault. */
    const q = ramp(p, 0.06, 0.94);
    const f = Math.min(N - 1e-6, Math.max(0, q * N));
    const idx = Math.floor(f);
    const local = f - idx;

    /* Every pair runs the same way: all BEFORE, then all AFTER. The seam has
       to jump back to the right edge between pairs, so it is faded out over
       the six percent at each end where that happens. */
    const seam = 1 - local;
    const edge = ramp(local, 0.00, 0.06) - ramp(local, 0.94, 1.00);
    show(idx, seam, Math.max(0, edge));
  }

  if (REDUCED) {
    /* Settled on the pillar pair at the halfway seam: it is the pair that
       carries the argument — two design systems on one domain — and it is
       legible standing still. */
    stage.style.setProperty('--in', '1');
    if (pctEl) pctEl.textContent = '000';
    show(1, 0.5, 1);
    return;
  }
  onTrack(track, draw);
}
