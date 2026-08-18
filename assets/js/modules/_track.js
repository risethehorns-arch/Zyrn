/* ══════════════════════════════════════════════════════════════════════
   Shared plumbing for the signature modules.

   Each service page pins one instrument while you scroll past it. They all
   want the same thing: a 0..1 value for "how far through this track am I",
   and a stage index derived from it.

   Everything reads on rAF rather than on a scroll event, because Lenis
   drives scrolling on rAF anyway — a scroll listener would fire at a
   different cadence and the instruments would lag the field by a frame or
   two. One shared loop serves every module on the page, and it parks
   itself whenever nothing is on screen.
   ══════════════════════════════════════════════════════════════════════ */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clients = [];
let running = false;

function loop() {
  if (!clients.length) { running = false; return; }
  requestAnimationFrame(loop);

  const vh = window.innerHeight;
  for (const c of clients) {
    const r = c.track.getBoundingClientRect();
    // 0 when the track's top reaches the viewport top, 1 when its bottom
    // reaches the viewport bottom — i.e. exactly the pinned stretch
    const span = Math.max(1, r.height - vh);
    const p = Math.min(1, Math.max(0, -r.top / span));
    const near = r.bottom > -vh && r.top < vh * 2;
    if (!near) continue;                       // off screen: skip the work
    if (Math.abs(p - c.last) < 0.0004) continue;
    c.last = p;
    c.cb(p);
  }
}

/** Drive `cb(progress 0..1)` while `track` is pinned. */
export function onTrack(track, cb) {
  if (!track) return;
  clients.push({ track, cb, last: -1 });
  if (!running) { running = true; requestAnimationFrame(loop); }
  cb(0);
}

/** Split 0..1 into `n` stages, returning a 1-based index. */
export function stageOf(p, n) {
  return Math.min(n, Math.floor(p * n) + 1);
}

/** Write `text` into `el` only when it actually changed, with a short
 *  cross-fade. Rewriting identical text every frame kills the fade. */
export function swapText(el, text) {
  if (!el || el.__t === text) return;
  el.__t = text;
  if (REDUCED) { el.textContent = text; return; }
  el.classList.add('is-swap');
  clearTimeout(el.__timer);
  el.__timer = setTimeout(() => {
    el.textContent = text;
    el.classList.remove('is-swap');
  }, 200);
}

export const pad3 = (v) => String(Math.round(v * 100)).padStart(3, '0');
export { REDUCED };
