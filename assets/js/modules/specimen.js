/* SYS.02 · LIVING SPECIMEN ───────────────────────────────────────────
   The kit applied to itself. Three panels cross-fade on scroll — palette,
   type, the mark — and each one is operable rather than illustrated: the
   chips report the real hex and the real rule, and the mark runs the
   actual shear component the site ships, not a picture of it. */

import { onTrack, stageOf, swapText, pad3, REDUCED } from './_track.js';

const STEPS = [
  ['01 — PALETTE',
   'Four values and a hairline. Each one carries a stated job, so a fifth colour has to argue for itself — and so far none has.'],
  ['02 — TYPE',
   'Two families, four weights, a scale with sizes and tracking. A type scale is a set of numbers; a mood board is not a decision.'],
  ['03 — THE MARK',
   'Two copies of the wordmark, each clipped to one half, offset in opposite directions with a Pulse seam on the join. It shears once and never returns.'],
];

export function initSpecimen() {
  const sec = document.getElementById('sigSpec');
  if (!sec) return;

  const track  = sec.querySelector('.sig__track');
  const step   = document.getElementById('specStep');
  const note   = document.getElementById('specNote');
  const pct    = document.getElementById('specPct');
  const panels = [...sec.querySelectorAll('.spec__panel')];
  const hex    = document.getElementById('specHex');
  const use    = document.getElementById('specUse');
  const chips  = [...sec.querySelectorAll('.chip')];
  const shear  = document.getElementById('specShear');
  const glitch = document.getElementById('specGlitch');
  const replay = document.getElementById('specReplay');

  /* ── palette chips ── */
  const select = (c) => {
    chips.forEach(x => x.classList.toggle('is-on', x === c));
    if (hex) hex.textContent = c.dataset.hex;
    if (use) use.textContent = c.dataset.use + '.';
    if (hex) hex.style.color = c.dataset.hex === '#0E0F12'
      ? 'var(--vapor)' : c.dataset.hex;      // obsidian on obsidian is unreadable
  };
  chips.forEach(c => {
    c.addEventListener('pointerenter', () => select(c));
    c.addEventListener('focus', () => select(c));
    c.addEventListener('click', () => select(c));
  });
  const pulse = chips.find(c => c.dataset.hex === '#6E56F8');
  if (pulse) select(pulse);

  /* ── the mark: re-run the law on demand ── */
  const runShear = () => {
    if (!shear || REDUCED) return;
    shear.classList.remove('is-sheared');
    // force a reflow so the class removal is not coalesced with the re-add
    void shear.offsetWidth;
    requestAnimationFrame(() => shear.classList.add('is-sheared'));
  };
  if (replay) replay.addEventListener('click', runShear);
  if (glitch) {
    glitch.addEventListener('pointerenter', () => {
      if (REDUCED || glitch.classList.contains('is-glitching')) return;
      glitch.classList.add('is-glitching');
      setTimeout(() => glitch.classList.remove('is-glitching'), 320);
    });
  }

  /* ── scroll drives which panel is showing ── */
  let shown = -1;
  onTrack(track, (p) => {
    if (pct) pct.textContent = pad3(p);
    const s = stageOf(p, STEPS.length);
    swapText(step, STEPS[s - 1][0]);
    swapText(note, STEPS[s - 1][1]);
    if (s - 1 !== shown) {
      shown = s - 1;
      panels.forEach((el, i) => el.classList.toggle('is-on', i === shown));
      if (shown === 2) runShear();          // arrive on the mark, run the law
    }
  });
}
