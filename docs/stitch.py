# -*- coding: utf-8 -*-
"""Stitch viewport captures into a tall strip.

`captureBeyondViewport` cannot photograph a pinned section: it renders the
sticky element once, at whatever scroll position it was in, and everything the
pin would have drawn further down comes back as flat background. Measured on
Lumina's homepage — a 1560x9600 grab that was one composed hero followed by
7,000px of black.

So the strip is built the way the rack already assumes it was: capture the
viewport at even scroll offsets, join them top to bottom, and a window
translating down the join REPLAYS the pinned animation instead of describing
it. Forward scroll only, one load.

  python stitch.py
"""
import asyncio, base64, io, json, os, subprocess, sys, time, urllib.request
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9478"))

URL = "https://www.lumina-jo.com/"
W, H, DPR = 390, 844, 2
# CONSECUTIVE viewports, and below the pinned hero (which runs 0..2250).
# Stitching ACROSS a pin duplicates: the pin holds the same composition while
# the scroll advances, so tiles 4 and 5 came back carrying the same panel twice
# and the join read as a rendering fault. Consecutive viewports of flowing
# content join seamlessly by construction — the strip is literally the page.
VH = 844
STEPS = [2250 + i * VH for i in range(5)]
OUT = "out/lumina-mob.webp"
OUT_W = 560


async def main():
    prof = os.path.join(os.environ["TEMP"], "st-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars",
        "--use-angle=d3d11", "--enable-gpu", "--use-gl=angle",
        "--window-size=600,1000", "--user-data-dir=" + prof, "about:blank",
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
    tiles = []
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

        await send("Page.enable")
        await send("Emulation.setDeviceMetricsOverride",
                   {"width": W, "height": H, "deviceScaleFactor": DPR,
                    "mobile": True})
        await send("Page.navigate", {"url": URL})
        await asyncio.sleep(6.5)
        await send("Runtime.evaluate", {"expression":
            "(function(){var s=document.createElement('style');"
            "s.textContent='html,body{scroll-behavior:auto!important}';"
            "document.head.appendChild(s)})()"})
        # The sticky header would otherwise print once per tile, five times
        # down a strip that is meant to read as one continuous page.
        HIDE = ("(function(){var a=document.querySelectorAll('body *');"
                "for(var i=0;i<a.length;i++){var c=getComputedStyle(a[i]);"
                "if((c.position==='fixed'||c.position==='sticky')&&"
                "a[i].getBoundingClientRect().height<220)"
                "a[i].style.visibility='hidden'}})()")
        for k, y in enumerate(STEPS):
            await send("Runtime.evaluate",
                       {"expression": "window.scrollTo(0,%d)" % y})
            await asyncio.sleep(1.1)
            await send("Runtime.evaluate", {"expression": HIDE})
            await asyncio.sleep(0.4)
            r = await send("Page.captureScreenshot", {"format": "png"})
            im = Image.open(io.BytesIO(base64.b64decode(r["data"])))
            tiles.append(im)
            print("  y=%-5d %s" % (y, im.size))
    proc.kill()

    tw, th = tiles[0].size
    strip = Image.new("RGB", (tw, th * len(tiles)))
    for i, t in enumerate(tiles):
        strip.paste(t.convert("RGB"), (0, i * th))
    out = strip.resize((OUT_W, round(OUT_W * strip.size[1] / strip.size[0])),
                       Image.LANCZOS)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    out.save(OUT, "WEBP", quality=80, method=6)
    print("wrote %s  %s  %d bytes"
          % (OUT, out.size, os.path.getsize(OUT)))
    out.resize((200, round(200 * out.size[1] / out.size[0]))).save("mobcheck.png")


asyncio.run(main())
