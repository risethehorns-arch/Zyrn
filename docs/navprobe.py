# -*- coding: utf-8 -*-
"""Is the nav actually centred, and is exactly one tab lit?

Both are claims that were made by eye before and were wrong by 260px, so
they get measured. Reports, per page and per viewport:

  · the link row's centre against the viewport's centre
  · how many links carry `.is-here` (must be 0 or 1, never 2)
  · which one, and the colour the field lent it
  · whether the row collides with the mark or the end group

  python navprobe.py <url> [<url> ...]
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9537"))
VIEWPORTS = [(1920, 1080), (1440, 900), (1180, 800), (1024, 760)]
if os.environ.get("VP"):
    VIEWPORTS = [tuple(int(n) for n in v.split("x"))
                 for v in os.environ["VP"].split()]

JS = """(function(){
  function box(e){var b=e.getBoundingClientRect();
    return {l:b.left,r:b.right,t:b.top,b:b.bottom,w:b.width,h:b.height};}
  var links = document.querySelector('.nav__links');
  var brand = document.querySelector('.nav__brand') ||
              document.querySelector('.nav a');
  var end   = document.querySelector('.nav__end');
  if (!links) return JSON.stringify({skip:1});
  if (getComputedStyle(links).display === 'none')
    return JSON.stringify({hidden:1, vw:innerWidth});
  var L = box(links), B = brand?box(brand):null, E = end?box(end):null;
  var all = [].slice.call(document.querySelectorAll('.nav__link'));
  var lit = all.filter(function(a){return a.classList.contains('is-here');});
  var cs = getComputedStyle(document.documentElement);
  function gap(a,b){ if(!a||!b) return 999; return Math.round(b.l - a.r); }
  var minH = Math.min.apply(null, all.map(function(a){return box(a).h;}));
  return JSON.stringify({
    vw: innerWidth,
    rowCentre: Math.round((L.l + L.r) / 2),
    viewCentre: Math.round(innerWidth / 2),
    off: Math.round((L.l + L.r) / 2 - innerWidth / 2),
    gapBrand: gap(B, L), gapEnd: gap(L, E),
    links: all.length, lit: lit.length,
    litName: lit.length ? lit[0].textContent.trim().slice(0, 18) : '-',
    tapH: Math.round(minH),
    f1: cs.getPropertyValue('--fld-1').trim(),
    f2: cs.getPropertyValue('--fld-2').trim()
  });
})()"""


async def main():
    urls = sys.argv[1:]
    prof = os.path.join(os.environ["TEMP"], "np-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check",
        "--hide-scrollbars", "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
        "--window-size=2200,1200", "--user-data-dir=" + prof, "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ws = None
    for _ in range(80):
        try:
            with urllib.request.urlopen("http://127.0.0.1:%d/json/list" % PORT, timeout=1) as r:
                tabs = json.load(r)
            p = [t for t in tabs if t.get("type") == "page"]
            if p:
                ws = p[0]["webSocketDebuggerUrl"]; break
        except Exception:
            pass
        time.sleep(0.25)
    import websockets
    bad = 0
    async with websockets.connect(ws, max_size=32 * 1024 * 1024) as sock:
        n = {"i": 0}

        async def send(m, pp=None):
            n["i"] += 1; mine = n["i"]
            await sock.send(json.dumps({"id": mine, "method": m, "params": pp or {}}))
            while True:
                msg = json.loads(await asyncio.wait_for(sock.recv(), timeout=25))
                if msg.get("id") == mine:
                    return msg.get("result", {})

        await send("Page.enable")
        await send("Network.enable")
        await send("Network.setCacheDisabled", {"cacheDisabled": True})
        for url in urls:
            print("\n%s" % url.rsplit("/", 1)[-1], flush=True)
            await send("Page.navigate", {"url": url})
            await asyncio.sleep(5.0)
            for (W, H) in VIEWPORTS:
                await send("Emulation.setDeviceMetricsOverride",
                           {"width": W, "height": H, "deviceScaleFactor": 1, "mobile": False})
                await asyncio.sleep(0.7)
                r = await send("Runtime.evaluate", {"expression": JS, "returnByValue": True})
                d = json.loads(r["result"]["value"])
                if d.get("skip"):
                    print("  no nav"); continue
                if d.get("hidden"):
                    print("  %-10s link row hidden — phone menu owns navigation"
                          % ("%dx%d" % (W, H)), flush=True)
                    continue
                flags = []
                if abs(d["off"]) > 8:
                    flags.append("OFF-CENTRE %+d" % d["off"])
                if d["lit"] > 1:
                    flags.append("%d TABS LIT" % d["lit"])
                if d["gapBrand"] < 12 or d["gapEnd"] < 12:
                    flags.append("CROWDED %d/%d" % (d["gapBrand"], d["gapEnd"]))
                if d["tapH"] < 34:
                    flags.append("TAP %dpx" % d["tapH"])
                bad += 0 if not flags else 1
                print("  %-10s centre %5d vs %5d (%+4d)  gaps %4d/%4d  lit %d %-14s "
                      "tap %2d  %s %s   %s"
                      % ("%dx%d" % (W, H), d["rowCentre"], d["viewCentre"], d["off"],
                         d["gapBrand"], d["gapEnd"], d["lit"], d["litName"], d["tapH"],
                         d["f1"], d["f2"], "ok" if not flags else "<-- " + "; ".join(flags)),
                      flush=True)
    proc.kill()
    print("\n%s" % ("ALL CLEAR" if bad == 0 else "%d failing" % bad))


asyncio.run(main())
