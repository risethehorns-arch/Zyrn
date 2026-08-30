# -*- coding: utf-8 -*-
"""Prove the video work does what it claims, rather than looking like it does.

Three things a screenshot cannot tell you and this can:

  1. the card video is actually PLAYING when the band is on screen, and
     actually PAUSED when it is not — the whole budget argument rests on the
     second half of that and nothing on the page would look wrong if it failed
  2. the case-page reel is being SEEKED by scroll and lands where the scroll
     says, rather than sitting on frame zero looking like a poster
  3. `preload="none"` held — that the bytes were not in the page load

  python vidprobe.py <base-url>
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9479"))

CARD = """(function(){var v=document.querySelector('video[data-vid]');
 if(!v)return JSON.stringify({err:'no card video'});
 return JSON.stringify({paused:v.paused,t:+v.currentTime.toFixed(2),
  rs:v.readyState,pre:v.getAttribute('preload'),
  w:v.videoWidth,h:v.videoHeight,dur:+(v.duration||0).toFixed(2),
  src:(v.currentSrc||'').split('/').pop()});})()"""

REEL = """(function(){var v=document.getElementById('rkVid');
 if(!v)return JSON.stringify({err:'no reel video'});
 return JSON.stringify({paused:v.paused,t:+v.currentTime.toFixed(2),
  rs:v.readyState,pre:v.getAttribute('preload'),
  w:v.videoWidth,h:v.videoHeight,dur:+(v.duration||0).toFixed(2),
  cap:(document.getElementById('rkCap')||{}).textContent,
  idx:(document.getElementById('rkIdx')||{}).textContent,
  pct:(document.getElementById('rkPct')||{}).textContent,
  src:(v.currentSrc||'').split('/').pop()});})()"""


async def main():
    base = sys.argv[1].rstrip("/")
    prof = os.path.join(os.environ["TEMP"], "vp-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars",
        # SwiftShader, NOT the hardware GPU: measured 2026-08-30, headless
        # Chrome with --enable-gpu/--use-angle decodes exactly three frames of
        # any video and then reports paused with nobody having called pause().
        # A bare <video autoplay muted> on an empty page does the same, so it
        # is the environment. Software rendering plays normally and still
        # gives WebGL, so the whole page works.
        "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
        "--autoplay-policy=no-user-gesture-required",
        "--window-size=1500,1000", "--user-data-dir=" + prof, "about:blank",
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
        media = []

        async def send(m, pp=None):
            n["i"] += 1
            mine = n["i"]
            await sock.send(json.dumps({"id": mine, "method": m,
                                        "params": pp or {}}))
            while True:
                msg = json.loads(await sock.recv())
                if msg.get("method") == "Network.responseReceived":
                    u = msg["params"]["response"]["url"]
                    if ".webm" in u or ".mp4" in u:
                        media.append(u.split("/")[-1])
                if msg.get("id") == mine:
                    return msg.get("result", {})

        async def ev(js):
            r = await send("Runtime.evaluate",
                           {"expression": js, "returnByValue": True})
            return json.loads(r["result"].get("value") or "{}")

        await send("Page.enable")
        await send("Network.enable")
        await send("Emulation.setDeviceMetricsOverride",
                   {"width": 1440, "height": 900, "deviceScaleFactor": 1,
                    "mobile": False})

        # ── 1 · the landing card ────────────────────────────────────────
        print("\n=== index.html — the Lumina card ===")
        media.clear()
        await send("Page.navigate", {"url": base + "/index.html"})
        await asyncio.sleep(6.0)
        print("  on load, before the band is reached:")
        print("    media requested : %s" % (media or "NONE  <- preload=none held"))
        d = await ev(CARD)
        print("    %s" % d)

        y = await send("Runtime.evaluate", {"expression":
            "(function(){var e=document.getElementById('production');"
            "window.scrollTo(0,e.offsetTop-200);return e.offsetTop})()",
            "returnByValue": True})
        print("  scrolled to the proof band (offsetTop %s)"
              % y["result"].get("value"))
        await asyncio.sleep(4.5)
        d = await ev(CARD)
        print("    %s" % d)
        print("    media requested : %s" % (media or "NONE"))
        ok_play = (not d.get("paused")) and d.get("t", 0) > 0.2
        print("    PLAYING IN VIEW : %s" % ("yes" if ok_play else "NO"))

        await send("Runtime.evaluate", {"expression": "window.scrollTo(0,0)"})
        await asyncio.sleep(2.5)
        d2 = await ev(CARD)
        print("    after scrolling away: paused=%s t=%s"
              % (d2.get("paused"), d2.get("t")))
        print("    PAUSED OUT OF VIEW: %s" % ("yes" if d2.get("paused") else "NO"))

        # ── 2 · the case page reel ──────────────────────────────────────
        print("\n=== lumina.html — the scrubbed reel ===")
        media.clear()
        await send("Page.navigate", {"url": base + "/lumina.html"})
        await asyncio.sleep(6.0)
        print("  on load: media requested : %s"
              % (media or "NONE  <- preload=none held"))
        d = await ev(REEL)
        print("    %s" % d)

        top = await send("Runtime.evaluate", {"expression":
            "(function(){var e=document.getElementById('rkTrack');"
            "return [e.offsetTop, e.offsetHeight]})()", "returnByValue": True})
        t0, th = top["result"]["value"]
        print("  rkTrack offsetTop=%s height=%s" % (t0, th))

        rows = []
        for frac in (0.05, 0.25, 0.45, 0.65, 0.85, 0.98):
            ypx = t0 + (th - 900) * frac
            await send("Runtime.evaluate",
                       {"expression": "window.scrollTo(0,%d)" % ypx})
            await asyncio.sleep(1.6)
            d = await ev(REEL)
            rows.append((frac, d))
            print("    track %3.0f%%  t=%-6s / %-6s  pct=%-4s idx=%-8s %s"
                  % (frac * 100, d.get("t"), d.get("dur"), d.get("pct"),
                     d.get("idx"), (d.get("cap") or "")[:44]))
        print("    media requested : %s" % (media or "NONE"))
        ts = [r[1].get("t", 0) for r in rows]
        rising = all(ts[i] <= ts[i + 1] + 0.01 for i in range(len(ts) - 1))
        moved = (max(ts) - min(ts)) > 8
        print("    SCRUB ADVANCES  : %s" % ("yes" if rising and moved else "NO"))
        print("    NEVER PLAYING   : %s"
              % ("yes" if all(r[1].get("paused") for r in rows) else "NO"))

    proc.kill()


asyncio.run(main())
