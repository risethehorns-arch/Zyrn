/* ══════════════════════════════════════════════════════════════════════
   ZYRN — THE INDEX  (⌘K)

   Eight pages, five landing scenes and four service lines. The nav can
   hold five slots and the footer holds the rest, which means most of the
   site is two clicks and a scroll away from anywhere. This is the direct
   route: one keystroke, type three letters, arrive.

   Two things make it belong to this site rather than to every SaaS app
   that ships a command palette:

   1. Every result is a REAL anchor in the DOM. field.js owns internal
      links — it morphs the bed to whatever formation the destination
      opens on before navigating — and it listens on document. A synthetic
      location.href assignment would skip all of that and the palette would
      be the one place on the site where navigation blinks.

   2. The result rows are set as metadata: index, label, route. Doctrine
      rule 2 — the only ornament is real information.

   It is not hidden behind a keystroke: the nav carries a visible trigger,
   and on a phone (where there is no ⌘K) it is the first item in the menu
   sheet.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  /* Pages live at the root and in /services/. One prefix, computed once,
     rather than a second copy of the routing table per directory. */
  var UP = /\/services\//.test(location.pathname) ? '../' : '';

  var ITEMS = [
    { k: 'SYS.01', l: 'Home',                 h: UP + 'index.html',                        t: 'Landing',  q: 'home landing hero start' },
    { k: 'SYS.00', l: 'Foundation',           h: UP + 'foundation.html',                   t: 'The firm', q: 'about founder mission story yazan tarawneh who' },
    { k: 'SYS.03', l: 'Service lines',        h: UP + 'services.html',                     t: 'Index',    q: 'services offering what we do lines four' },
    { k: '01',     l: 'Website design',       h: UP + 'services/website-design.html',      t: 'Line',     q: 'web site surface build performance' },
    { k: '02',     l: 'Brand kit',            h: UP + 'services/brand-kit.html',           t: 'Line',     q: 'identity palette type logo motion voice' },
    { k: '03',     l: 'Business structuring', h: UP + 'services/business-structuring.html',t: 'Line',     q: 'org decision rights authority incentives operating model' },
    { k: '04',     l: 'AI adoption',          h: UP + 'services/ai-transformation.html',   t: 'Line',     q: 'ai artificial intelligence transformation workflow governance' },
    { k: 'SYS.06', l: 'The brand kit',        h: UP + 'brand.html',                        t: 'Method',   q: 'brand kit tokens colours type spec documentation how we present deliverable handover' },
    { k: 'SYS.07', l: 'Lumina — a case',      h: UP + 'lumina.html',                       t: 'Work',     q: 'lumina case study proof work client real estate amman example portfolio rebase' },
    { k: 'SYS.08', l: 'Duk — the agent',       h: UP + 'duk.html',                          t: 'Product',  q: 'duk ai agent open source artificial intelligence assistant brainstorm build in production' },
    { k: 'SYS.02', l: 'Capability',           h: UP + 'index.html#sys-02',                 t: 'Scene',    q: 'capability what zyrn does' },
    { k: 'SYS.04', l: 'Readiness index',      h: UP + 'index.html#sys-04',                 t: 'Scene',    q: 'readiness index level assessment maturity' },
    { k: 'SYS.05', l: 'Access',               h: UP + 'index.html#sys-05',                 t: 'Scene',    q: 'contact access request referral seats intake' },
    { k: '→',      l: 'Request access',       h: 'mailto:access@zyrn.org?subject=Request%20access%20%E2%80%94%20Q3%202026', t: 'Action', q: 'email contact mail request access apply' },
  ];

  /* ── the shell ─────────────────────────────────────────────────── */
  var wrap = document.createElement('div');
  wrap.className = 'cmdk';
  wrap.hidden = true;
  wrap.innerHTML =
    '<div class="cmdk__scrim"></div>' +
    '<div class="cmdk__panel" role="dialog" aria-modal="true" aria-label="Index">' +
      '<div class="cmdk__bar">' +
        '<span class="mono cmdk__sig" aria-hidden="true">ZYRN /</span>' +
        '<input class="cmdk__in" type="text" autocomplete="off" spellcheck="false" ' +
               'placeholder="Go to…" aria-label="Search the site">' +
        '<span class="mono cmdk__esc" aria-hidden="true">ESC</span>' +
      '</div>' +
      '<div class="cmdk__list" role="listbox"></div>' +
      '<div class="mono cmdk__foot">' +
        '<span><b>↑↓</b> move</span><span><b>↵</b> open</span>' +
        '<span class="cmdk__count"></span>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap);

  var input = wrap.querySelector('.cmdk__in');
  var list  = wrap.querySelector('.cmdk__list');
  var count = wrap.querySelector('.cmdk__count');
  var open  = false, sel = 0, shown = [];

  /* ── scoring ───────────────────────────────────────────────────
     A prefix on the label beats a hit anywhere in the label, which beats a
     hit in the keyword bag. Enough to make three letters land on the right
     row without pulling in a fuzzy-match dependency for twelve items. */
  function score(it, q) {
    if (!q) return 1;
    var l = it.l.toLowerCase(), bag = (it.l + ' ' + it.t + ' ' + it.q + ' ' + it.k).toLowerCase();
    if (l.indexOf(q) === 0) return 100;
    if (l.indexOf(q) > -1) return 60;
    if (bag.indexOf(q) > -1) return 30;
    // subsequence: "bst" finds "buSiness sTructuring"
    var i = 0;
    for (var c = 0; c < bag.length && i < q.length; c++) if (bag[c] === q[i]) i++;
    return i === q.length ? 10 : 0;
  }

  function render() {
    var q = input.value.trim().toLowerCase();
    shown = ITEMS
      .map(function (it) { return { it: it, s: score(it, q) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .map(function (r) { return r.it; });

    if (sel >= shown.length) sel = Math.max(0, shown.length - 1);

    list.textContent = '';
    shown.forEach(function (it, i) {
      var a = document.createElement('a');
      a.className = 'cmdk__row' + (i === sel ? ' is-sel' : '');
      a.href = it.h;
      a.setAttribute('role', 'option');
      a.setAttribute('aria-selected', String(i === sel));
      a.innerHTML =
        '<span class="mono cmdk__k">' + it.k + '</span>' +
        '<span class="cmdk__l">' + it.l + '</span>' +
        '<span class="mono cmdk__t">' + it.t + '</span>';
      a.addEventListener('mouseenter', function () { sel = i; mark(); });
      list.appendChild(a);
    });

    count.textContent = shown.length
      ? String(shown.length).padStart(2, '0') + ' RESULTS'
      : 'NO MATCH';
  }

  function mark() {
    var rows = list.children;
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle('is-sel', i === sel);
      rows[i].setAttribute('aria-selected', String(i === sel));
    }
    if (rows[sel]) rows[sel].scrollIntoView({ block: 'nearest' });
  }

  var lastFocus = null;

  function show() {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;
    wrap.hidden = false;
    document.body.classList.add('is-cmdk');
    input.value = ''; sel = 0;
    render();
    // next frame, so the transition has a start state to move from
    requestAnimationFrame(function () { wrap.classList.add('is-on'); });
    input.focus();
  }

  function hide() {
    if (!open) return;
    open = false;
    wrap.classList.remove('is-on');
    document.body.classList.remove('is-cmdk');
    var done = function () { if (!open) wrap.hidden = true; };
    if (REDUCED) done(); else setTimeout(done, 240);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ── keys ──────────────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    var k = e.key;

    if ((e.metaKey || e.ctrlKey) && (k === 'k' || k === 'K')) {
      e.preventDefault();
      open ? hide() : show();
      return;
    }

    if (!open) {
      // bare "/" opens it, unless the visitor is typing into something
      var t = e.target, tag = t && t.tagName;
      if (k === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !(t && t.isContentEditable)) {
        e.preventDefault(); show();
      }
      return;
    }

    if (k === 'Escape')      { e.preventDefault(); hide(); return; }
    if (k === 'ArrowDown')   { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); mark(); return; }
    if (k === 'ArrowUp')     { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); return; }
    if (k === 'Home')        { e.preventDefault(); sel = 0; mark(); return; }
    if (k === 'End')         { e.preventDefault(); sel = shown.length - 1; mark(); return; }
    if (k === 'Enter') {
      e.preventDefault();
      var row = list.children[sel];
      // .click() on a row in the document bubbles to field.js's delegated
      // handler, so the palette gets the same page-to-page continuity every
      // other link on the site gets. Assigning location.href would not.
      if (row) { hide(); row.click(); }
    }
  });

  input.addEventListener('input', function () { sel = 0; render(); });
  wrap.querySelector('.cmdk__scrim').addEventListener('click', hide);
  list.addEventListener('click', function () { hide(); });

  /* ── the visible trigger ───────────────────────────────────────── */
  var nav = document.querySelector('.nav__end');
  if (nav) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cmdkbtn mono';
    btn.setAttribute('aria-label', 'Open the index');
    btn.innerHTML = '<span aria-hidden="true">' + (MAC ? '⌘' : 'CTRL') + '</span>K';
    btn.addEventListener('click', show);
    nav.insertBefore(btn, nav.firstChild);
  }

  // nav.js clones .nav__links into the phone sheet; expose the palette there
  // too, since a phone has no ⌘K
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cmdk]');
    if (t) { e.preventDefault(); show(); }
  });

  window.__zyrnIndex = { show: show, hide: hide };
})();
