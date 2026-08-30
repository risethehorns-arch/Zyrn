# -*- coding: utf-8 -*-
"""Count the rendered words of every page in two designs and compare.

The claim the case study wants to make is that a whole design system was
dropped into a live, monetised, 180-page site without a word of the editorial
changing. That is exactly the kind of claim this project is not allowed to
assert, so it is counted: strip every tag, script and style from both versions
of every page and diff the word counts.

  python words.py <old-dir> <new-dir>
"""
import os, re, sys, html
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OLD, NEW = sys.argv[1], sys.argv[2]
STRIP = re.compile(r"<(script|style|noscript)\b.*?</\1>", re.S | re.I)
TAG = re.compile(r"<[^>]+>")


def words(path):
    try:
        s = open(path, encoding="utf-8", errors="replace").read()
    except OSError:
        return None
    s = STRIP.sub(" ", s)
    s = TAG.sub(" ", s)
    s = html.unescape(s)
    return len([w for w in s.split() if w.strip()])


pages = []
for root, dirs, files in os.walk(OLD):
    dirs[:] = [d for d in dirs if d not in (".git", "freeapps-components", "node_modules")]
    for f in files:
        if f.endswith(".html"):
            rel = os.path.relpath(os.path.join(root, f), OLD)
            pages.append(rel)
pages.sort()

same = diff = missing = 0
tot_old = tot_new = 0
rows = []
for rel in pages:
    a = words(os.path.join(OLD, rel))
    b = words(os.path.join(NEW, rel))
    if b is None:
        missing += 1
        continue
    tot_old += a
    tot_new += b
    if a == b:
        same += 1
    else:
        diff += 1
        rows.append((rel, a, b, b - a))

print("pages compared     : %d" % (same + diff))
print("identical wordcount: %d" % same)
print("changed wordcount  : %d" % diff)
print("missing in new     : %d" % missing)
print("total words old    : %d" % tot_old)
print("total words new    : %d" % tot_new)
print("net word change    : %+d  (%.3f%%)"
      % (tot_new - tot_old, 100.0 * (tot_new - tot_old) / max(1, tot_old)))
if rows:
    print("\nthe pages whose word count moved:")
    for rel, a, b, d in sorted(rows, key=lambda r: -abs(r[3]))[:25]:
        print("  %-52s %6d -> %-6d %+d" % (rel[:52], a, b, d))
