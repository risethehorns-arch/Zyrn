# -*- coding: utf-8 -*-
"""Drive the field with real pointer input and photograph what it does.

The new behaviour only exists in response to a pointer, so a static
screenshot cannot show it. This dispatches genuine mouse events over CDP —
a sweep to lay down a wake, then a click to fire the shock — and captures
the field at chosen moments after each.

Hardware GPU, no virtual time: the field is a real-time simulation and both
the wake and the shell are transient.

  python play.py <url> <outprefix>
"""
import asyncio, base64, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9510"))
W, H = 1440, 900


async def main():
    url, pref = sys.argv[1], sys.argv[2]
    prof = os.path.join(os.environ["TEMP"], "pl-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars",
        "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist",
        "--use-gl=angle",
        "--window-size=%d,%d" % (W + 60, H + 120),
        "--user-data-dir=" + prof, "about:blank",
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
    async with websockets.connect(ws, max_size=200 * 1024 * 1024) as sock:
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

        async def shot(tag):
            r = await send("Page.captureScreenshot", {"format": "png"})
            p = "%s_%s.png" % (pref, tag)
            open(p, "wb").write(base64.b64decode(r["data"]))
            print("  wrote %s" % p)

        async def move(x, y):
            await send("Input.dispatchMouseEvent",
                       {"type": "mouseMoved", "x": x, "y": y,
                        "button": "none", "pointerType": "mouse"})

        await send("Page.enable")
        await send("Emulation.setDeviceMetricsOverride",
                   {"width": W, "height": H, "deviceScaleFactor": 1,
                    "mobile": False})
        await send("Page.navigate", {"url": url})
        await asyncio.sleep(9.0)

        await shot("00_idle")

        # a sweep across the core — lays down a wake
        print("sweep…")
        for i in range(46):
            t = i / 45.0
            await move(300 + t * 840, 470 + 120 * (0.5 - abs(t - 0.5)) * 2)
            await asyncio.sleep(0.014)
        await shot("01_wake")
        await asyncio.sleep(0.75)
        await shot("02_cooling")

        # hold still — the dwell mode attracts and glows
        print("dwell…")
        await move(720, 450)
        await asyncio.sleep(2.4)
        await shot("03_dwell")

        # a click — the shock
        print("shock…")
        await send("Input.dispatchMouseEvent",
                   {"type": "mousePressed", "x": 720, "y": 450,
                    "button": "left", "clickCount": 1, "pointerType": "mouse"})
        await asyncio.sleep(0.18)
        await shot("04_shock_near")
        await asyncio.sleep(0.30)
        await shot("05_shock_mid")
        await asyncio.sleep(0.45)
        await shot("06_shock_far")
    proc.kill()


asyncio.run(main())
