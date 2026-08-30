# -*- coding: utf-8 -*-
"""What does a click on each part of a card actually hit?

The cards now carry two destinations: the card goes to the case study, the
visit tab goes to the live site. That is exactly the arrangement that breaks
silently — a stretched pseudo-element with the wrong z-index swallows the tab
and every tap goes to the case study instead, and nothing looks wrong.

So it is hit-tested rather than assumed: elementFromPoint at the middle of
each card, at the middle of each visit tab and at each of the tab's four
corners, then walk up to the nearest anchor and report where it goes.

  python hits.py <url>
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9504"))

JS = """
(function(){
  function hrefAt(x, y){
    var e = document.elementFromPoint(x, y);
    if (!e) return '(nothing)';
    var a = e.closest('a');
    return a ? (a.getAttribute('href') || '(no href)') : '(not a link)';
  }
  var out = [];
  /* elementFromPoint returns null for anything outside the viewport, which
     is not a routing failure — it is a point that was never on screen. Each
     card is scrolled to the middle first. */
  var idx = ARG_I;
  var cards = document.querySelectorAll('.proof__card');
  if (idx >= cards.length) return JSON.stringify([]);
  [cards[idx]].forEach(function(c, _z){
    var i = idx;
    var bb = c.getBoundingClientRect();
    /* Put the card's TOP just below the fixed nav rather than centring it.
       Centred, a tall phone card puts its visit tab above the fold or under
       the nav bar, and elementFromPoint then reports the nav — which is a
       true statement about that scroll position and not a routing fault. */
    window.scrollBy(0, bb.top - 96);
    var b = c.getBoundingClientRect();
    var want = (c.querySelector('.proof__go') || {}).getAttribute
             ? c.querySelector('.proof__go').getAttribute('href') : '?';
    var row = { card: i, want: want, tag: c.tagName,
                body: hrefAt(b.left + b.width * 0.5, b.top + b.height * 0.78),
                vis:  hrefAt(b.left + b.width * 0.5, b.top + b.height * 0.18),
                head: hrefAt(b.left + b.width * 0.5, b.top + b.height * 0.62) };
    var v = c.querySelector('.visit');
    if (v){
      var r = v.getBoundingClientRect();
      row.tabWant = v.getAttribute('href');
      row.tabMid = hrefAt(r.left + r.width/2, r.top + r.height/2);
      row.tabTL  = hrefAt(r.left + 2, r.top + 2);
      row.tabBR  = hrefAt(r.right - 2, r.bottom - 2);
      row.tabW   = Math.round(r.width);
      row.tabH   = Math.round(r.height);
    }
    out.push(row);
  });
  return JSON.stringify(out);
})()
"""


async def main():
    url = sys.argv[1]
    prof = os.path.join(os.environ["TEMP"], "ht-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars",
        "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
        "--window-size=1600,1100", "--user-data-dir=" + prof, "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ws = None
    for _ in range(80):
        try:
            with urllib.request.urlopen(
                    "http://127.0.0.1:%d/json/list" % PORT, timeout=1) as r:
                tabs = json.load(r)
            p = [t for t in tabs if t.get("type") == "page"]
            if p:
                ws = p[0]["webSocketDebuggerUrl"]
                break
        except Exception:
            pass
        time.sleep(0.25)
    import websockets
    async with websockets.connect(ws, max_size=64 * 1024 * 1024) as sock:
        n = {"i": 0}

        async def send(m, pp=None):
            n["i"] += 1
            mine = n["i"]
            await sock.send(json.dumps({"id": mine, "method": m,
                                        "params": pp or {}}))
            while True:
                msg = json.loads(await sock.recv())
                if msg.get("id") == mine:
                    return msg.get("result", {})

        await send("Page.enable")
        bad = 0
        for (W, H) in [(1440, 900), (1180, 800), (900, 700), (393, 610)]:
            await send("Emulation.setDeviceMetricsOverride",
                       {"width": W, "height": H, "deviceScaleFactor": 1,
                        "mobile": W < 900})
            await send("Page.navigate", {"url": url})
            await asyncio.sleep(5.5)
            print("\n  %dx%d" % (W, H))
            rows = []
            for ci in range(4):
                await send("Runtime.evaluate", {"expression":
                    "window.scrollTo(0,document.getElementById('production')"
                    ".offsetTop - 60)"})
                await asyncio.sleep(0.7)
                r = await send("Runtime.evaluate",
                               {"expression": JS.replace("ARG_I", str(ci)),
                                "returnByValue": True})
                res = r["result"]
                if "value" not in res:
                    print("    card %d  EVAL FAILED %s" % (ci, json.dumps(res)[:120]))
                    continue
                rows += json.loads(res["value"])
            for row in rows:
                ok = (row["body"] == row["want"] and row["head"] == row["want"])
                mark = "ok" if ok else "  <-- CARD MISROUTED"
                if not ok:
                    bad += 1
                print("    card %d <%s>  body->%-14s head->%-14s %s"
                      % (row["card"], row["tag"].lower(), row["body"],
                         row["head"], mark))
                if "tabWant" in row:
                    tok = (row["tabMid"] == row["tabWant"]
                           and row["tabTL"] == row["tabWant"]
                           and row["tabBR"] == row["tabWant"])
                    if not tok:
                        bad += 1
                    print("      tab %dx%d  mid->%s  corners->%s / %s   %s"
                          % (row["tabW"], row["tabH"],
                             row["tabMid"].replace("https://", ""),
                             row["tabTL"].replace("https://", ""),
                             row["tabBR"].replace("https://", ""),
                             "ok" if tok else "<-- TAB SWALLOWED"))
        print("\n  %s" % ("EVERY TARGET RESOLVES TO THE RIGHT PLACE"
                          if bad == 0 else "%d MISROUTED" % bad))
    proc.kill()


asyncio.run(main())
