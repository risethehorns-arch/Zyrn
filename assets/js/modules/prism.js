/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE PRISM   (services/crm.html)

   One record set, four faces. The prism turns and the same data is a
   table, a pipeline, a ledger, and the four guarantees that hold it
   together — then it turns one more quarter and the table has come back
   with somebody else's columns on it.

   That fifth station is the whole product. The objection to a custom
   system is that it is a bespoke thing, built once and then stranded, and
   no amount of copy answers it. A prism that returns to its first face
   with different fields and the SAME rules answers it in one move: the
   surface is configured, the guarantees are not.

   ── FIVE STATIONS, FOUR QUARTER-TURNS ───────────────────────────────
   Station n is `rotateY(-90n)`. Stations 0 and 4 are the same physical
   face, which is why the reconfiguration has somewhere to happen: the
   reader has already read that face once and will notice what changed.

   The turn dwells and then travels, rather than running at a constant
   rate — a prism that never stops is a carousel, and a carousel is
   decoration. Each face is still for most of its station.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, onNear, swapText, pad3, REDUCED } from './_track.js';

const STATIONS = 5;          // face 0, 1, 2, 3, and face 0 again

const BEATS = [
  ['00 — ONE RECORD SET',
   'A desk system for a real firm, running in production. What follows is the same data four times over — not four modules, four faces of one object, which is the difference between a product and a bundle.'],
  ['01 — THE BOOK',
   'Every listing the firm holds, with the reference numbers the rest of the business already uses. The desk does not invent its own identifiers, because a system that renames things is a system people keep a spreadsheet beside.'],
  ['02 — THE PIPELINE',
   'The same records as work in progress: qualified, viewing, closing. A file that has not moved in seven working days is flagged — working days, counted properly, because a Thursday-to-Sunday gap is not a stalled deal.'],
  ['03 — THE LEDGER',
   'Every change, who made it and when. Not an audit feature bolted on at the end; the log is how the desk answers "who changed the price", which is the question that actually gets asked.'],
  ['04 — THE RULES',
   'Four guarantees, enforced where the data is rather than in the browser. These are the whole argument for building rather than renting: a bought system will do what its vendor decided, and none of these four were their decision.'],
  ['05 — SOMEBODY ELSE&rsquo;S FIRM',
   'The same face, reconfigured. Fields leave, fields arrive, the vocabulary changes to the one that firm already speaks — and every guarantee behind it is untouched, because they were never properties of the fields.'],
  ['06 — INSTALLED, NOT SUBSCRIBED',
   'It runs on the firm&rsquo;s own hosting, against the firm&rsquo;s own data, with no seat count and nothing to renew. The handover is the source, and the exit is that there is nothing to exit from.'],
];

/* the score */
const HOLD_A = 0.075;                 // the first face, still
const TURN_A = 0.075, TURN_B = 0.885; // four quarter-turns
const DONE_A = 0.885;                 // installed

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

export function initPrism() {
  const sec   = document.getElementById('sigPrism');
  const rig   = document.getElementById('prs');
  const prism = document.getElementById('prsPrism');
  if (!sec || !rig || !prism) return;

  const track  = sec.querySelector('.sig__track');
  const stepEl = document.getElementById('prsStep');
  const noteEl = document.getElementById('prsNote');
  const pctEl  = document.getElementById('prsPct');
  const tbl    = document.getElementById('prsTbl');
  const srcEl  = document.getElementById('prsSrc');
  const keyEl  = document.getElementById('prsKey');
  const rows   = keyEl ? Array.prototype.slice.call(keyEl.children) : [];
  const faces  = Array.prototype.slice.call(prism.querySelectorAll('.prs__f'));
  const view   = sec.querySelector('.rig__view');

  /* ── THE FACE WIDTH IS WRITTEN HERE, IN PIXELS, AND THAT IS THE POINT ──
     It has to be a LENGTH: the faces and the prism both use it inside
     translateZ, which does not accept a percentage — and a percentage
     there does not degrade, it invalidates the whole transform. When the
     value lived in CSS as `min(<length>, 70%)` the prism silently stopped
     turning and all four faces stacked on top of each other.

     The 70% is the diagonal: a square prism halfway through a
     quarter-turn presents its corner, which is the face width times root
     two, so a face sized to the stage at rest spills over the key rail
     every time it moves. Measured on resize only. */
  function measure() {
    if (!view) return;
    const w = Math.min(view.clientHeight * 1.0, view.clientWidth * 0.70);
    if (w > 40) prism.style.setProperty('--prw', w.toFixed(1) + 'px');
  }
  measure();
  if (typeof ResizeObserver === 'function' && view) {
    new ResizeObserver(measure).observe(view);
  } else {
    addEventListener('resize', measure, { passive: true });
  }

  /* Counted off the face itself rather than typed into the key: add a
     column to the table and the rail follows it. The dropped column is
     not counted, because it is not there in the schema being shown. */
  if (keyEl) {
    const head = tbl && tbl.querySelector('.prs__hr');
    const live = head
      ? head.querySelectorAll('span:not([data-add])').length
      : 0;
    const t = keyEl.querySelector('[data-c="cols"]');
    if (t) t.textContent = String(live).padStart(2, '0');
  }

  let shown = -1;
  function beat(i) {
    if (i === shown) return;
    shown = i;
    swapText(stepEl, BEATS[i][0].replace(/&rsquo;/g, '’'));
    swapText(noteEl, BEATS[i][1].replace(/&rsquo;/g, '’'));
    const lit = i >= 1 && i <= 5 ? i - 1 : (i === 6 ? 5 : -1);
    rows.forEach((r, k) => r.classList.toggle('is-on', k === lit));
  }

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);

    /* Where the prism is, in stations. Dwell for the first third of each
       station, then travel — so a face is STILL while it is being read
       and the turn is a deliberate move between two readings, rather than
       a constant rotation that never lets anything settle. */
    const w = clamp01((p - TURN_A) / (TURN_B - TURN_A)) * (STATIONS - 1);
    const k = Math.min(STATIONS - 2, Math.floor(w));
    /* Dwell, then travel. The dwell was 34% of each station and the settle
       another 20, which left the prism completely still for more than half
       of every station — docs/rigmotion.py measured 17 of 40 sampled
       positions with nothing changing at all, and a 10% run of that is a
       whole viewport of scrolling that does nothing. A face still needs to
       be STILL while it is read, so the dwell shrank rather than went. */
    const g = clamp01((w - k - 0.20) / 0.70);
    const station = k + g * g * (3 - 2 * g);

    /* A sway of under two degrees, driven by the track rather than by the
       station, so the prism is never absolutely parked. It is the same
       idea as the stack's drift: an object holding still and an object
       that has stopped existing look identical in a screenshot and quite
       different to someone scrolling. */
    const sway = 1.7 * Math.sin(p * Math.PI * 3.0);
    prism.style.setProperty('--spin', (-90 * station + sway).toFixed(3) + 'deg');
    /* a tilt that opens as it turns, so the prism reads as an object with
       a top rather than as four flat cards swapping places */
    prism.style.setProperty('--rx',
      (3 + 3 * Math.sin(station * Math.PI / 2) + 0.6 * Math.cos(p * Math.PI * 4)).toFixed(2) + 'deg');

    /* ── INNER PARALLAX ─────────────────────────────────────────────
       How far the turn is off a settled face, -0.5..0.5. The rows on the
       front face shift by a multiple of it, which gives the face depth it
       cannot get from Z — `overflow:hidden` flattens a preserve-3d
       subtree and the face has to clip. */
    const off = station - Math.round(station);
    if (tbl) tbl.style.setProperty('--pl', (off * 34).toFixed(2) + 'px');

    /* which face the reader is actually looking at */
    const front = Math.round(station) % 4;
    faces.forEach((f, i) => f.classList.toggle('is-front', i === front));

    /* The reconfiguration happens DURING the last turn, not after it —
       the face arrives already changed, which is what makes the return to
       face 0 read as a different firm rather than as an edit. */
    if (tbl) {
      const alt = station > 3.34;
      tbl.classList.toggle('is-alt', alt);
      if (srcEl) {
        const s = alt ? 'SCHEMA — SECOND FIRM' : 'SCHEMA — AS INSTALLED';
        if (srcEl.textContent !== s) srcEl.textContent = s;
      }
    }

    /* The readout follows the PRISM, not the raw progress — same reason as
       the fold: two numbers for one position drift apart for most of every
       station, and the face on screen is the one that has to be named. */
    if (p < HOLD_A) beat(0);
    else if (p >= DONE_A) beat(6);
    else beat(1 + Math.min(STATIONS - 1, Math.round(station)));
  }

  if (REDUCED) {
    /* Parked on the rules. Of the four faces it is the one that is an
       argument rather than a picture, and it is legible standing still. */
    prism.style.setProperty('--spin', '-270deg');
    prism.style.setProperty('--rx', '3deg');
    faces.forEach((f, i) => f.classList.toggle('is-front', i === 3));
    if (pctEl) pctEl.textContent = '000';
    beat(4);
    return;
  }
  onTrack(track, draw);
  /* ── THE ROOM ────────────────────────────────────────────────────
     Runs every frame while the section is near, whether or not the page
     moved — the lean has to keep easing while the reader holds still,
     which is exactly when a progress-only callback stops being called. */
  onNear(track, (p, room) => {
    const live = 1;
    prism.style.setProperty('--px', (room.px * live).toFixed(4));
    prism.style.setProperty('--py', (room.py * live).toFixed(4));
    prism.style.setProperty('--lean', (room.vel * live).toFixed(4));
  });
}
