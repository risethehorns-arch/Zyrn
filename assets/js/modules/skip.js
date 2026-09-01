/* ══════════════════════════════════════════════════════════════════════
   SKIP THE SCROLL EXPERIENCE

   Every signature instrument on this site pins a stage and holds the
   reader for six to twelve viewport heights. That is the point of them —
   but only for a reader who wants it. Someone who arrived for the pricing
   and met a 1200vh rack has no way out except to keep wheeling, and a
   scroll section you cannot leave stops being immersive and becomes a
   toll booth.

   So each one carries one control: a pill that appears while the track is
   on screen and puts you past it. It is not a decoration and it is not a
   hint — it does exactly what it says, and it says exactly what it does.

   ── WHY IT IS INJECTED RATHER THAN AUTHORED ────────────────────────
   Nine tracks across six pages. Hand-writing the same button nine times
   is nine chances for one of them to drift, and the class of bug that
   produces — a control that exists on eight pages and silently does
   nothing on the ninth — is exactly what this site has been bitten by
   before. One module, one definition, every track.

   ── AND WHY IT USES THE SITE'S OWN SCROLLER ────────────────────────
   `html { scroll-behavior }` is `auto` on this site, deliberately: a
   browser-owned smooth scroll cancels and restarts on every call and
   swallows programmatic movement. Lenis owns scrolling, and `field.js`
   publishes `window.__zyrnScrollTo` as the single door to it. Calling
   `window.scrollTo` here would jump instantly on a site whose entire
   argument is the quality of its scrolling.
   ══════════════════════════════════════════════════════════════════════ */

import { REDUCED } from './_track.js';

/* Every pinned track on the site. If you add an instrument with a new
   track class, add it here — a reader who cannot leave it is the defect
   this file exists to prevent. */
const TRACKS = '.sig__track,.rk__track,.wp__track,.rb__track,.in__track';

const ARROW =
  '<svg class="skip__a" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M12 4v15M5.5 12.5 12 19l6.5-6.5"/></svg>';

/** Distance from the document top, immune to transforms.
 *  `getBoundingClientRect` would include every reveal transform on the way
 *  up the tree, and this site has cost itself days to exactly that. */
function docTop(el) {
  let t = 0, n = el;
  while (n) { t += n.offsetTop; n = n.offsetParent; }
  return t;
}

export function initSkip() {
  const tracks = Array.prototype.slice.call(document.querySelectorAll(TRACKS));
  if (!tracks.length) return;

  tracks.forEach((track) => {
    /* The sticky stage is the track's own child — putting the control in
       the TRACK would send it scrolling away with the page, which is the
       one place a way out must never be. */
    const stage = track.firstElementChild;
    if (!stage) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'skip mono';
    btn.setAttribute('aria-label', 'Skip this scroll section and continue down the page');
    btn.innerHTML = '<span class="skip__l">SKIP SCROLL</span>' + ARROW;

    btn.addEventListener('click', () => {
      /* Land just past the pinned stretch, at the top of whatever comes
         next — not at the very end of the track, which is the same view
         the reader is already looking at. */
      const to = docTop(track) + track.offsetHeight - Math.round(innerHeight * 0.06);
      if (typeof window.__zyrnScrollTo === 'function') {
        window.__zyrnScrollTo(to, 900);
      } else {
        window.scrollTo({ top: to, behavior: REDUCED ? 'auto' : 'smooth' });
      }
    });

    stage.appendChild(btn);

    /* Visible only while the track is genuinely on screen. An always-on
       control is chrome; one that arrives with the section and leaves with
       it is part of the instrument. */
    if (typeof IntersectionObserver !== 'function') {
      btn.classList.add('is-on');
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) btn.classList.toggle('is-on', e.isIntersecting);
    }, { rootMargin: '-12% 0px -18% 0px' });
    io.observe(track);
  });
}
