/* SYS.00 · FOUNDATION ────────────────────────────────────────────────
   The quietest module on the site, on purpose. Two moments, each fired
   once, when the thing they belong to actually arrives on screen:

     · the founder's name shears — the same law the mark obeys, applied to
       the person, because that is the argument the page is making
     · a Pulse line runs across the credential row — the entrance's slice
       reused at a fraction of the volume

   No scroll pinning, no per-frame work. A page that insists on its own
   animation is working against whatever it is trying to say. */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

function once(el, cb, margin = '0px 0px -18% 0px') {
  if (!el) return;
  if (REDUCED) { cb(); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.disconnect();
      cb();
    }
  }, { rootMargin: margin, threshold: 0.2 });
  io.observe(el);
}

export function initFoundation() {
  /* The name obeys the mark's law. It must carry `shear--auto`: the
     `.is-sheared` rules in styles.css are scoped to that class, so adding
     the class to a bare `.shear` silently does nothing. */
  const name = document.getElementById('fndrName');
  once(name, () => {
    // a beat after it lands, so the shear reads as a decision rather than
    // as part of the reveal
    setTimeout(() => name.classList.add('is-sheared'), 260);
  });

  /* the credential row gets cut once */
  const creds = document.getElementById('creds');
  once(creds, () => setTimeout(() => creds.classList.add('is-cut'), 180));

  /* the one stance card that is the firm's own draws its hairline */
  document.querySelectorAll('.stance__c--is').forEach(el => once(el, () => el.classList.add('is-in')));
}
