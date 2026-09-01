/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE SWARM   (services/crm.html)

   Forty-eight records, and every organisation of them you scroll through
   is the same forty-eight.

   This replaces the prism — four faces on a turning box — which was a
   fine object and a weak argument: it SHOWED four screens of a product,
   and a competitor could show four screens of theirs. What no rented
   system can show is this: the records themselves, picked up and
   REORGANISED live, five different ways, without one of them being lost,
   renamed or re-entered. That is what "customizable" means when it is
   true, and it is the one claim the swarm makes that a screenshot of a
   dashboard cannot.

   It is also the site's own language. The field takes ninety thousand
   particles from entropy into engineered formations; this takes
   forty-eight records through the same move, in the DOM, one layer up.
   Chaos -> the book -> the pipeline -> the ledger -> somebody else's
   grouping -> one handed-over stack.

   ── THE CHOREOGRAPHY ────────────────────────────────────────────────
   Six formations, each a full set of 48 authored positions. Scroll
   crossfades between neighbours with a PER-CHIP STAGGER — the leading
   chips move first and the trailing ones follow, which is what turns a
   morph into a swarm. The stagger order is shuffled per transition pair
   (deterministically), so the book does not always dissolve from the
   same corner.

   Deterministic throughout: one seeded RNG, fixed at construction. A
   demonstration that lands differently on every load is the wrong thing
   for an argument you want to make twice — the same reason graph.js
   refused a force simulation and the field ships one seed.

   48 elements, one transform and one opacity write each, per frame, and
   nothing in the loop reads layout. The stage is measured on resize.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, onNear, swapText, pad3, REDUCED } from './_track.js';

const COUNT = 48;
const FLAGGED = 31;                 // the one file the 07-day rule catches

const BEATS = [
  ['00 — AS FOUND',
   'Forty-eight records, which is how they actually live before there is a system: some in a spreadsheet, some in a notebook, some in whoever answered the phone. Everything after this is the same forty-eight — count them out, none will be added and none lost.'],
  ['01 — THE BOOK',
   'The same records, as the book: one row per listing, the reference numbers the firm already uses. Nothing was re-entered. A system that starts by asking you to re-type what you know is a system that starts by losing things.'],
  ['02 — THE PIPELINE',
   'The same records, as work in progress: qualified, viewing, closing. One of them has not moved in seven working days and it is lit — working days, counted properly, because a Thursday-to-Sunday gap is not a stalled deal.'],
  ['03 — THE LEDGER',
   'The same records, as time: every change in the order it happened, attributed. The log is how the desk answers "who changed the price", which is the question that actually gets asked.'],
  ['04 — SOMEBODY ELSE’S FIRM',
   'The same records, grouped the way a different firm thinks — by who owns the work, not by what it is. Fields leave, fields arrive, the vocabulary changes; the records never do. That is the whole meaning of customizable, demonstrated rather than promised.'],
  ['05 — HANDED OVER',
   'The same records, stacked and handed across the table: source, data and hosting in the firm’s name, four guarantees enforced at the data, no seat count, nothing to renew. The exit is that there is nothing to exit from.'],
];

/* the score: dwell on each formation, travel between them */
const RUN_A = 0.04, RUN_B = 0.94;
const STATIONS = 6;

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (t) => t * t * (3 - 2 * t);

/* One seed, fixed. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function initSwarm() {
  const sec = document.getElementById('sigSwarm');
  const rig = document.getElementById('swm');
  const stage = document.getElementById('swmStage');
  if (!sec || !rig || !stage) return;

  const track  = sec.querySelector('.sig__track');
  const view   = sec.querySelector('.rig__view');
  const stepEl = document.getElementById('swmStep');
  const noteEl = document.getElementById('swmNote');
  const pctEl  = document.getElementById('swmPct');
  const keyEl  = document.getElementById('swmKey');
  const rows   = keyEl ? Array.prototype.slice.call(keyEl.children) : [];

  /* ── build the 48 once ──────────────────────────────────────────── */
  const rand = rng(20260901);
  const chips = [];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement('span');
    el.className = 'swm__c';
    const ref = String(15 + i).padStart(3, '0');
    el.innerHTML = '<em>' + ref + '</em><s style="width:' +
      (34 + Math.round(rand() * 42)) + '%"></s>';
    if (i === FLAGGED) el.classList.add('is-flag');
    frag.appendChild(el);
    chips.push(el);
  }
  stage.appendChild(frag);

  /* the record count on the rail is COUNTED off what was just built,
     never typed — add a chip and the rail follows it */
  if (keyEl) {
    const t = keyEl.querySelector('[data-c="records"]');
    if (t) t.textContent = String(stage.querySelectorAll('.swm__c').length);
  }

  /* ── the six formations, in unit space (-0.5..0.5 of the stage) ──── */
  function formations() {
    const F = [];

    /* 00 · AS FOUND — seeded chaos, tilted and scattered in depth */
    const chaos = [];
    const r0 = rng(7);
    for (let i = 0; i < COUNT; i++) {
      chaos.push({
        x: (r0() - 0.5) * 0.94, y: (r0() - 0.5) * 0.86,
        z: (r0() - 0.5) * 260,
        rx: (r0() - 0.5) * 46, ry: (r0() - 0.5) * 52, o: 0.6 + r0() * 0.4,
      });
    }
    F.push(chaos);

    /* 01 · THE BOOK — an 8x6 grid, flat, everything legible */
    const book = [];
    for (let i = 0; i < COUNT; i++) {
      const c = i % 8, r = (i / 8) | 0;
      book.push({
        x: (c - 3.5) * 0.117, y: (r - 2.5) * 0.155,
        z: 0, rx: 0, ry: 0, o: 1,
      });
    }
    F.push(book);

    /* 02 · THE PIPELINE — three stacks: 20 qualified, 13 viewing, 15
       closing. A stack is depth as well as a column, so each next card
       sits a step back — the pile reads as a pile. */
    const pipe = [];
    const lanes = [20, 13, 15];
    let k = 0;
    for (let L = 0; L < 3; L++) {
      for (let j = 0; j < lanes[L]; j++, k++) {
        pipe.push({
          x: (L - 1) * 0.33 + (j % 2 ? 0.012 : -0.012),
          y: -0.36 + j * (0.72 / Math.max(1, lanes[L] - 1)),
          z: -j * 7, rx: 0, ry: (L - 1) * -7, o: 1 - j * 0.006,
        });
      }
    }
    F.push(pipe);

    /* 03 · THE LEDGER — one stream, newest at the top, cascading away
       into depth the way a log actually recedes into the past */
    const led = [];
    for (let i = 0; i < COUNT; i++) {
      led.push({
        x: -0.30 + (i % 2) * 0.09,
        y: -0.40 + i * (0.80 / (COUNT - 1)),
        z: -i * 5.4,
        rx: 0, ry: 8, o: 1 - i * 0.011,
      });
    }
    F.push(led);

    /* 04 · SOMEBODY ELSE'S FIRM — four owner clusters, radial. The same
       records grouped by WHO rather than by WHAT: visibly a different
       firm's head, holding the same forty-eight. */
    const own = [];
    const r4 = rng(11);
    const CX = [-0.30, 0.30, -0.30, 0.30], CY = [-0.22, -0.22, 0.24, 0.24];
    const per = [14, 12, 11, 11];
    k = 0;
    for (let g = 0; g < 4; g++) {
      for (let j = 0; j < per[g]; j++, k++) {
        const a = (j / per[g]) * Math.PI * 2 + g;
        const rr = 0.055 + 0.075 * r4();
        own.push({
          x: CX[g] + Math.cos(a) * rr * 1.5,
          y: CY[g] + Math.sin(a) * rr,
          z: (r4() - 0.5) * 40,
          rx: 0, ry: 0, o: 0.96,
        });
      }
    }
    F.push(own);

    /* 05 · HANDED OVER — one tight deck at the centre, squared up,
       receding card by card. The system, boxed. */
    const hand = [];
    for (let i = 0; i < COUNT; i++) {
      hand.push({
        x: (i % 2 ? 0.004 : -0.004) * (i % 5),
        y: 0.02 - i * 0.0016,
        z: -i * 9,
        rx: 0, ry: 0, o: i < 10 ? 1 : Math.max(0.14, 1 - (i - 9) * 0.05),
      });
    }
    F.push(hand);

    return F;
  }
  const FORMS = formations();

  /* Per-transition stagger orders — WHICH chips lead differs each time,
     deterministically, so the book does not always dissolve from the same
     corner. */
  const ORDER = [];
  for (let t = 0; t < STATIONS - 1; t++) {
    const idx = [];
    for (let i = 0; i < COUNT; i++) idx.push(i);
    const rr = rng(100 + t);
    for (let i = COUNT - 1; i > 0; i--) {
      const j = (rr() * (i + 1)) | 0;
      const tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp;
    }
    const rank = new Array(COUNT);
    idx.forEach((chip, pos) => { rank[chip] = pos / (COUNT - 1); });
    ORDER.push(rank);
  }

  /* ── the stage box, measured on resize only ─────────────────────── */
  let W = 1, H = 1, lastP = 0, XS = 1, ZS = 1;
  function measure() {
    W = view.clientWidth || 1;
    H = view.clientHeight || 1;
    /* Depth is a RATIO of the stage like everything else. The formation
       z values were authored against the full-size stage (--righ 700);
       on a short window --righ is 248 and the perspective — itself a
       ratio, 3.2 × righ — shrinks with it, so an unscaled 130px of z
       magnified a chip by a quarter and pushed the cloud through the key
       rail. Scaled, projection magnifies at most ~8% at EVERY size. */
    ZS = H / 700;
    /* And the spread budgets for the chip's own body: half a chip plus
       rotation slack, divided out by that worst-case projection, so the
       widest chaos chip lands inside the stage on a phone and on an
       ultrawide alike. Formations stay in ±0.47 units; XS maps them to
       what this stage can actually hold. */
    const cw = (chips[0] && chips[0].offsetWidth) || 58;
    XS = Math.min(1, ((0.5 * W - cw * 0.85) / 1.08) / (0.47 * W));
  }
  measure();
  /* A RESIZE MUST REDRAW. Every chip's position is an inline transform
     with W and H baked in at draw time, and the track only calls back
     when PROGRESS changes — so without this, rotating a phone or
     resizing a window mid-track leaves the whole flock laid out for the
     previous geometry until the next scroll tick. The CSS-ratio
     instruments get this from the cascade; a JS-positioned one has to do
     it itself. (Wired below, after draw and park exist — a resize
     callback never fires synchronously at init.) */

  let shown = -1;
  function beat(i) {
    if (i === shown) return;
    shown = i;
    swapText(stepEl, BEATS[i][0]);
    swapText(noteEl, BEATS[i][1]);
    rows.forEach((r, k) => r.classList.toggle('is-on', k === i));
    rig.dataset.act = String(i);
  }

  function draw(p) {
    lastP = p;
    if (pctEl) pctEl.textContent = pad3(p);

    /* Which two formations, and how far between them. Dwell for a third
       of each station so every organisation is READ, then travel. */
    const w = clamp01((p - RUN_A) / (RUN_B - RUN_A)) * (STATIONS - 1);
    const k = Math.min(STATIONS - 2, Math.floor(w));
    /* Station dwell: a third of each span, so every organisation is
       READ before it is left — except the FIRST. The reader has already
       been looking at the chaos for the whole approach and the lead-in;
       dwelling on it again was a measured 4-step dead run at the top of
       the track. */
    const g = clamp01((w - k - (k === 0 ? 0.10 : 0.30)) / 0.62);
    const A = FORMS[k], B = FORMS[k + 1], rank = ORDER[k];

    for (let i = 0; i < COUNT; i++) {
      /* the stagger: leading chips commit early, trailing ones follow —
         a 0.34-wide wave across the flock */
      const tt = smooth(clamp01((g * 1.34) - rank[i] * 0.34));
      const a = A[i], b = B[i];
      const x = (a.x + (b.x - a.x) * tt) * W * XS;
      const y = (a.y + (b.y - a.y) * tt) * H;
      const z = (a.z + (b.z - a.z) * tt) * ZS;
      /* a small arc in Z on the way, so travel reads as FLIGHT rather
         than as sliding — each chip lifts toward the camera mid-move */
      const lift = Math.sin(tt * Math.PI) * 34 * ZS;
      /* The flock breathes WITH THE SCROLL during a dwell — a few px of
         per-chip z, phased by index, driven by p rather than by a clock.
         A held formation is the point of the dwell, but a wheel that
         moves and changes nothing at all reads as the page being stuck;
         this is the swarm's version of the camera drift the other
         instruments carry. Progress-locked, so REDUCED never sees it
         (draw is not called there) and a still reader gets a still frame. */
      const idle = Math.sin(p * 46 + i * 1.71) * 3.2 * ZS;
      const rx = a.rx + (b.rx - a.rx) * tt;
      const ry = a.ry + (b.ry - a.ry) * tt;
      chips[i].style.transform =
        'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' +
        (z + lift + idle).toFixed(1) + 'px)' +
        ' rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg)';
      chips[i].style.opacity = (a.o + (b.o - a.o) * tt).toFixed(3);
    }

    /* the flag only means something while the pipeline is on screen */
    rig.classList.toggle('is-pipe', k === 1 && g > 0.5 || k === 2 && g < 0.5);

    if (p < RUN_A) beat(0);
    else beat(Math.min(STATIONS - 1, Math.round(w)));
  }

  /* Parked on the book: the stillest true claim — all forty-eight,
     organised, none lost. */
  function park() {
    const B = FORMS[1];
    for (let i = 0; i < COUNT; i++) {
      const b = B[i];
      chips[i].style.transform =
        'translate3d(' + (b.x * W * XS).toFixed(1) + 'px,' + (b.y * H).toFixed(1) +
        'px,0px)';
      chips[i].style.opacity = '1';
    }
    if (pctEl) pctEl.textContent = '000';
    beat(1);
  }

  const remeasure = () => { measure(); if (REDUCED) park(); else draw(lastP); };
  if (typeof ResizeObserver === 'function') new ResizeObserver(remeasure).observe(view);
  else addEventListener('resize', remeasure, { passive: true });

  if (REDUCED) { park(); return; }

  onTrack(track, draw);
  onNear(track, (p, room) => {
    rig.style.setProperty('--px', room.px.toFixed(4));
    rig.style.setProperty('--py', room.py.toFixed(4));
    rig.style.setProperty('--lean', room.vel.toFixed(4));
  });
}
