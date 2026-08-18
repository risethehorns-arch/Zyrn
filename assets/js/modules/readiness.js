/* SYS.04 · READINESS INSTRUMENT ──────────────────────────────────────
   SYS.04's ladder, made operable. Scroll climbs the index 00 → 04 while
   five dimensions fill at different rates, because the constraint is
   never the average — the slowest dimension is the one that decides what
   the firm can actually do, and it is named rather than averaged away.

   Rates are authored per dimension in the markup (data-rate), so the
   argument stays in the HTML where it can be read. */

import { onTrack, swapText, pad3 } from './_track.js';

const LEVELS = [
  ['LEVEL 00 — EXPLORATORY',
   'Tools in use, nothing measured. Value is anecdotal, and the firm cannot say whether any of it is working.'],
  ['LEVEL 01 — IMPLEMENTED',
   'Pilots run and hold. The benefit is visible but local, and it does not survive being handed to another team.'],
  ['LEVEL 02 — ALIGNED',
   'Ownership and incentives agree. Return can be traced to a decision rather than to an anecdote.'],
  ['LEVEL 03 — SCALED',
   'The system runs across the firm, predictably and repeatably, and it degrades gracefully when it is wrong.'],
  ['LEVEL 04 — SELF-CALIBRATING',
   'The organization tunes itself. Zyrn is no longer required — that is the exit condition, and it is written into the engagement.'],
];

export function initReadiness() {
  const sec = document.getElementById('sigReady');
  if (!sec) return;

  const track = sec.querySelector('.sig__track');
  const step  = document.getElementById('readyStep');
  const note  = document.getElementById('readyNote');
  const pct   = document.getElementById('readyPct');
  const num   = document.getElementById('readyNum');
  const cons  = document.getElementById('readyConstraint');
  const dims  = [...sec.querySelectorAll('.dim')].map(el => ({
    el,
    rate: parseFloat(el.dataset.rate) || 1,
    bar: el.querySelector('.dim__bar i'),
    val: el.querySelector('.dim__v'),
    key: el.querySelector('.dim__k').textContent.trim(),
    last: -1,
  }));

  // the slowest dimension is the constraint, and it stays the constraint
  const slowest = dims.reduce((a, b) => (b.rate < a.rate ? b : a), dims[0]);
  slowest.el.classList.add('is-constraint');
  if (cons) cons.textContent = 'CONSTRAINT — ' + slowest.key;

  let level = -1;
  onTrack(track, (p) => {
    if (pct) pct.textContent = pad3(p);

    // Early on the rates diverge, so the constraint is obvious on sight. Over
    // the last 40% they converge — because that is what the engagement does:
    // it names the constraint, then closes it. Without this the index caps at
    // the constraint's rate and the page never reaches the Level 04 it
    // promises, which reads as a broken instrument rather than as an argument.
    const conv = Math.max(0, Math.min(1, (p - 0.6) / 0.4));
    const eff = (r) => r + (1 - r) * conv * conv;

    for (const d of dims) {
      const v = Math.min(1, p * eff(d.rate));
      if (Math.abs(v - d.last) > 0.004) {
        d.last = v;
        d.bar.style.transform = 'scaleX(' + v.toFixed(3) + ')';
        d.val.textContent = String(Math.round(v * 4)).padStart(2, '0');
      }
    }

    // the index is the CONSTRAINT, not the mean — that is the whole point
    const idx = Math.min(4, Math.floor(Math.min(1, p * eff(slowest.rate)) * 4.999));
    if (num) num.textContent = String(idx).padStart(2, '0');
    if (idx !== level) {
      level = idx;
      swapText(step, LEVELS[idx][0]);
      swapText(note, LEVELS[idx][1]);
    }
  });
}
