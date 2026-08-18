/* ══════════════════════════════════════════════════════════════════════
   ZYRN — site footer runtime

   Two things, both of them real information rather than decoration:

     · a live Amman clock. Computed in Asia/Amman regardless of where the
       visitor is, so it says something true about the firm rather than
       echoing the reader's own system clock back at them.
     · the wordmark shears as the footer comes into view — the last thing
       the site does, and the same law it opened on.

   The clock ticks on a one-second interval and stops while the tab is
   hidden. It is one text write per second against a 90k particle
   simulation; anything cleverer would be self-indulgent.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── the clock ─────────────────────────────────────────────────── */
  var el = document.getElementById('footClock');
  var timer = null;
  var fmt = null;

  if (el && window.Intl && Intl.DateTimeFormat) {
    try {
      fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Amman',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    } catch (e) {
      fmt = null;                       // no tz database — leave the dashes
    }
  }

  function tick() {
    if (!fmt || !el) return;
    el.textContent = fmt.format(new Date());
  }

  function start() {
    if (timer || !fmt) return;
    tick();
    timer = setInterval(tick, 1000);
  }
  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  start();
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  /* ── the mark shears on arrival ────────────────────────────────── */
  var mark = document.getElementById('footMark');
  if (mark) {
    if (reduced || !('IntersectionObserver' in window)) {
      mark.classList.add('is-sheared');
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.disconnect();
          setTimeout(function () { mark.classList.add('is-sheared'); }, 200);
        });
      }, { threshold: 0.4 });
      io.observe(mark);
    }
  }
})();
