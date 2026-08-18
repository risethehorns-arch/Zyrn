/* SYS.01 · THE BUILD ─────────────────────────────────────────────────
   A surface assembling itself as you scroll: structure, hierarchy, type,
   system, live. Five stages, and the whole visual is driven by one
   [data-stage] attribute on the frame — CSS does the rest, so a stage
   change costs one attribute write rather than a layout pass. */

import { onTrack, stageOf, swapText, pad3 } from './_track.js';

const STEPS = [
  ['01 — STRUCTURE',
   'Architecture before layout. Blocks are placed by what the page has to prove, in the order it has to prove it.'],
  ['02 — HIERARCHY',
   'Proportion carries the argument. What the reader sees first is a decision, not an outcome of the content length.'],
  ['03 — TYPE',
   'Two families, four weights, a scale with numbers. The copy is written to the structure, not poured into it.'],
  ['04 — SYSTEM',
   'Tokens, hairlines, and metadata. Every value is written down, so the team can extend this page without a redesign.'],
  ['05 — LIVE',
   'Shipped, measured, and handed over. Frame time and payload were acceptance criteria, not a pass at the end.'],
];

export function initBuild() {
  const sec  = document.getElementById('sigBuild');
  const bld  = document.getElementById('bld');
  const step = document.getElementById('buildStep');
  const note = document.getElementById('buildNote');
  const pct  = document.getElementById('buildPct');
  if (!sec || !bld) return;

  const track = sec.querySelector('.sig__track');
  bld.dataset.stage = '1';

  onTrack(track, (p) => {
    if (pct) pct.textContent = pad3(p);
    const s = stageOf(p, STEPS.length);
    if (bld.dataset.stage !== String(s)) bld.dataset.stage = String(s);
    swapText(step, STEPS[s - 1][0]);
    swapText(note, STEPS[s - 1][1]);
  });
}
