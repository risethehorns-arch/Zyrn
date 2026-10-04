# -*- coding: utf-8 -*-
"""Viewport screenshots of a page at given TIMES after a REAL scroll —
for the things the element-screenshot tools cannot see: anything driven
by an IntersectionObserver or a timer. The page is scrolled through
window.__zyrnScrollTo (the only sanctioned way anything moves the page),
so visibility-gated loops actually run.

    W=1440 H=900 python docs/shotat.py <url> <out-prefix> <selector|0> <at> <t1,t2,...>

  selector  element to bring to <at> of the viewport height (0 = stay at top)
  times     seconds after the scroll lands, one capture each
"""
import asyncio, base64, json, os, subprocess, sys, time, urllib.request
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9881"))

async def main():
    url, out, sel, at = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
    times = [float(x) for x in sys.argv[5].split(",")]
    W = int(os.environ.get("W", "1440")); H = int(os.environ.get("H", "900"))
    prof = os.path.join(os.environ["TEMP"], "sa-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT, "--remote-allow-origins=*",
        "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist",
        "--window-size=%d,%d" % (W, H), "--user-data-dir=" + prof, "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ws = None
    for _ in range(80):
        try:
            with urllib.request.urlopen("http://127.0.0.1:%d/json/list" % PORT, timeout=1) as r:
                p = [t for t in json.load(r) if t.get("type") == "page"]
            if p: ws = p[0]["webSocketDebuggerUrl"]; break
        except Exception: pass
        time.sleep(0.25)
    import websockets
    try:
        async with websockets.connect(ws, max_size=64 * 1024 * 1024) as sock:
            n = {"i": 0}
            async def send(m, pp=None):
                n["i"] += 1; mine = n["i"]
                await sock.send(json.dumps({"id": mine, "method": m, "params": pp or {}}))
                while True:
                    msg = json.loads(await sock.recv())
                    if msg.get("id") == mine: return msg.get("result", {})
            async def ev(x):
                r = await send("Runtime.evaluate", {"expression": x, "returnByValue": True})
                return r.get("result", {}).get("value")
            await send("Page.enable")
            await send("Emulation.setDeviceMetricsOverride", {"width": W, "height": H, "deviceScaleFactor": 1, "mobile": W < 700})
            await send("Page.navigate", {"url": url})
            t0 = time.time()                      # selector 0: times run from navigation
            if sel != "0":
                for _ in range(60):
                    await asyncio.sleep(0.25)
                    if await ev("document.body.classList.contains('is-field-ready')"): break
                await ev("window.__zyrnScrollTo((function(){var e=document.querySelector(%s),y=0,n=e;while(n){y+=n.offsetTop;n=n.offsetParent}return y-innerHeight*%f})(),0)" % (json.dumps(sel), at))
                t0 = time.time()
            for i, t in enumerate(times):
                d = t - (time.time() - t0)
                if d > 0: await asyncio.sleep(d)
                r = await send("Page.captureScreenshot", {"format": "png"})
                fn = "%s-%d.png" % (out, i)
                open(fn, "wb").write(base64.b64decode(r["data"]))
                print("  %s  at %.2fs" % (fn, time.time() - t0))
    finally:
        proc.kill()
asyncio.run(main())
