# -*- coding: utf-8 -*-
"""Photograph a signature instrument at chosen progress values.

Same negative-margin trick as sig.py — headless paints reliably at scroll 0
and window.scrollTo fights Lenis, so the track is pulled up instead and the
document never moves. Preceding siblings are hidden, because the negative
margin drags the track over content still sitting at its natural position
and the overlap looks exactly like a layout bug that is not there.

Takes a section id rather than a track id, since none of the tracks carry
one: `#sigStack`, `#sigFold`, `#sigPlan`, `#sigWell`, `#sigPrism`.

  W=1440 H=900 python rigshot.py <url> <sectionId> <out-prefix> <p> [p ...]
"""
import asyncio, base64, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9521"))


async def main():
    url, sid, pre = sys.argv[1], sys.argv[2], sys.argv[3]
    ps = [float(x) for x in sys.argv[4:]] or [0.5]
    W = int(os.environ.get("W", "1440"))
    H = int(os.environ.get("H", "900"))
    out = os.environ.get("OUT", "shot")
    prof = os.path.join(os.environ["TEMP"], "rs-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars",
        "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
        "--window-size=%d,%d" % (W + 60, H + 120),
        "--user-data-dir=" + prof, "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ws_url = None
    for _ in range(80):
        try:
            with urllib.request.urlopen(
                    "http://127.0.0.1:%d/json/list" % PORT, timeout=1) as r:
                tabs = json.load(r)
            p = [t for t in tabs if t.get("type") == "page"]
            if p:
                ws_url = p[0]["webSocketDebuggerUrl"]
                break
        except Exception:
            pass
        time.sleep(0.25)
    if not ws_url:
        proc.kill(); raise SystemExit("no devtools")
    import websockets
    os.makedirs(out, exist_ok=True)
    try:
        async with websockets.connect(ws_url, max_size=200 * 1024 * 1024) as ws:
            n = {"i": 0}

            async def send(m, pp=None):
                n["i"] += 1
                mine = n["i"]
                await ws.send(json.dumps({"id": mine, "method": m,
                                          "params": pp or {}}))
                while True:
                    msg = json.loads(await ws.recv())
                    if msg.get("id") == mine:
                        return msg.get("result", {})

            await send("Page.enable")
            await send("Emulation.setDeviceMetricsOverride",
                       {"width": W, "height": H, "deviceScaleFactor": 2,
                        "mobile": W < 900})
            await send("Page.navigate", {"url": url})
            await asyncio.sleep(6.5)
            for p in ps:
                expr = ("(function(){var s=document.getElementById('%s');"
                        "var t=s.querySelector('.sig__track');"
                        "var pv=s.previousElementSibling;"
                        "while(pv){pv.style.display='none';pv=pv.previousElementSibling;}"
                        "t.style.marginTop='0px';"
                        "var r=t.getBoundingClientRect();"
                        "var span=Math.max(1,r.height-innerHeight);"
                        "t.style.marginTop=(-(r.top+%s*span))+'px';"
                        "return 1})()" % (sid, p))
                await send("Runtime.evaluate",
                           {"expression": expr, "returnByValue": True})
                await asyncio.sleep(2.0)
                r = await send("Page.captureScreenshot", {"format": "png"})
                path = "%s/%s-%s.png" % (out, pre, ("%.2f" % p).replace("0.", "p"))
                open(path, "wb").write(base64.b64decode(r["data"]))
                print("  %s  %d KB" % (path, os.path.getsize(path) // 1024))
    finally:
        proc.kill()


asyncio.run(main())
