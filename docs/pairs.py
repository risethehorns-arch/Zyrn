# -*- coding: utf-8 -*-
"""Matched before/after captures of the same page in two designs.

Both come from a local server rather than one local and one live: the two
halves of a comparison have to differ in the design and in nothing else, and a
live capture carries a different network, a consent banner and whatever the CDN
felt like that second. The old design is `git archive HEAD` of the clone; the
new one is the working tree, which is byte-identical to what is live now.

Everything is taken at scroll 0. Old and new have different section heights, so
any offset other than the top would compare two different parts of the page and
the wipe would be a lie.

  python pairs.py
"""
import asyncio, base64, json, os, subprocess, sys, time, urllib.request
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9486"))

OLD = "http://127.0.0.1:8898"
NEW = "http://127.0.0.1:8899"
W, H, DPR = 1440, 900, 2

PAGES = [
    ("home",   "/index.html"),
    ("pillar", "/best-free-ai-tools-2026.html"),
    ("alt",    "/free-alternative-to-figma.html"),
]

HIDE = ("(function(){var s=document.createElement('style');"
        "s.textContent=\"[class*='consent'],[class*='cookie'],[id*='consent'],"
        "[id*='cookie'],[class*='Consent'],[class*='Cookie']{display:none"
        " !important} html,body{scroll-behavior:auto !important}\";"
        "document.head.appendChild(s)})()")


async def main():
    prof = os.path.join(os.environ["TEMP"], "pr-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars",
        "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
        "--force-device-scale-factor=%d" % DPR,
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
    os.makedirs("pair", exist_ok=True)
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
                    "mobile": False})
        for tag, path in PAGES:
            for which, base in (("old", OLD), ("new", NEW)):
                await send("Page.navigate", {"url": base + path})
                await asyncio.sleep(5.0)
                await send("Runtime.evaluate", {"expression": HIDE})
                await send("Runtime.evaluate",
                           {"expression": "window.scrollTo(0,0)"})
                await asyncio.sleep(1.6)
                r = await send("Page.captureScreenshot", {"format": "png"})
                raw = base64.b64decode(r["data"])
                im = Image.open(__import__("io").BytesIO(raw)).convert("RGB")
                out = "pair/%s-%s.webp" % (tag, which)
                im.resize((1440, 900), Image.LANCZOS).save(
                    out, "WEBP", quality=82, method=6)
                print("  %-8s %-4s %s -> %s  %d bytes"
                      % (tag, which, im.size, out, os.path.getsize(out)))
    proc.kill()


asyncio.run(main())
