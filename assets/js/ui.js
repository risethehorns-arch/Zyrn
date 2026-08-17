/* ══════════════════════════════════════════════════════════════════════
   ZYRN — shared UI runtime (every page)

   1. glitch scheduling — irregular, never metronomic
   2. page transitions  — the obsidian ground holds while content swaps

   Loaded on the landing page and every service page. Independent of
   main.js, which owns the landing page's scroll systems.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ── 1 · the glitch ──────────────────────────────────────────────
     A fixed CSS interval reads as a metronome. Real signal artefacts
     cluster: mostly quiet, then two or three in quick succession. Each
     mark keeps its own randomised schedule.

     Two intensities. A `micro` is a 130ms twitch — chroma and a small
     kick, no slices. A full burst adds two cloned ghosts, clipped into
     bands and thrown sideways.

     The clones are made AT FIRE TIME, not at init, so they snapshot the
     mark's current shear state — the hero's halves carry inline transforms
     written by main.js, and a stale clone would glitch an un-sheared
     wordmark over a sheared one. ids are stripped so the duplicate never
     collides with #navMark / #heroMark. */

  var GHOSTS = 2;

  function makeGhosts(el) {
    var src = el.querySelector('.shear');
    if (!src) return [];
    var out = [];
    for (var i = 0; i < GHOSTS; i++) {
      var g = document.createElement('span');
      g.className = 'glitch__ghost glitch__ghost--' + (i === 0 ? 'a' : 'b');
      g.setAttribute('aria-hidden', 'true');
      var clone = src.cloneNode(true);
      clone.removeAttribute('id');
      Array.prototype.forEach.call(clone.querySelectorAll('[id]'), function (n) {
        n.removeAttribute('id');
      });
      g.appendChild(clone);
      // an absolutely-positioned clone does not land where an inline-block
      // original sits on the baseline — measure rather than assume, or every
      // slice arrives with a vertical offset the keyframes never asked for
      g.style.left = src.offsetLeft + 'px';
      g.style.top  = src.offsetTop + 'px';
      el.appendChild(g);
      out.push(g);
    }
    return out;
  }

  function scheduleGlitch(el) {
    var burstLeft = 0;

    function fire() {
      // never glitch a mark that isn't on screen — an effect nobody sees
      // that still costs a composite
      if (!document.hidden && isVisible(el)) {
        var micro = Math.random() < 0.42;
        var cls = micro ? 'is-glitching--micro' : 'is-glitching';
        var ghosts = micro ? [] : makeGhosts(el);
        el.classList.add(cls);
        setTimeout(function () {
          el.classList.remove(cls);
          for (var i = 0; i < ghosts.length; i++) {
            if (ghosts[i].parentNode) ghosts[i].parentNode.removeChild(ghosts[i]);
          }
        }, micro ? 150 : 320);
      }
      next();
    }

    function next() {
      var delay;
      if (burstLeft > 0) {
        burstLeft--;
        delay = 110 + Math.random() * 240;          // stutter inside a burst
      } else {
        delay = 1800 + Math.random() * 3400;        // quiet stretch
        var r = Math.random();
        if (r < 0.22) burstLeft = 2;                // occasional triple
        else if (r < 0.62) burstLeft = 1;           // frequent double
      }
      setTimeout(fire, delay);
    }

    next();
  }

  function isVisible(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  if (!reduced) {
    Array.prototype.forEach.call(document.querySelectorAll('.glitch'), scheduleGlitch);
  }


  /* ── 2 · page transitions ────────────────────────────────────────
     Fade the obsidian veil up, then navigate. Because every page shares
     the same ground colour and the same fixed video bed, the swap reads
     as one continuous surface rather than two documents. */

  var veil = document.createElement('div');
  veil.className = 'veil-swap';
  document.body.appendChild(veil);

  function isInternal(a) {
    if (!a || !a.getAttribute) return false;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return false;
    if (/^(mailto:|tel:|https?:)/i.test(href) && a.host !== location.host) return false;
    if (a.target === '_blank' || a.hasAttribute('download')) return false;
    return /\.html?($|[?#])/.test(href) || href.indexOf('/') === 0;
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var a = e.target.closest ? e.target.closest('a') : null;
    if (!isInternal(a)) return;

    var href = a.getAttribute('href');
    if (reduced) return;                 // let the browser navigate normally

    e.preventDefault();
    document.documentElement.classList.add('is-leaving');
    setTimeout(function () { location.href = href; }, 380);
  });

  // Returning via the back button restores from bfcache with the veil still
  // up — clear it so the page isn't left behind a black sheet.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) document.documentElement.classList.remove('is-leaving');
  });
})();
