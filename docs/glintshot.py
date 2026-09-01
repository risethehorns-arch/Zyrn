# -*- coding: utf-8 -*-
"""Photograph a control's light: at rest, under the pointer, and struck.

Three states that cannot be told apart from one screenshot, so it takes
three — and it drives REAL pointer events rather than adding classes,
because the dwell loop and the strike are both hover/press behaviour and
faking either would prove nothing about what a reader gets.

  python glintshot.py <url> <selector> <prefix>
"""
import asyncio, base64, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9563"))


async def main():
    url, sel, pre = sys.argv[1], sys.argv[2], sys.argv[3]
    out = os.environ.get("OUT", "shot")
    W, H = 1440, 900
    prof = os.path.join(os.environ["TEMP"], "gl-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check",
        "--hide-scrollbars", "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
        "--window-size=1520,1020", "--user-data-dir=" + prof, "about:blank"],
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
    os.makedirs(out, exist_ok=True)
    async with websockets.connect(ws, max_size=100 * 1024 * 1024) as sock:
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
        await send("Emulation.setDeviceMetricsOverride",
                   {"width": W, "height": H, "deviceScaleFactor": 3, "mobile": False})
        await send("Page.navigate", {"url": url})
        await asyncio.sleep(8.0)

        r = await send("Runtime.evaluate", {"expression":
            "(function(){var e=document.querySelector('%s');if(!e)return '0,0,0,0';"
            "var b=e.getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),"
            "Math.round(b.width),Math.round(b.height)].join(',')})()" % sel,
            "returnByValue": True})
        x, y, w, h = [int(v) for v in r["result"]["value"].split(",")]
        if w == 0:
            print("  selector not found: " + sel); proc.kill(); return
        cx, cy = x + w // 2, y + h // 2
        pad = 26
        clip = {"x": max(0, x - pad), "y": max(0, y - pad),
                "width": w + pad * 2, "height": h + pad * 2, "scale": 3}

        async def shot(tag):
            rr = await send("Page.captureScreenshot", {"format": "png", "clip": clip})
            path = "%s/%s-%s.png" % (out, pre, tag)
            open(path, "wb").write(base64.b64decode(rr["data"]))
            print("  %s" % path)

        await shot("rest")

        # the pointer arrives and dwells
        await send("Input.dispatchMouseEvent",
                   {"type": "mouseMoved", "x": cx, "y": cy,
                    "button": "none", "pointerType": "mouse"})
        await asyncio.sleep(1.1)
        await shot("hover")
        await asyncio.sleep(1.0)
        await shot("dwell")

        # the strike
        await send("Input.dispatchMouseEvent",
                   {"type": "mousePressed", "x": cx, "y": cy,
                    "button": "left", "clickCount": 1, "pointerType": "mouse"})
        await asyncio.sleep(0.16)
        await shot("strike")
        await asyncio.sleep(0.22)
        await shot("strike2")
    proc.kill()


asyncio.run(main())
