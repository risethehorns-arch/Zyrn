/* ══════════════════════════════════════════════════════════════════════
   ZYRN — mobile navigation

   Below 900px the nav link row is hidden, which left Work, Foundation,
   System, Services and Contact reachable only from the footer. On a phone
   that is most of the site behind a scroll to the bottom.

   Nothing here is authored twice. Both lists are CLONED out of markup that
   already exists on every page:

     the top level  ← .nav__links
     the four lines ← the footer's "Lines" column

   Their hrefs already differ by directory depth (`#sys-03` at the root,
   `../index.html#sys-03` inside services/), and a clone inherits whatever
   the page it is on had. So there is no second copy of the routing to
   drift out of sync — which is the whole reason this file does not simply
   hard-code a menu.

   The Services row is a DISCLOSURE: the label navigates to the index, the
   chevron beside it expands the four lines in place. Two separate targets,
   both over 44px, because a row that either navigates or expands depending
   on where your thumb lands is a coin toss on touch.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var row = document.querySelector('.nav__links');
  var nav = document.querySelector('.nav');
  if (!row || !nav) return;

  var links = Array.prototype.slice.call(row.querySelectorAll('a'));
  if (!links.length) return;

  /* the four service lines, taken from the footer column that already
     carries them with this page's own relative paths */
  var lines = (function () {
    var cols = document.querySelectorAll('.sitefoot__cols .fcol');
    for (var i = 0; i < cols.length; i++) {
      var h = cols[i].querySelector('.fcol__h');
      if (h && /lines/i.test(h.textContent || '')) {
        return Array.prototype.slice.call(cols[i].querySelectorAll('a'));
      }
    }
    return [];
  })();

  // strip the superscript counter; it is nav chrome, not a label
  var clean = function (el) {
    return (el.textContent || '').replace(/\s*\d+\s*$/, '').trim();
  };

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

  /* A phone has no ⌘K. cmdk.js listens for [data-cmdk] on document, so the
     sheet can offer the index without either file importing the other. */
  var find = document.createElement('a');
  find.href = '#';
  find.setAttribute('data-cmdk', '');
  find.className = 'navsheet__find';
  find.innerHTML = '<span class="mono navsheet__i">/</span>Search the site';
  list.appendChild(find);

  var group = null;          // the Services disclosure, if this page has one

  links.forEach(function (a, i) {
    var c = document.createElement('a');
    c.href = a.getAttribute('href');
    c.innerHTML = '<span class="mono navsheet__i">' +
      String(i + 1).padStart(2, '0') + '</span>' + clean(a);
    if (a.hasAttribute('aria-current')) c.setAttribute('aria-current', 'page');

    var isServices = /services\.html(?:[?#]|$)/.test(a.getAttribute('href') || '');
    if (!isServices || !lines.length) { list.appendChild(c); return; }

    /* ── the disclosure ──────────────────────────────────────────── */
    group = document.createElement('div');
    group.className = 'navsheet__group';
    group.setAttribute('data-open', 'false');

    var head = document.createElement('div');
    head.className = 'navsheet__row';

    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'navsheet__more';
    more.setAttribute('aria-expanded', 'false');
    more.setAttribute('aria-controls', 'navsheet-lines');
    more.setAttribute('aria-label', 'Show the four service lines');
    more.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

    head.appendChild(c);
    head.appendChild(more);

    var sub = document.createElement('div');
    sub.className = 'navsheet__sub';
    sub.id = 'navsheet-lines';

    lines.forEach(function (l) {
      var s = document.createElement('a');
      s.href = l.getAttribute('href');
      var idx = l.querySelector('.mono');
      s.innerHTML = '<span class="mono navsheet__i">' +
        (idx ? idx.textContent.trim() : '') + '</span>' +
        (l.textContent || '').replace(/^\s*\d+\s*/, '').trim();
      if (l.hasAttribute('aria-current')) s.setAttribute('aria-current', 'page');
      sub.appendChild(s);
    });

    group.appendChild(head);
    group.appendChild(sub);
    list.appendChild(group);

    more.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();          // the list closes the sheet on any <a>
      var next = group.getAttribute('data-open') !== 'true';
      group.setAttribute('data-open', String(next));
      more.setAttribute('aria-expanded', String(next));
      more.setAttribute('aria-label',
        next ? 'Hide the four service lines' : 'Show the four service lines');
    });
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
  var main = document.querySelector('main');

  function set(next) {
    if (next === open) return;
    open = next;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.classList.toggle('is-open', open);
    document.body.classList.toggle('is-navopen', open);

    /* The sheet covers the page, so the page behind it should not still be
       tabbable. `main`, not `.shell`: the toggle lives outside main, and
       making its own ancestor inert would leave no way to close this. */
    if (main) {
      if (open) main.setAttribute('inert', '');
      else main.removeAttribute('inert');
    }

    if (open) {
      /* The sheet starts below the bar rather than at inset:0, so the X in
         the bar stays tappable. Measure rather than hard-code 76px: the row
         is padding + whatever its tallest child happens to be, and that has
         already changed once. */
      document.documentElement.style.setProperty(
        '--navh', Math.round(nav.getBoundingClientRect().height) + 'px');
      sheet.hidden = false;
      /* The sheet is display:none while hidden (see the [hidden] rule in
         styles.css — without it this fixed overlay ate every tap on the
         phone). Going none -> flex and adding the class in the same task
         would give the transition no start state to move from, so read a
         layout property first: that forces the style flush, and the
         opacity/stagger then animate from 0 rather than snapping on. */
      void sheet.offsetHeight;
      requestAnimationFrame(function () {
        sheet.classList.add('is-on');
        var first = list.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      });
    } else {
      sheet.classList.remove('is-on');
      // collapse the disclosure, so reopening starts from the same state
      if (group) {
        group.setAttribute('data-open', 'false');
        var m = group.querySelector('.navsheet__more');
        if (m) m.setAttribute('aria-expanded', 'false');
      }
      setTimeout(function () { if (!open) sheet.hidden = true; }, 320);
      btn.focus({ preventScroll: true });
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
    if (!open) return;
    if (window.innerWidth >= 900) { set(false); return; }
    // rotation changes the bar's height; the sheet's offset has to follow
    document.documentElement.style.setProperty(
      '--navh', Math.round(nav.getBoundingClientRect().height) + 'px');
  }, { passive: true });
})();
