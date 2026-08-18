/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE SURFACE   (lumina.html)

   A tour of five pages of the live Lumina site, inside one large window.
   Scroll and the window scrolls the page it is showing; keep scrolling and
   it hands over to the next page. Everything moving here is a real capture
   of www.lumina-jo.com, taken at 2x and finished, not a mockup.

   v1 showed ONE page in a small frame, and the owner's note was exact:
   the window was too small and it did not show enough to make anyone want
   to go and look. Five pages, and the two that matter most are Lumina's own
   scroll instruments:

     /room    an empty wireframe room furnishes itself as you scroll —
              sofa, art, lamp, side table, and the window light moving from
              moonlight to sunset to a lit lamp
     /invest  a building goes up floor by floor, annotated per level

   Their frames were captured at even progress across each pinned track
   (.room-pin, 4140px; .build-pin, 3420px), so a window scrolling down the
   stacked strip REPLAYS their animation rather than describing it. That is
   the whole trick, and it is why those two strips stack whole bands while
   the flat pages stack cropped ones.

   THE POINT OF THE SECTION IS TO SEND PEOPLE TO THEIR SITE. So the URL bar
   tracks the real path, the caption names what you are looking at, and the
   note says what it does — all of it aimed at "I want to go and try that".
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, swapText, pad3, REDUCED } from './_track.js';

/* `h` is the strip's intrinsic height at 1440 wide — used to work out how
   far each one can travel inside the window without measuring per frame. */
const SCENES = [
  {
    id: 'hero', path: '/', w: 1440, h: 2660,
    cap: 'THE LANDING — WHERE LUXURY FINDS ITS LIGHT',
    note: 'Opens on a residence at dusk, with live Amman weather, the current listing count and the commission structure floating over it. Every panel above the fold is a reason to keep reading rather than a claim about excellence.',
  },
  {
    id: 'room', path: '/room', w: 1440, h: 3600,
    cap: 'THE ROOM — SCROLL AN EMPTY ROOM INTO A HOME',
    note: 'Their signature instrument. An empty room furnishes itself as you scroll — nine pieces, each annotated, the light moving from moonlight through sunset to a lamp switched on. Built for buyers who cannot picture an empty apartment.',
  },
  {
    id: 'invest', path: '/invest', w: 1440, h: 3600,
    cap: 'INVEST — THE BUILDING GOES UP AS YOU SCROLL',
    note: 'The same idea aimed at a different buyer. A structure rises floor by floor, each level captioned for what it is — typical plate, upper floor, roof terrace — so an investor reads the building, not a brochure about it.',
  },
  {
    id: 'listings', path: '/listings', w: 1440, h: 2540,
    cap: 'THE COLLECTION — EVERY RESIDENCE THEY HOLD',
    note: 'The live book, filterable by area, type, floor and budget. Photographs are the owners’ and shown with permission — the discretion argument made as interface rather than as a promise.',
  },
  {
    id: 'services', path: '/services', w: 1440, h: 2620,
    cap: 'SERVICES — BUY WELL, HOLD IT PROPERLY, KNOW WHAT IT IS WORTH',
    note: 'Four services on one diagram, the fourth built for other firms in the industry. Same system, same tokens, same type on every page — which is what a brand kit is for.',
  },
];

/* how much of each scene's slice is spent handing over to the next */
const FADE = 0.16;

const ramp = (p, a, b) => {
  const t = Math.min(1, Math.max(0, (p - a) / Math.max(1e-5, b - a)));
  return t * t * (3 - 2 * t);
};

export function initRack() {
  const track = document.getElementById('rkTrack');
  const rack  = document.getElementById('rk');
  const win   = document.getElementById('rkWin');
  if (!track || !rack || !win) return;

  const capEl  = document.getElementById('rkCap');
  const noteEl = document.getElementById('rkNote');
  const urlEl  = document.getElementById('rkUrl');
  const pctEl  = document.getElementById('rkPct');
  const idxEl  = document.getElementById('rkIdx');
  const dotsEl = document.getElementById('rkDots');
  const mobIm  = document.getElementById('rkMobImg');
  const mobFr  = mobIm && mobIm.parentElement;

  /* ── build the layers ─────────────────────────────────────────────
     All five live in the DOM at once, stacked. Only one is ever opaque,
     but they cannot be created on demand: decoding a 1440-wide image at
     the moment it is needed drops a visible blank frame mid-scroll. */
  const layers = SCENES.map((s, i) => {
    const el = document.createElement('img');
    el.className = 'rk__layer';
    el.src = 'assets/media/work/lumina-' + s.id + '.webp';
    el.alt = '';
    el.width = s.w; el.height = s.h;
    el.decoding = 'async';
    if (i === 0) el.fetchPriority = 'high';
    else el.loading = 'lazy';
    win.appendChild(el);
    return el;
  });

  if (dotsEl) {
    SCENES.forEach(() => {
      const d = document.createElement('span');
      d.className = 'rk__dot2';
      dotsEl.appendChild(d);
    });
  }
  const dots = dotsEl ? Array.prototype.slice.call(dotsEl.children) : [];

  /* how far each strip can travel inside the window, in px */
  let runs = new Array(SCENES.length).fill(0);
  let mobRun = 0;

  function measure() {
    const w = win.clientWidth, h = win.clientHeight;
    SCENES.forEach((s, i) => {
      runs[i] = Math.max(0, (s.h * w / s.w) - h);
    });
    if (mobIm && mobFr) mobRun = Math.max(0, mobIm.offsetHeight - mobFr.clientHeight);
  }
  measure();
  if (mobIm && !mobIm.complete) mobIm.addEventListener('load', measure, { once: true });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(rack);
  else addEventListener('resize', measure, { passive: true });

  const N = SCENES.length;
  let shown = -1;

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);

    /* the frame arrives and leaves */
    const inD = ramp(p, 0.00, 0.10) - 0.55 * ramp(p, 0.94, 1.00);
    rack.style.setProperty('--in', inD.toFixed(3));

    /* which scene, and how far through it */
    const f = Math.min(N - 1e-6, Math.max(0, p * N));
    const idx = Math.floor(f);
    const local = f - idx;

    for (let i = 0; i < N; i++) {
      let a = 0;
      if (i === idx) a = 1 - ramp(local, 1 - FADE, 1);
      else if (i === idx + 1) a = ramp(local, 1 - FADE, 1);
      layers[i].style.opacity = a.toFixed(3);

      /* Only the two scenes in play are worth moving. The rest keep their
         last transform, which costs nothing and avoids a jump when they
         come back into the fade. */
      if (i === idx || i === idx + 1) {
        /* Travel is held clear of the hand-over at each end, so a strip is
           never sliding while it is also fading — two motions at once on
           the same element reads as a glitch rather than as a scroll. */
        const s = i === idx ? ramp(local, 0.04, 1 - FADE) : 0;
        layers[i].style.transform = 'translate3d(0,' + (-runs[i] * s).toFixed(1) + 'px,0)';
      }
    }

    if (mobIm) {
      const ms = ramp(p, 0.06, 0.94);
      mobIm.style.transform = 'translate3d(0,' + (-mobRun * ms).toFixed(1) + 'px,0)';
    }

    if (idx !== shown) {
      shown = idx;
      const s = SCENES[idx];
      swapText(capEl, s.cap);
      swapText(noteEl, s.note);
      swapText(urlEl, 'www.lumina-jo.com' + (s.path === '/' ? '' : s.path));
      if (idxEl) idxEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' +
                                     String(N).padStart(2, '0');
      dots.forEach((d, i) => d.classList.toggle('is-on', i === idx));
    }
  }

  if (REDUCED) {
    /* Settled: the room instrument at rest, because it is the one that
       most makes the case, and it survives being still. */
    measure();
    layers.forEach((l, i) => { l.style.opacity = i === 1 ? '1' : '0'; });
    rack.style.setProperty('--in', '1');
    if (pctEl) pctEl.textContent = '000';
    swapText(capEl, SCENES[1].cap);
    swapText(noteEl, SCENES[1].note);
    swapText(urlEl, 'www.lumina-jo.com/room');
    if (idxEl) idxEl.textContent = '02 / 05';
    dots.forEach((d, i) => d.classList.toggle('is-on', i === 1));
    return;
  }
  onTrack(track, draw);
}
