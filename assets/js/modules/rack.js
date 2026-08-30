/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE SURFACE   (lumina.html)

   A tour of six pages of the live Lumina site, inside one large window.
   Scroll and the window scrolls the page it is showing; keep scrolling and
   it hands over to the next page. Everything moving here is a real capture
   of www.lumina-jo.com.

   v1 showed ONE page in a small frame, and the owner's note was exact: the
   window was too small and it did not show enough to make anyone want to go
   and look. v2 answered that with five tall stitched screenshots translated
   inside the window — a good approximation, and it had two problems.

   The first is that it was an approximation. Lumina's /room and /invest are
   pinned scroll instruments; v2 photographed them at even progress and
   stacked the poses, so the window replayed a flip-book of the animation
   rather than the animation.

   The second is worse: it went stale without saying so. Lumina was rebuilt
   between v2 and now — the homepage opens on a descent through cloud, not
   the dusk residence this file used to describe — so a case study whose
   whole claim is "this shipped and it is still running" was showing a site
   that no longer exists.

   v3 is one video, screencast off a real GPU at 2x from the live site, and
   SCRUBBED BY SCROLL: `currentTime` is bound to track progress, so scrolling
   the section runs the actual footage forward and scrolling back runs it
   back. The instrument is unchanged — arrival, caption, URL bar, index,
   dots, percent, the phone beside it. Only the thing inside the window is
   now the real one.

   Encoded at a 10-frame GOP for exactly this reason: a scrub seeks to the
   nearest keyframe and decodes forward, so a long GOP lurches. 0.33s
   between keyframes is what makes it feel continuous.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, swapText, pad3, REDUCED } from './_track.js';

/* `w` is each take's share of the reel, normalised. These are the concat
   durations the cut was built from (3.78 / 4.98 / 4.17 / 4.14 / 3.51 /
   3.47s), kept as WEIGHTS rather than absolute seconds so the file can be
   re-encoded at a different length without touching this list — the
   boundaries are always derived from the video's own reported duration. */
const SCENES = [
  {
    id: 'hero', path: '/', w: 3.78,
    cap: 'THE LANDING — A DESCENT, THEN THE LIGHT',
    note: 'Opens above cloud and falls through it, the building drawing itself in wireframe on the way down before it resolves. Underneath: live Amman weather, the listing count and the commission structure, stated up front. Every panel above the fold is a reason to keep reading rather than a claim about excellence.',
  },
  {
    id: 'room', path: '/room', w: 4.98,
    cap: 'THE ROOM — SCROLL AN EMPTY ROOM INTO A HOME',
    note: 'Their signature instrument. An empty room furnishes itself as you scroll — nine pieces, each annotated, the light moving from moonlight through sunset to a lamp switched on. Built for buyers who cannot picture an empty apartment. It closes by saying the room is a render and the properties are not, which is the whole brand in one line.',
  },
  {
    id: 'build', path: '/invest', w: 4.17,
    cap: 'INVEST — THE BUILDING GOES UP AS YOU SCROLL',
    note: 'The same idea aimed at a different buyer. A structure rises floor by floor, each level captioned for what it is — typical plate, upper floor, roof terrace — so an investor reads the building rather than a brochure about it.',
  },
  {
    id: 'areas', path: '/areas', w: 4.14,
    cap: 'AREAS — FOUR DISTRICTS, FOUR DIFFERENT ARGUMENTS',
    note: 'A map that moves between districts and argues each one separately, with indicative values updated quarterly from their own closed transactions rather than from asking prices. Added since this case study was first written.',
  },
  {
    id: 'listings', path: '/listings', w: 3.51,
    cap: 'THE COLLECTION — EVERY RESIDENCE THEY HOLD',
    note: 'The live book, filterable by area, type, floor and budget. Photographs are the owners’ and shown with permission — the discretion argument made as interface rather than as a promise.',
  },
  {
    id: 'services', path: '/services', w: 3.47,
    cap: 'SERVICES — BUY WELL, HOLD IT PROPERLY, KNOW WHAT IT IS WORTH',
    note: 'Four services on one diagram, the fourth built for other firms in the industry. Same system, same tokens, same type on every page — which is what a brand kit is for.',
  },
];

/* cumulative start fraction of each scene within the reel */
const TOTAL = SCENES.reduce((a, s) => a + s.w, 0);
let acc = 0;
for (const s of SCENES) { s.at = acc / TOTAL; acc += s.w; }

const ramp = (p, a, b) => {
  const t = Math.min(1, Math.max(0, (p - a) / Math.max(1e-5, b - a)));
  return t * t * (3 - 2 * t);
};

export function initRack() {
  const track = document.getElementById('rkTrack');
  const rack  = document.getElementById('rk');
  const win   = document.getElementById('rkWin');
  const vid   = document.getElementById('rkVid');
  if (!track || !rack || !win || !vid) return;

  const capEl  = document.getElementById('rkCap');
  const noteEl = document.getElementById('rkNote');
  const urlEl  = document.getElementById('rkUrl');
  const pctEl  = document.getElementById('rkPct');
  const idxEl  = document.getElementById('rkIdx');
  const dotsEl = document.getElementById('rkDots');
  const mobIm  = document.getElementById('rkMobImg');
  const mobFr  = mobIm && mobIm.parentElement;

  if (dotsEl) {
    SCENES.forEach(() => {
      const d = document.createElement('span');
      d.className = 'rk__dot2';
      dotsEl.appendChild(d);
    });
  }
  const dots = dotsEl ? Array.prototype.slice.call(dotsEl.children) : [];

  /* how far the phone strip can travel inside its frame, in px */
  let mobRun = 0;
  function measure() {
    if (mobIm && mobFr) mobRun = Math.max(0, mobIm.offsetHeight - mobFr.clientHeight);
  }
  measure();
  if (mobIm && !mobIm.complete) mobIm.addEventListener('load', measure, { once: true });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(rack);
  else addEventListener('resize', measure, { passive: true });

  const N = SCENES.length;
  let shown = -1;

  function label(p) {
    let idx = 0;
    for (let i = 0; i < N; i++) if (p >= SCENES[i].at) idx = i;
    if (idx === shown) return;
    shown = idx;
    const s = SCENES[idx];
    swapText(capEl, s.cap);
    swapText(noteEl, s.note);
    swapText(urlEl, 'www.lumina-jo.com' + (s.path === '/' ? '' : s.path));
    if (idxEl) idxEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' +
                                   String(N).padStart(2, '0');
    dots.forEach((d, i) => d.classList.toggle('is-on', i === idx));
  }

  /* ── loading ──────────────────────────────────────────────────────
     The markup ships `preload="none"`, so nothing is fetched until the
     reader is actually coming to this section. 4.3MB is affordable for a
     case study somebody chose to open and is not affordable in a page load,
     and the difference between those two is entirely this observer. */
  /* Readiness is ASKED FOR, never remembered. The first build latched a
     `ready` flag on a one-shot `loadedmetadata` listener and the scrub never
     moved a frame: `preload="none"` is a hint, Chrome fetches metadata anyway,
     and it had already fired by the time this deferred module ran — so the
     listener attached to an event that was never coming again. Measured: the
     caption, index and percent all tracked the scroll perfectly while
     currentTime sat on 0.00 at every position, which is exactly what a poster
     looks like. */
  function ready() {
    return vid.readyState >= 1 && vid.duration && isFinite(vid.duration);
  }

  function wake() {
    if (vid.getAttribute('preload') === 'auto') return;
    vid.setAttribute('preload', 'auto');
    vid.load();
  }
  /* Under reduced motion nothing ever scrubs, so the reel is never fetched
     at all — the poster is the whole section and 4.3MB would be downloaded
     to be seeked to frame zero and left there. */
  if (!REDUCED) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (es.some(e => e.isIntersecting)) { wake(); io.disconnect(); }
      }, { rootMargin: '900px 0px' });
      io.observe(track);
    } else {
      wake();
    }
  }

  /* A scrubbed video must never also be playing — the two clocks fight and
     the picture stutters between them. Some browsers start it anyway on
     first paint, so this is a latch rather than a one-off pause. */
  vid.addEventListener('play', () => vid.pause());

  let want = -1, seeking = false, seekAt = 0;

  function pump() {
    if (want < 0 || !ready()) return;
    /* One seek in flight at a time, or the queue thrashes and the picture
       tears between two positions. But a seek that never completes — a
       network stall mid-buffer — would latch this closed and freeze the
       window on one frame for the rest of the page, so the gate expires. */
    if (seeking && performance.now() - seekAt < 900) return;
    const d = vid.duration;
    const t = Math.min(d - 0.03, Math.max(0, want * d));
    if (Math.abs(vid.currentTime - t) < 1 / 40) return;
    seeking = true;
    seekAt = performance.now();
    /* fastSeek exists for precisely this: it goes to the nearest keyframe
       instead of decoding to an exact frame, which is what keeps a scrub
       smooth. Chrome does not have it and takes the currentTime path, which
       is the same thing and slower — the 10-frame GOP is what pays for that. */
    if (vid.fastSeek) vid.fastSeek(t); else vid.currentTime = t;
  }
  vid.addEventListener('seeked', () => { seeking = false; pump(); });
  /* Every event that can mean "there is more of this file than there was" —
     because the first seek must not have to wait for the next scroll frame,
     and because the reader may stop scrolling mid-load and never send one. */
  ['loadedmetadata', 'loadeddata', 'canplay', 'durationchange']
    .forEach(e => vid.addEventListener(e, pump));

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);

    /* the frame arrives and leaves */
    const inD = ramp(p, 0.00, 0.10) - 0.55 * ramp(p, 0.94, 1.00);
    rack.style.setProperty('--in', inD.toFixed(3));

    /* Held clear of both ends: the reel runs across the middle of the
       track so it is never both arriving and playing, which read as a
       glitch in v2 and would read as one here. */
    want = ramp(p, 0.06, 0.94);
    pump();
    label(want);

    if (mobIm) {
      const ms = ramp(p, 0.06, 0.94);
      mobIm.style.transform = 'translate3d(0,' + (-mobRun * ms).toFixed(1) + 'px,0)';
    }
  }

  if (REDUCED) {
    /* Settled: the poster, and the room instrument's caption, because it is
       the one that most makes the case and it survives being still. The
       video is never loaded at all in this branch. */
    measure();
    rack.style.setProperty('--in', '1');
    if (pctEl) pctEl.textContent = '000';
    shown = -1;
    label(SCENES[1].at);
    return;
  }
  onTrack(track, draw);
}
