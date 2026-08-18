/* ══════════════════════════════════════════════════════════════════════
   ZYRN — SYS.00 · THE ENTRANCE (landing page only)

   The mark assembles in the centre of the viewport, inside the hole of the
   S3 CORE ring the hero opens on, gets cut by the Pulse line, glitches,
   and then flies into its real position in the hero lockup.

   Timings mirror assets/css/intro.css. Change one, change both.

     0      halves leave the left and right edges
     460    they meet, ALIGNED — the mark is whole but uncut
     500    only now does the Pulse line start its sweep in from the right
     820    the line lands and the halves shear apart around it
     1120   the glitch fires on the finished mark
     1500   HOLD ends — the centred composition has had time to read
     1500   FLIP into the hero lockup, page fades up underneath
     2340   done

   Three things it refuses to run for:
     · prefers-reduced-motion
     · arriving from another page (field.js's continuity handoff owns that
       navigation, and two transitions fighting looks broken)
     · a repeat visit within the session

   And a 4s failsafe: if any step goes missing the page is revealed anyway.
   The content is only ever hidden by a class this file adds, so a failure
   to boot at all leaves the page perfectly readable.
   ══════════════════════════════════════════════════════════════════════ */

const T = {
  glitch: 1120,
  hold:   1500,   // when the FLIP to the hero begins
  flip:    760,   // its duration, matching intro.css
  bedWait: 1800,  // longest we will wait for the field before starting anyway
};

const SEEN_KEY = 'zyrn:seen-intro';

export function initIntro(opts = {}) {
  const intro = document.getElementById('intro');
  const stage = intro && intro.querySelector('.intro__stage');
  const mark  = document.getElementById('introMark');
  const hero  = document.getElementById('heroMark');
  if (!intro || !stage || !mark) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // peek, never consume — field.js reads and clears this a moment later
  const arriving = !!sessionStorage.getItem('zyrn:handoff');
  const repeat = sessionStorage.getItem(SEEN_KEY) === '1';

  if (reduced || arriving || repeat) { intro.remove(); return; }
  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}

  document.body.classList.add('is-intro');

  let finished = false;
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  /* ── the hand-off: measure both marks, then fly one onto the other ── */
  function flip() {
    if (finished) return;
    // reveal the page underneath first, so the mark lands on a live page
    document.body.classList.remove('is-intro');

    if (!hero || opts.flip === false) { at(420, done); return; }

    const a = mark.getBoundingClientRect();
    const b = hero.getBoundingClientRect();
    if (!a.height || !b.height) { done(); return; }

    // scale by height rather than width: the sheared halves make the width
    // ambiguous, the cap height does not
    const s = b.height / a.height;
    stage.style.transformOrigin = 'top left';
    intro.classList.add('is-flip');
    // next frame, so the transition has a start value to animate from
    requestAnimationFrame(() => {
      stage.style.transform =
        `translate3d(${(b.left - a.left).toFixed(1)}px, ${(b.top - a.top).toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
    });
    at(T.flip + 80, done);
  }

  function done() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    document.body.classList.remove('is-intro');
    intro.classList.add('is-done');
    setTimeout(() => intro.remove(), 240);
  }

  /* skipping is not a nicety — the second visit in a session is muscle
     memory, and an entrance you cannot get past is an obstacle */
  const skip = () => {
    if (finished) return;
    timers.forEach(clearTimeout);
    done();
  };
  ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(ev =>
    addEventListener(ev, skip, { once: true, passive: true }));

  /* ── run ──────────────────────────────────────────────────────────
     Wait for the bed before starting. The field boots behind three dynamic
     imports, which on a phone is a second or more — starting immediately
     meant the mark assembled into a black screen instead of into the ring
     it is supposed to land inside. Capped, because a field that never
     arrives must not hold the entrance hostage. */
  function run() {
    if (finished || intro.classList.contains('is-run')) return;
    requestAnimationFrame(() => intro.classList.add('is-run'));
    at(T.glitch, () => {
      const g = document.getElementById('introGlitch');
      if (!g) return;
      g.classList.add('is-glitching');
      at(320, () => g.classList.remove('is-glitching'));
    });
    at(T.hold, flip);
    at(4000, done);                      // failsafe
  }

  if (document.body.classList.contains('is-field-ready')) {
    run();
  } else {
    const mo = new MutationObserver(() => {
      if (!document.body.classList.contains('is-field-ready')) return;
      mo.disconnect();
      run();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { mo.disconnect(); run(); }, T.bedWait);
  }

}
