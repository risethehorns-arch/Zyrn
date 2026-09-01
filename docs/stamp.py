# -*- coding: utf-8 -*-
"""Stamp every local stylesheet and script link with a content hash.

WHY THIS EXISTS. On 2026-09-01 the owner opened
`services/website-design.html` and saw the stack instrument rendered with
no styling at all — six layers in normal flow, the key rail numbered
`1. 2. 3.`, giant unclipped panels across the viewport. The same page,
same bytes, rendered perfectly in a clean browser at 1440x900 and at
2560x1240, and the server was returning the current file with
`Cache-Control: no-store`. The page was fine; the BROWSER had a stale or
failed copy of `svc-modules.css`, and a stylesheet that fails to arrive
does not look like a network problem — it looks like the design is broken.

`no-store` protects the next request. It does nothing for a tab that
already parsed an old copy, and nothing at all on GitHub Pages, which
serves CSS with its own cache lifetime — so the live site has the same
exposure on every push.

So the URL changes when the file changes. `styles.css?v=8chars` of the
file's own content: identical bytes keep the same URL and stay cached,
and one edited byte is a new URL that cannot be served from anywhere
stale.

  python stamp.py          # rewrite every page
  python stamp.py --check  # exit 1 if any stamp is out of date

RUN IT AFTER TOUCHING ANY CSS OR JS AND BEFORE COMMITTING.
"""
import hashlib, io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

PAGES = [f for f in os.listdir(".") if f.endswith(".html")]
PAGES += [os.path.join("services", f) for f in os.listdir("services")
          if f.endswith(".html")]

# href/src on a LOCAL asset, with an optional existing ?v=
PAT = re.compile(
    r'((?:href|src)=")((?:\.\./)?assets/[^"?]+\.(?:css|js))(\?v=[0-9a-f]+)?(")')

_cache = {}


def digest(rel_from_page, page):
    """Content hash of the asset a page's relative URL points at."""
    path = os.path.normpath(os.path.join(os.path.dirname(page), rel_from_page))
    if path in _cache:
        return _cache[path]
    if not os.path.isfile(path):
        _cache[path] = None
        return None
    h = hashlib.sha1(open(path, "rb").read()).hexdigest()[:8]
    _cache[path] = h
    return h


def main():
    check = "--check" in sys.argv
    stale, touched, missing = 0, 0, []
    for page in sorted(PAGES):
        s = io.open(page, encoding="utf-8").read()
        out, n = [], 0

        def sub(m):
            nonlocal n
            pre, url, old, post = m.groups()
            h = digest(url, page)
            if h is None:
                missing.append((page, url))
                return m.group(0)
            want = "?v=" + h
            if old != want:
                n += 1
            return pre + url + want + post

        new = PAT.sub(sub, s)
        if n:
            stale += n
            if check:
                print("  STALE %-40s %d link(s)" % (page, n))
            else:
                io.open(page, "w", encoding="utf-8").write(new)
                touched += 1
                print("  %-40s %d link(s) stamped" % (page, n))

    for page, url in missing:
        print("  MISSING ASSET  %s -> %s" % (page, url))

    if check:
        print("\n%s" % ("every stamp current"
                        if not stale else "%d link(s) out of date — run stamp.py" % stale))
        sys.exit(1 if stale or missing else 0)
    print("\n%d page(s) rewritten, %d link(s) stamped" % (touched, stale))
    sys.exit(1 if missing else 0)


main()
