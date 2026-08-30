# -*- coding: utf-8 -*-
"""Is the window actually synced to the wheel?

The complaint was that the desktop window did not move with the mouse while
the phone strip beside it did. That is measurable and should never have been
left to feel: sample the active layer's translateY at many scroll positions
and check the travel is PROPORTIONAL to the scroll.

Reports, per scene:
  · px of strip travelled per 100px of page scroll, and how much that rate
    varies inside one scene (a smoothstep shows up as a 3-4x spread)
  · DEAD ZONES — consecutive samples where the page moved and the strip did
    not. The first build had one at the end of every scene, 14% wide.

  python sync.py <url>
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9501"))
SAMPLES = 130

JS = """
(function(){
  function ty(el){
    if(!el) return null;
    var m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return +m.m42.toFixed(2);
  }
  var ls = [].slice.call(document.querySelectorAll('.rk__layer'));
  var best = null, bi = -1;
  ls.forEach(function(e,i){
    var o = parseFloat(getComputedStyle(e).opacity) || 0;
    if (best === null || o > best) { best = o; bi = i; }
  });
  var mob = document.getElementById('rkMobImg');
  return JSON.stringify({
    y: window.scrollY, idx: bi, op: +best.toFixed(3),
    lay: ty(ls[bi]), mob: ty(mob),
    pct: (document.getElementById('rkPct')||{}).textContent
  });
})()
"""


async def main():
    url = sys.argv[1]
    prof = os.path.join(os.environ["TEMP"], "sy-%d" % int(time.time() * 1000))
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
        await send("Emulation.setDeviceMetricsOverride",
                   {"width": 1440, "height": 900, "deviceScaleFactor": 1,
                    "mobile": False})
        await send("Page.navigate", {"url": url})
        await asyncio.sleep(6.0)
        r = await send("Runtime.evaluate", {"expression":
            "(function(){var e=document.getElementById('rkTrack');"
            "return [e.offsetTop, e.offsetHeight]})()", "returnByValue": True})
        t0, th = r["result"]["value"]
        span = th - 900

        rows = []
        for k in range(SAMPLES):
            y = t0 + span * k / (SAMPLES - 1.0)
            await send("Runtime.evaluate",
                       {"expression": "window.scrollTo(0,%f)" % y})
            # Lenis virtualises the scroll, so a read taken straight after
            # scrollTo races the smooth-scroll animation and returns the
            # PREVIOUS frame's transform. That looked like a dead zone and
            # was a stopwatch problem.
            await asyncio.sleep(0.16)
            r = await send("Runtime.evaluate",
                           {"expression": JS, "returnByValue": True})
            rows.append(json.loads(r["result"]["value"]))

        step = span / (SAMPLES - 1.0)
        dead = []
        run = 0
        per_scene = {}
        for i in range(1, len(rows)):
            a, b = rows[i - 1], rows[i]
            same = (a["idx"] == b["idx"])
            # the first sample after a hand-over straddles two scenes and its
            # delta belongs to neither; counting it reports a 1.5x variation
            # that does not exist
            if i >= 2 and rows[i - 2]["idx"] != a["idx"]:
                continue
            d = abs((b["lay"] or 0) - (a["lay"] or 0))
            if same:
                per_scene.setdefault(b["idx"], []).append(d)
                if d < 0.4:
                    run += 1
                else:
                    if run >= 2:
                        dead.append((b["idx"], run))
                    run = 0
        if run >= 2:
            dead.append((rows[-1]["idx"], run))

        print("track %dpx over %d samples (%.0fpx a step)\n" % (span, SAMPLES, step))
        print("  scene   px strip / 100px page    min..max     variation")
        worst = 1.0
        for k in sorted(per_scene):
            ds = [d for d in per_scene[k]]
            if not ds:
                continue
            rate = sorted(d / step * 100 for d in ds)
            lo = rate[max(0, int(len(rate) * 0.10))]
            hi = rate[min(len(rate) - 1, int(len(rate) * 0.90))]
            mid = rate[len(rate) // 2]
            var = hi / max(0.001, lo)
            worst = max(worst, var)
            print("    %d       %8.1f              %5.1f..%-6.1f  %5.1fx"
                  % (k, mid, lo, hi, var))

        print("\n  DEAD ZONES (page moved, strip did not):")
        if dead:
            for idx, ln in dead:
                print("    scene %d — %d consecutive samples (%.0fpx of scroll)"
                      % (idx, ln, ln * step))
        else:
            print("    none")

        mobd = [abs((rows[i]["mob"] or 0) - (rows[i - 1]["mob"] or 0))
                for i in range(1, len(rows))]
        if any(mobd):
            mr = [d / step * 100 for d in mobd if d > 0]
            print("\n  phone strip: %.1f px / 100px page, variation %.2fx"
                  % (sorted(mr)[len(mr) // 2], max(mr) / max(0.001, min(mr))))
        print("\n  VERDICT: %s"
              % ("LINEAR — no dead zones, rate flat within every scene"
                 if not dead and worst < 1.35 else
                 "NOT LINEAR (worst in-scene variation %.1fx)" % worst))
    proc.kill()


asyncio.run(main())
