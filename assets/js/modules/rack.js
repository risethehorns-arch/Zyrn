/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE SURFACE   (lumina.html, thehub.html)

   A tour of a live site inside one large window. Scroll and the window
   scrolls the page it is showing; keep scrolling and it hands over to the
   next page. Everything moving here is a real capture of the live site.

   THREE VERSIONS OF THIS HAVE SHIPPED, and the history matters because the
   third repeated the first one's actual mistake — shipping something that
   was right in the room it was built in:

     v1  one page in a small frame. The owner's note was exact: the window
         was too small and it did not show enough to make anyone want to go
         and look.
     v2  five tall stitched strips translated inside a big window. Right
         mechanism, too few tiles (four a scene), and it went stale silently
         when Lumina was rebuilt — the page described a hero that no longer
         existed and showed /invest content under a /room caption.
     v3  one video a page, scrubbed by binding currentTime to the track.
         Perfect fidelity in Chrome, and it did not move AT ALL on the
         owner's browser. Safari and iOS will not reliably seek a
         `preload="none"` element without a user gesture, and a scroll
         instrument has no gesture to offer.

   The tell on v3 was free and should have been read sooner: THE PHONE STRIP
   BESIDE IT SCROLLED. It is driven by this same draw() callback, so the
   scroll plumbing was never in question — only the seeking was.

   v4 is v2's mechanism with v3's discipline. Strips again, because an image
   that is translated cannot fail to seek: there is nothing to seek. But
   re-captured from the sites as they are today, at eight to ten tiles a
   scene instead of four. Pinned sections (Lumina's /room and /invest, and
   the hero) are sampled at even progress across their pin track, so
   translating the strip steps through the animation; flat pages are sampled
   at consecutive viewport heights, so translating IS scrolling the page.
   docs/strips.py regenerates the lot, which is the answer to v2's other
   problem: a re-shoot is now a re-run.

   The instrument around it is unchanged — arrival, caption, URL bar, index,
   dots, percent, and the phone beside it.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, swapText, pad3, REDUCED } from './_track.js';

/* `w` is the scene's share of the track, and it is the TILE COUNT: a scene
   holding ten viewports of content earns more scroll than one holding four.
   `h` is the strip's intrinsic height at 1120 wide, used to work out how far
   it can travel inside the window without measuring the image every frame. */
export const LUMINA_SCENES = [
  {
    id: 'lum-hero', path: '/', w: 8, h: 5600,
    cap: 'THE LANDING — A DESCENT, THEN THE LIGHT',
    note: 'Opens above cloud and falls through it, the building drawing itself in wireframe on the way down before it resolves. Underneath: live Amman weather, the listing count and the commission structure, stated up front. Every panel above the fold is a reason to keep reading rather than a claim about excellence.',
  },
  {
    id: 'lum-room', path: '/room', w: 10, h: 7000,
    cap: 'THE ROOM — SCROLL AN EMPTY ROOM INTO A HOME',
    note: 'Their signature instrument. An empty room furnishes itself as you scroll — nine pieces, each annotated, the light moving from moonlight through sunset to a lamp switched on. Built for buyers who cannot picture an empty apartment. It closes by saying the room is a render and the properties are not, which is the whole brand in one line.',
  },
  {
    id: 'lum-build', path: '/invest', w: 9, h: 6300,
    cap: 'INVEST — THE BUILDING GOES UP AS YOU SCROLL',
    note: 'The same idea aimed at a different buyer. A structure rises floor by floor, each level captioned for what it is — typical plate, upper floor, roof terrace — so an investor reads the building rather than a brochure about it.',
  },
  {
    id: 'lum-areas', path: '/areas', w: 8, h: 5600,
    cap: 'AREAS — FOUR DISTRICTS, FOUR DIFFERENT ARGUMENTS',
    note: 'A map that moves between districts and argues each one separately, with indicative values updated quarterly from their own closed transactions rather than from asking prices. Added since this case study was first written.',
  },
  {
    id: 'lum-listings', path: '/listings', w: 6, h: 4200,
    cap: 'THE COLLECTION — EVERY RESIDENCE THEY HOLD',
    note: 'The live book, filterable by area, type, floor and budget. Photographs are the owners’ and shown with permission — the discretion argument made as interface rather than as a promise.',
  },
  {
    id: 'lum-services', path: '/services', w: 4, h: 2800,
    cap: 'SERVICES — BUY WELL, HOLD IT PROPERLY, KNOW WHAT IT IS WORTH',
    note: 'Four services on one diagram, the fourth built for other firms in the industry. Same system, same tokens, same type on every page — which is what a brand kit is for.',
  },
];

function anchor(scenes) {
  const total = scenes.reduce((a, s) => a + s.w, 0);
  let acc = 0;
  for (const s of scenes) {
    s.at = acc / total;
    s.span = s.w / total;
    acc += s.w;
  }
  return scenes;
}

/* how much of a scene's slice is spent handing over to the next */
const FADE = 0.14;

const ramp = (p, a, b) => {
  const t = Math.min(1, Math.max(0, (p - a) / Math.max(1e-5, b - a)));
  return t * t * (3 - 2 * t);
};

export function initRack(opts) {
  const cfg = opts || {};
  const SCENES = anchor(cfg.scenes || LUMINA_SCENES);
  const HOST = cfg.host || 'www.lumina-jo.com';
  const SETTLED = cfg.settled == null ? 1 : cfg.settled;

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

  /* All the strips live in the DOM at once, stacked. They cannot be created
     on demand: decoding a 1120-wide strip at the moment it is needed drops a
     visible blank frame mid-scroll. Only the first is eager — the rest are
     lazy, so a reader who never reaches the last scene never pays for it. */
  const layers = SCENES.map((s, i) => {
    const el = document.createElement('img');
    el.className = 'rk__layer';
    el.src = 'assets/media/work/' + s.id + '.webp';
    el.alt = '';
    el.width = 1120; el.height = s.h;
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
  const runs = new Array(SCENES.length).fill(0);
  let mobRun = 0;

  function measure() {
    const w = win.clientWidth, h = win.clientHeight;
    SCENES.forEach((s, i) => {
      runs[i] = Math.max(0, (s.h * w / 1120) - h);
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

    /* ── THE TRAVEL IS LINEAR. IT MUST STAY LINEAR. ───────────────────
       This window is a page being scrolled, and the one thing a reader
       checks without knowing they are checking it is whether the thing under
       the wheel moves WITH the wheel. Any easing here is a lie about how far
       they scrolled.

       The first build got this wrong twice over. `q` was a smoothstep, so
       the whole section crawled at each end and ran in the middle; and the
       travel was `ramp(local, 0.03, 1 - FADE)`, which SATURATES at
       local = 0.86 — so for the last fourteen percent of every scene the
       desktop window stood completely still while the phone strip beside it
       carried on. Reported exactly that way: the mouse is synced to the
       phone, not to the page.

       So: `q` is a straight clamp, and travel is `local` with nothing
       applied to it. The only easing left in this instrument is the frame's
       arrival, which moves the frame and not its contents.
       There is no head or tail on it either. Clamping the travel into
       0.05..0.95 left 218px of scroll at the top of the section where the
       page moved and the window did not — small, and exactly the thing being
       complained about. The frame's arrival is allowed to overlap the first
       few pixels of travel; a real page does the same. */
    const q = p;
    let idx = 0;
    for (let i = 0; i < N; i++) if (q >= SCENES[i].at) idx = i;
    const local = Math.min(1, Math.max(0,
      (q - SCENES[idx].at) / SCENES[idx].span));

    for (let i = 0; i < N; i++) {
      let a = 0;
      if (i === idx) a = 1 - ramp(local, 1 - FADE, 1);
      else if (i === idx + 1) a = ramp(local, 1 - FADE, 1);
      layers[i].style.opacity = a.toFixed(3);

      /* Both scenes in play keep travelling — the outgoing one all the way
         to the end of its strip while it fades, the incoming one from the
         top of its own. Freezing either of them is what produced the stall.
         The rest keep their last transform, which costs nothing. */
      if (i === idx || i === idx + 1) {
        const t = i === idx ? local : 0;
        layers[i].style.transform =
          'translate3d(0,' + (-runs[i] * t).toFixed(1) + 'px,0)';
      }
    }

    /* The phone runs on the SAME linear clock, so the two devices agree
       about where the reader is. It used to have a smoothstep of its own,
       which is why the two disagreed at every scene boundary. */
    if (mobIm) {
      mobIm.style.transform =
        'translate3d(0,' + (-mobRun * q).toFixed(1) + 'px,0)';
    }

    if (idx !== shown) {
      shown = idx;
      const s = SCENES[idx];
      swapText(capEl, s.cap);
      if (noteEl) swapText(noteEl, s.note);
      swapText(urlEl, HOST + (s.path === '/' ? '' : s.path));
      if (idxEl) idxEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' +
                                     String(N).padStart(2, '0');
      dots.forEach((d, i) => d.classList.toggle('is-on', i === idx));
    }
  }

  if (REDUCED) {
    /* Settled: one scene at rest — the one that most makes the case and
       survives being still. */
    measure();
    layers.forEach((l, i) => { l.style.opacity = i === SETTLED ? '1' : '0'; });
    rack.style.setProperty('--in', '1');
    if (pctEl) pctEl.textContent = '000';
    const s = SCENES[SETTLED];
    swapText(capEl, s.cap);
    if (noteEl) swapText(noteEl, s.note);
    swapText(urlEl, HOST + (s.path === '/' ? '' : s.path));
    if (idxEl) idxEl.textContent = String(SETTLED + 1).padStart(2, '0') + ' / ' +
                                   String(N).padStart(2, '0');
    dots.forEach((d, i) => d.classList.toggle('is-on', i === SETTLED));
    return;
  }
  onTrack(track, draw);
}
