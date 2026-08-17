/* ══════════════════════════════════════════════════════════════════════
   ZYRN — DOM runtime

   Everything that is NOT the particle field:
     1. scroll → readout rail  (3-digit percentage + fill)
     2. reveals                (IntersectionObserver, with a scroll-past net)
     3. the shear              (nav + hero, self-shearing and one-way)

   The hero mark used to be scroll-bound: its halves were driven apart by
   inline transforms written here every frame, so at the top of the page it
   sat aligned while the nav mark was already sheared. The two marks read as
   two different logos. Both now use the same component — .shear--auto plus
   .is-sheared — so they are identical by construction, not by coincidence.
   The shear law is unchanged: it happens once and never comes back.

   The bed used to live here too: v1.0 scrubbed a video through a frame
   cache from this file. That is gone — the bed is now assets/js/field.js,
   a GPGPU particle simulation with no asset behind it. This file no longer
   touches a canvas, a video element, or a decoder.

   Smoothing is exponential and time-based: alpha = 1 - exp(-k·dt). The
   spec's "lerp 0.08" was a per-frame factor that assumed 60Hz; k = 5/s
   reproduces that settle exactly at 60Hz and is identical on 30/120/144Hz.

   Native scrolling is never hijacked here. field.js layers Lenis on top,
   which still moves the real scroll position, so window.scrollY below stays
   correct and find-in-page and accessibility are unaffected.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CONFIG = {
    scrubK:    5,        // 1/s — equals the spec's 0.08/frame at 60Hz
    shearAt:   300       // ms after load; the same beat for both marks
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var marks = [
    document.getElementById('navMark'),
    document.getElementById('heroMark')
  ];

  var pctEl  = document.getElementById('readoutPct');
  var fillEl = document.getElementById('readoutFill');

  var smoothed = 0;

  var lastTime    = 0;
  var lastScrollY = -1;
  var lastPct     = -1;
  var lastFillOn  = null;

  var io = null;
  var pending = null;


  /* ── reveals ─────────────────────────────────────────────────────── */

  function setupReveals() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;
    if (reduced) { els.forEach(reveal); return; }

    els.forEach(function (el) {
      el.style.transitionDelay = (el.dataset.rdelay || 0) + 'ms';
    });

    pending = new Set(els);

    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        // reveal on entry, or if it scrolled past above the fold
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) reveal(e.target);
      });
    }, { threshold: 0.15 });

    els.forEach(function (el) { io.observe(el); });
  }

  function reveal(el) {
    el.classList.add('is-in');
    if (el.hasAttribute('data-kinetic')) el.classList.add('is-kin');
    if (io) io.unobserve(el);
    if (pending) pending.delete(el);
  }


  /* ── kinetic headlines ───────────────────────────────────────────
     Splits [data-kinetic] into per-word spans so a headline arrives word by
     word instead of as one block. Walks child nodes rather than touching
     innerHTML, so <br> and nested markup survive. Runs before reveals so the
     observer sees the finished element. */

  function setupKinetic() {
    var els = document.querySelectorAll('[data-kinetic]');
    for (var i = 0; i < els.length; i++) split(els[i]);
  }

  function split(el) {
    var idx = 0;
    var walk = function (node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (n) {
        if (n.nodeType === 3) {                       // text
          var parts = n.textContent.split(/(\s+)/);
          if (!n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (w) {
            if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; }
            var sp = document.createElement('span');
            sp.className = 'kin';
            sp.style.transitionDelay = (idx++ * 55) + 'ms';
            sp.textContent = w;
            frag.appendChild(sp);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(el);
    if (reduced) el.classList.add('is-kin');
  }


  /* ── section index rail ──────────────────────────────────────────
     Lights the entry whose section owns the middle of the viewport. A
     rootMargin band rather than a threshold, so tall and short sections
     behave the same. */

  function setupSysNav() {
    var rail = document.querySelector('.sysnav');
    if (!rail) return;
    var secs = document.querySelectorAll('[data-sys-section]');
    if (!secs.length) return;

    var sysIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var on = rail.querySelector('.is-on');
        if (on) on.classList.remove('is-on');
        var next = rail.querySelector('[data-sys="' + e.target.dataset.sysSection + '"]');
        if (next) next.classList.add('is-on');
      });
    }, { rootMargin: '-45% 0px -45% 0px' });

    for (var i = 0; i < secs.length; i++) sysIO.observe(secs[i]);
  }


  /* ── the shear · both marks, one beat ────────────────────────────
     One-way by construction: nothing ever removes .is-sheared. */

  function shearMarks() {
    var apply = function () {
      for (var i = 0; i < marks.length; i++) {
        if (marks[i]) marks[i].classList.add('is-sheared');
      }
    };
    if (reduced) { apply(); return; }      // render statically at progress 1
    setTimeout(apply, CONFIG.shearAt);
  }


  /* ── loop ────────────────────────────────────────────────────────── */

  function alphaFor(k, dt) { return 1 - Math.exp(-k * dt); }

  var rafPending = false;

  function schedule() {
    if (rafPending) return;          // never let two rAF chains run in parallel
    rafPending = true;
    requestAnimationFrame(tick);
  }

  function tick(now) {
    rafPending = false;
    if (document.hidden) { lastTime = 0; return; }   // park; visibilitychange restarts

    var dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 1 / 60;
    lastTime = now;

    var doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    var y   = window.scrollY;
    var target = Math.min(1, Math.max(0, y / max));

    smoothed += (target - smoothed) * alphaFor(CONFIG.scrubK, dt);
    if (Math.abs(target - smoothed) < 0.0005) smoothed = target;

    var pct = Math.round(smoothed * 100);
    if (pctEl && pct !== lastPct) {
      pctEl.textContent = String(pct).padStart(3, '0');
      lastPct = pct;
    }
    if (fillEl) {
      fillEl.style.transform = 'scaleY(' + smoothed.toFixed(4) + ')';
      var on = smoothed > 0.02;
      if (on !== lastFillOn) { fillEl.style.opacity = on ? '1' : '0'; lastFillOn = on; }
    }

    // catch anything the observer missed on a fast scroll past
    if (pending && pending.size && y !== lastScrollY) {
      pending.forEach(function (el) {
        if (el.getBoundingClientRect().bottom < 0) reveal(el);
      });
    }
    lastScrollY = y;

    schedule();
  }


  /* ── boot ────────────────────────────────────────────────────────── */

  setupKinetic();          // before reveals: the observer must see final markup
  setupReveals();
  shearMarks();
  setupSysNav();

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) schedule();
  });
  schedule();
})();
