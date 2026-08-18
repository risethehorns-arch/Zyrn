/* ══════════════════════════════════════════════════════════════════════
   ZYRN — mobile navigation

   Below 900px the nav link row is hidden, which left Work, Foundation,
   System, Brand and Contact reachable only from the footer. On a phone
   that is most of the site behind a scroll to the bottom.

   The menu is built by CLONING the existing .nav__links anchors rather
   than by duplicating markup on seven pages. Their hrefs already differ
   by directory depth (`#sys-03` at the root, `../index.html#sys-03`
   inside services/), and a clone inherits whatever each page had — so
   there is no second copy of the routing to drift out of sync.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var row = document.querySelector('.nav__links');
  var nav = document.querySelector('.nav');
  if (!row || !nav) return;

  var links = Array.prototype.slice.call(row.querySelectorAll('a'));
  if (!links.length) return;

  /* ── the trigger ─────────────────────────────────────────────────── */
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'navtoggle';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Open menu');
  btn.innerHTML = '<span class="navtoggle__b"></span><span class="navtoggle__b"></span>';

  /* ── the sheet ───────────────────────────────────────────────────── */
  var sheet = document.createElement('div');
  sheet.className = 'navsheet';
  sheet.hidden = true;

  var list = document.createElement('nav');
  list.className = 'navsheet__list';
  list.setAttribute('aria-label', 'Menu');

  links.forEach(function (a, i) {
    var c = document.createElement('a');
    c.href = a.getAttribute('href');
    // strip the superscript counter; it is nav chrome, not a label
    c.innerHTML = '<span class="mono navsheet__i">' +
      String(i + 1).padStart(2, '0') + '</span>' +
      (a.textContent || '').replace(/\s*\d+\s*$/, '').trim();
    if (a.hasAttribute('aria-current')) c.setAttribute('aria-current', 'page');
    list.appendChild(c);
  });

  var foot = document.createElement('div');
  foot.className = 'navsheet__foot mono';
  foot.innerHTML = '<span>AMM 31.95&deg;N / 35.93&deg;E</span><span>BY REFERRAL &mdash; 04 SEATS / Q3</span>';

  sheet.appendChild(list);
  sheet.appendChild(foot);

  var end = nav.querySelector('.nav__end') || nav.firstElementChild;
  if (end && end.parentNode) end.parentNode.insertBefore(btn, end);
  else nav.appendChild(btn);
  document.body.appendChild(sheet);

  /* ── open / close ────────────────────────────────────────────────── */
  var open = false;

  function set(next) {
    if (next === open) return;
    open = next;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.classList.toggle('is-open', open);
    document.body.classList.toggle('is-navopen', open);
    if (open) {
      sheet.hidden = false;
      // next frame so the transition has a start state
      requestAnimationFrame(function () { sheet.classList.add('is-on'); });
    } else {
      sheet.classList.remove('is-on');
      setTimeout(function () { if (!open) sheet.hidden = true; }, 320);
    }
  }

  btn.addEventListener('click', function () { set(!open); });

  // a link inside the sheet may be a same-page anchor, which fires no
  // navigation — close on any activation rather than trusting unload
  list.addEventListener('click', function (e) {
    if (e.target.closest('a')) set(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) set(false);
  });

  // rotating past the breakpoint should not strand an open sheet
  window.addEventListener('resize', function () {
    if (open && window.innerWidth >= 900) set(false);
  }, { passive: true });
})();
