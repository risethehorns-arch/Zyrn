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
     RETIRED. v1.0 dropped an obsidian veil over the viewport and navigated
     behind it, which reads as two documents handing off. field.js now owns
     navigation instead: it morphs the field to whatever formation the
     destination opens on, fades the CONTENT only, and the incoming page
     builds its particles already settled in that formation. The bed never
     blinks, so the pages read as one surface.

     Links that field.js does not claim (external, mailto, downloads, and
     any page without a field) fall through to the browser untouched. */


  /* ── 3 · video that only exists when it is being looked at ───────
     Two videos on the landing page, the Lumina and THEHUB cards, and each
     is one continuous take of that client's live HOME PAGE being scrolled
     top to bottom. The landing page also spends its GPU on a 90,000-point
     field measured at 2.78ms a frame, so the cards cost nothing until they
     are needed:

       · `preload="none"` in the markup, so the bytes are not in the load
         at all. This observer upgrades them, and only on approach.
       · with a real mouse, approach only LOADS. The card stays on its
         poster, which is the top of that home page, and the scroll plays
         while the pointer (or keyboard focus) is on the card. It pauses
         the moment it leaves and rewinds, under a short fade, to the top
         of the page, so every hover is the same tour.
       · without hover (phones, tablets) there is nothing to wait for, so
         it plays on approach instead, as the cards always did.
       · paused whenever it leaves the viewport, whatever started it.
       · `prefers-reduced-motion` and Save-Data never start it. The poster
         is a real frame of the same take, so the card is complete standing
         still — it does not degrade to a gap.

     The rail on the right of the frame is the take's playhead, drawn as a
     scrollbar because that is what it stands for. Moved by transform, on
     rAF, and only while the video is playing.

     The play() promise is caught rather than ignored: a browser that
     refuses autoplay rejects it, and an uncaught rejection would print an
     error on a page whose whole argument is that its console is clean. */
  function setupVideos() {
    var vids = document.querySelectorAll('video[data-vid]');
    if (!vids.length || !('IntersectionObserver' in window)) return;

    var conn = navigator.connection;
    if (reduced || (conn && conn.saveData)) return;

    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');

    function load(v) {
      if (v.getAttribute('preload') !== 'auto') {
        v.setAttribute('preload', 'auto');
        v.load();
      }
    }
    function play(v) {
      load(v);
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }

    // the playhead: one rAF loop per video, alive only while it plays
    function rail(v) {
      var card = v.closest('.proof__card');
      var thumb = card && card.querySelector('.proof__rail i');
      if (!thumb) return;
      var raf = 0;
      function tick() {
        var d = v.duration;
        if (d > 0) {
          // the thumb is 22% of the rail, so its travel is 78/22 of itself
          thumb.style.transform = 'translateY(' + (v.currentTime / d * 354.5).toFixed(1) + '%)';
        }
        raf = v.paused ? 0 : requestAnimationFrame(tick);
      }
      v.addEventListener('play', function () {
        card.classList.add('is-playing');
        if (!raf) raf = requestAnimationFrame(tick);
      });
      v.addEventListener('pause', function () {
        card.classList.remove('is-playing');
      });
    }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var v = entries[i].target;
        if (entries[i].isIntersecting) {
          v._seen = true;
          if (fine.matches && v._card) {
            load(v);
            if (v._hot) play(v);
          } else {
            play(v);
          }
        } else {
          v._seen = false;
          if (!v.paused) v.pause();
        }
      }
    }, { rootMargin: '200px 0px', threshold: 0.12 });

    Array.prototype.forEach.call(vids, function (v) {
      var card = v.closest('.proof__card');
      v._card = card;
      rail(v);
      if (card) {
        card.classList.add('has-scroll');
        var on = function () {
          v._hot = true;
          card.classList.remove('is-rewind');
          if (fine.matches && v._seen) play(v);
        };
        // Leaving puts the card back at the top of the home page, under a
        // short fade, so every hover is the same tour from the hero down and
        // the idle card never sits on whatever frame the pointer left it on
        // (THEHUB's hero fades out as its pin ends, and a card parked there
        // reads as a broken video).
        var off = function () {
          v._hot = false;
          if (!fine.matches) return;
          if (!v.paused) v.pause();
          if (v.currentTime > 0.05) {
            card.classList.add('is-rewind');
            clearTimeout(v._rw);
            v._rw = setTimeout(function () {
              if (v._hot) { card.classList.remove('is-rewind'); return; }
              v.currentTime = 0;
            }, 260);
          }
        };
        v.addEventListener('seeked', function () {
          if (v.currentTime < 0.05) {
            card.classList.remove('is-rewind');
            var th = card.querySelector('.proof__rail i');
            if (th) th.style.transform = '';
          }
        });
        card.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') on(); });
        card.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') off(); });
        card.addEventListener('focusin', on);
        card.addEventListener('focusout', function (e) {
          if (!card.contains(e.relatedTarget)) off();
        });
      }
      io.observe(v);
    });
  }

  setupVideos();

})();
