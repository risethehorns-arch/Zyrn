/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE FOLD   (services/brand-kit.html)

   One sheet, folded, that opens into the five panels it was always made
   of — palette, type, the mark, motion, voice — and folds back with a
   date on it.

   This replaces `specimen.js`, which cross-faded three panels inside a
   box. That instrument answered "what are the values"; this one answers
   the question the page is actually selling against, which is "is there
   a document, or is there a mood". A folded sheet that opens into five
   named panels and shuts again is that argument with no copy attached.

   ── THE HINGE ───────────────────────────────────────────────────────
   Panel n is a CHILD of panel n-1, pinned at left:100% with
   transform-origin:left center. Rotating one about its own left edge
   therefore carries every panel after it, which is what a fold does and
   what a row of siblings cannot do. The markup nests five deep on
   purpose. Flatten it and each panel swings alone.

   ── THE CAMERA ──────────────────────────────────────────────────────
   Five panels at full size are wider than any column on the site, and
   five panels scaled to fit are too small to read. So the instrument
   does both, in order:

     opens  — shrinking as it goes, until all five are on screen at once
     dives  — back to full size, on the first panel
     walks  — along the row, one panel at a time, full size
     pulls  — back out and folds shut

   `--zoom` and `--tx` are that camera. Everything else on screen is
   derived from them, so the pan and the scale can never disagree about
   where the row is.

   Everything moving here is a transform or an opacity. Nothing in the
   frame loop reads layout: the two measurements the camera needs — the
   stage width and the panel width — are taken on resize and cached.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, onNear, swapText, pad3, REDUCED } from './_track.js';

const PANELS = 5;

/* Eight beats. The five middle ones are the panels, in the order the kit
   is actually written: what it is made of, how it is set, what it is
   called, how it moves, and what it refuses to say. */
/* THE STEP NUMBER IS THE KEY ROW NUMBER. The first build numbered these
   as beats (00..07) while the key rail beside them numbered panels
   (01..06), so the readout said "03 — TYPE" with row 02 lit. Two
   numbering systems on one screen is a defect even when both are
   internally consistent. The two opening beats carry no number because
   they are not panels. */
const BEATS = [
  ['THE SHEET, CLOSED',
   'A brand kit arrives as one document. Not a moodboard, not a folder of exports — a sheet with the decisions on it, which is the only form of it that survives the people who made it.'],
  ['THE SHEET OPENS',
   'Five panels, hinged on each other, all present before the first project starts. Nothing here is invented per piece of work; the work is an application of what is already on the sheet.'],
  ['01 — PALETTE',
   'Four values and a hairline. Each one has a hex code and a job, and a fifth colour has to argue for itself — so far none has. This is why a whole palette can be replaced in one commit.'],
  ['02 — TYPE',
   'Two families, four weights, and a scale with numbers rather than adjectives. Copy is written to the scale, not poured into whatever space is left over.'],
  ['03 — THE MARK',
   'One mark, one construction, one direction. The shear latches: once cut it never closes again, which means the logo cannot be drawn slightly differently by the next person who needs it.'],
  ['04 — MOTION',
   'One curve and three durations, written down like any other token. Motion that is specified can be reviewed, reused and switched off. Motion improvised per component cannot be any of those.'],
  ['05 — VOICE',
   'The half of a kit almost nobody documents: the things the firm will not say. A rule against superlatives is more useful than a page of adjectives, because it is checkable.'],
  ['06 — ONE DOCUMENT',
   'Back to one sheet. The difference between a kit and a set of preferences is that this one is a single artefact — five panels, one file, every value on it counted — so a disagreement about the brand is settled by reading it rather than by asking whoever is nearest.'],
];

/* the score, in track progress */
const FOLD_A = 0.055, FOLD_B = 0.300;   // the sheet opens, shrinking to fit
const APPR_A = 0.300, APPR_B = 0.375;   // the camera dives back to full size
const WALK_A = 0.375, WALK_B = 0.845;   // along the row, one panel at a time
const RETR_A = 0.845, RETR_B = 0.905;   // pull back out
const SHUT_A = 0.905, SHUT_B = 0.975;   // and fold

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const ramp = (p, a, b) => {
  const t = clamp01((p - a) / Math.max(1e-5, b - a));
  return t * t * (3 - 2 * t);
};

export function initFold() {
  const sec   = document.getElementById('sigFold');
  const rig   = document.getElementById('fld');
  const scene = document.getElementById('fldScene');
  const view  = sec && sec.querySelector('.rig__view');
  if (!sec || !rig || !scene || !view) return;

  const stepEl = document.getElementById('fldStep');
  const noteEl = document.getElementById('fldNote');
  const pctEl  = document.getElementById('fldPct');
  const keyEl  = document.getElementById('fldKey');
  const rows   = keyEl ? Array.prototype.slice.call(keyEl.children) : [];
  const panels = Array.prototype.slice.call(scene.querySelectorAll('.fld__p'));
  const track  = sec.querySelector('.sig__track');

  /* The only two layout reads in the whole instrument, and they happen on
     resize rather than per frame. Everything the camera does is arithmetic
     on these two numbers. */
  let viewW = 1, panelW = 1;
  function measure() {
    viewW  = view.clientWidth || 1;
    panelW = panels[0].offsetWidth || 1;
  }
  measure();
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(measure).observe(view);
  } else {
    addEventListener('resize', measure, { passive: true });
  }

  let shown = -1;
  function beat(i) {
    if (i === shown) return;
    shown = i;
    swapText(stepEl, BEATS[i][0]);
    swapText(noteEl, BEATS[i][1]);
    /* Panels are beats 2..6, so the key row is the beat minus two. The
       closing beat lights the last row, which is the document itself. */
    const lit = (i >= 2 && i <= 6) ? i - 2 : (i === 7 ? 5 : -1);
    rows.forEach((r, k) => r.classList.toggle('is-on', k === lit));
    panels.forEach((el, k) => el.classList.toggle('is-lit', k === lit && lit < PANELS));
    rig.dataset.act = String(i >= 2 && i <= 6 ? i - 2 : -1);
  }

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);

    /* ── how far each hinge has opened ──────────────────────────────
       Staggered, so the sheet unrolls left to right rather than snapping
       flat as one body — and CLOSED IN REVERSE, because a sheet folds
       from its far end back toward the spine. Running the close in the
       same order makes the spine panel vanish first and the rest hang in
       mid-air with nothing to fold onto. */
    let spread = 0;
    for (let i = 1; i < PANELS; i++) {
      const oA = FOLD_A + (i - 1) * (FOLD_B - FOLD_A) * 0.19;
      const cA = SHUT_A + (PANELS - 1 - i) * (SHUT_B - SHUT_A) * 0.19;
      const open = clamp01(ramp(p, oA, oA + (FOLD_B - FOLD_A) * 0.46)
                         - ramp(p, cA, cA + (SHUT_B - SHUT_A) * 0.46));
      spread += open;
      panels[i].style.setProperty('--r', (-96 * (1 - open)).toFixed(2) + 'deg');
    }

    /* ── the camera ─────────────────────────────────────────────────
       `zoomFit` is whatever scale puts the CURRENT width of the row on
       screen; it is 1 while the sheet is still nearly closed and falls as
       the row grows, with no schedule of its own. `zoomIn` is the dive,
       and it is the only scheduled part. Deriving the two separately is
       what lets the open and the close reuse the same expression. */
    const zoomFit = Math.min(1, viewW / Math.max(1, (1 + spread) * panelW));
    const zoomIn  = ramp(p, APPR_A, APPR_B) - ramp(p, RETR_A, RETR_B);
    const zoom    = zoomFit + (1 - zoomFit) * zoomIn;

    /* Where the camera is pointing, in panels. Pulled back it holds the
       middle of the row; dived in it walks. One lerp between the two on
       the same number that drives the zoom, so the pan cannot arrive
       somewhere the scale did not expect. */
    const w = clamp01((p - WALK_A) / (WALK_B - WALK_A)) * PANELS;
    const k = Math.min(PANELS - 1, Math.floor(w));
    // Dwell on each panel for most of its window, then travel. The travel
    // finishes inside the station rather than spilling into the next one,
    // which is what let the camera arrive at panel n+1 while the readout
    // still named panel n.
    const g = clamp01((w - k - 0.45) / 0.5);
    const focusWalk = k + g * g * (3 - 2 * g);
    const focus = (spread / 2) + (focusWalk - spread / 2) * zoomIn;

    scene.style.setProperty('--zoom', zoom.toFixed(4));
    scene.style.setProperty('--tx', (-focus * panelW * zoom).toFixed(1) + 'px');
    /* A lean while it is held open and flat while it is being read. The
       lean is what makes the fan read as a sheet in space rather than as
       five rectangles in a row. */
    const lean = (1 - zoomIn) * (spread / (PANELS - 1));
    scene.style.setProperty('--ry', (-15 * lean).toFixed(2) + 'deg');
    scene.style.setProperty('--rx', (5 * lean).toFixed(2) + 'deg');

    rig.style.setProperty('--open', Math.min(1, spread).toFixed(4));
    // captions ride the camera inversely so they stay legible pulled back
    rig.style.setProperty('--capsc', Math.min(2.1, 1 / Math.max(0.2, zoom)).toFixed(3));

    /* THE READOUT FOLLOWS THE CAMERA, not the raw progress. Deriving the
       beat from floor(w) and the pan from a dwell-then-travel curve gave
       two different answers for most of every station: at 45% of the track
       the step readout said PALETTE while the camera was already centred
       on TYPE. Rounding the camera's own position is the only version of
       this that cannot drift, because there is one number. */
    if (p < FOLD_A) beat(0);
    else if (p < WALK_A) beat(1);
    else if (p >= RETR_A) beat(7);
    else beat(2 + Math.min(PANELS - 1, Math.round(focusWalk)));
  }

  if (REDUCED) {
    /* Held fully open, pulled back, nothing lit: the claim the instrument
       exists to make is "all five are on one sheet", and that is legible
       standing still. */
    for (let i = 1; i < PANELS; i++) panels[i].style.setProperty('--r', '0deg');
    const zoomFit = Math.min(1, viewW / Math.max(1, PANELS * panelW));
    scene.style.setProperty('--zoom', zoomFit.toFixed(4));
    scene.style.setProperty('--tx', (-(PANELS - 1) / 2 * panelW * zoomFit).toFixed(1) + 'px');
    scene.style.setProperty('--ry', '0deg');
    scene.style.setProperty('--rx', '0deg');
    rig.style.setProperty('--open', '1');
    rig.style.setProperty('--capsc', Math.min(2.1, 1 / Math.max(0.2, zoomFit)).toFixed(3));
    if (pctEl) pctEl.textContent = '000';
    beat(1);
    return;
  }
  onTrack(track, draw);
  /* ── THE ROOM ────────────────────────────────────────────────────
     Runs every frame while the section is near, whether or not the page
     moved — the lean has to keep easing while the reader holds still,
     which is exactly when a progress-only callback stops being called. */
  onNear(track, (p, room) => {
    const live = Math.min(1, Number(rig.style.getPropertyValue('--open')) || 0);
    rig.style.setProperty('--px', (room.px * live).toFixed(4));
    rig.style.setProperty('--py', (room.py * live).toFixed(4));
    rig.style.setProperty('--lean', (room.vel * live).toFixed(4));
  });
}
