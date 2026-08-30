# -*- coding: utf-8 -*-
"""Tall scroll strips for the case-page windows.

Why this replaces the scrubbed video, 2026-08-30: the reels seeked perfectly in
Chrome and did not move at all on the owner's browser. The diagnosis was free —
the phone strip beside the window DID scroll, and it is driven by the same
draw() callback, so the scroll plumbing was never in question. Only the video
seeking was. Safari and iOS will not reliably seek a `preload="none"` element
without a user gesture, and a scroll instrument cannot ask for one.

So both windows now use the mechanism that is already proven on that device: an
image, translated. It cannot fail to seek because there is nothing to seek.

Each scene is N viewport captures stacked into one strip:

  PINNED sections (Lumina's /room, /invest, the hero, THEHUB's hero) are
    sampled at even progress ACROSS THE PIN TRACK, so translating the strip
    steps through the animation.
  FLAT pages are sampled at CONSECUTIVE viewport heights, so translating the
    strip is literally scrolling the page.

Eight tiles a scene rather than the four the previous strips used — the extra
four are what makes a pinned instrument read as moving rather than as four
posters.

  python strips.py <spec.json> <outdir>
"""
import asyncio, base64, io as _io, json, os, subprocess, sys, time, urllib.request
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9493"))

W, H, DPR = 1440, 900, 2
OUT_W = 1120
QUALITY = 74

PREP = ("(function(){var s=document.createElement('style');"
        "s.textContent=\"html,body{scroll-behavior:auto !important}\"+"
        "%s;document.head.appendChild(s)})()")


async def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    outdir = sys.argv[2]
    os.makedirs(outdir, exist_ok=True)

    prof = os.path.join(os.environ["TEMP"], "st-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars",
        "--use-angle=d3d11", "--enable-gpu", "--use-gl=angle",
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
    manifest = []
    async with websockets.connect(ws, max_size=300 * 1024 * 1024) as sock:
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

        for sc in spec["scenes"]:
            tiles = sc.get("tiles", 8)
            await send("Page.navigate", {"url": sc["url"]})
            await asyncio.sleep(sc.get("settle", 5.5))
            hide = json.dumps(sc["hide"]) + "+'{display:none !important}'" \
                if sc.get("hide") else "''"
            await send("Runtime.evaluate", {"expression": PREP % hide})
            await asyncio.sleep(0.4)

            if sc["kind"] == "pinned":
                lo, hi = sc["from"], sc["to"]
                offs = [lo + (hi - lo) * i / (tiles - 1) for i in range(tiles)]
            else:
                lo = sc.get("from", 0)
                offs = [lo + i * H for i in range(tiles)]

            # The sticky header prints once per tile, which puts a nav bar
            # across every join — measured on lum-room, where one landed
            # halfway down the window and read exactly like a rendering fault.
            # Hidden after the first tile, on PINNED scenes as well as flat
            # ones: a pinned composition repeats its own chrome just as a
            # scrolled page does. The strip keeps its chrome at the top.
            STICKY = ("(function(){var a=document.querySelectorAll('body *');"
                      "for(var i=0;i<a.length;i++){var c=getComputedStyle(a[i]);"
                      "if((c.position==='fixed'||c.position==='sticky')&&"
                      "a[i].getBoundingClientRect().height<220)"
                      "a[i].style.visibility='hidden'}})()")

            imgs = []
            for k, y in enumerate(offs):
                await send("Runtime.evaluate",
                           {"expression": "window.scrollTo(0,%d)" % y})
                await asyncio.sleep(sc.get("dwell", 1.0))
                if k == 1:
                    await send("Runtime.evaluate", {"expression": STICKY})
                    await asyncio.sleep(0.35)
                r = await send("Page.captureScreenshot", {"format": "png"})
                im = Image.open(_io.BytesIO(base64.b64decode(r["data"])))
                imgs.append(im.convert("RGB"))

            tw, th = imgs[0].size
            strip = Image.new("RGB", (tw, th * len(imgs)))
            for i, t in enumerate(imgs):
                strip.paste(t, (0, i * th))
            out_h = round(OUT_W * strip.size[1] / strip.size[0])
            strip = strip.resize((OUT_W, out_h), Image.LANCZOS)
            path = os.path.join(outdir, "%s.webp" % sc["id"])
            strip.save(path, "WEBP", quality=QUALITY, method=6)
            kb = os.path.getsize(path) / 1024
            print("  %-9s %-42s %d tiles  %sx%s  %6.0f KB"
                  % (sc["id"], sc["url"][-42:], tiles, OUT_W, out_h, kb))
            manifest.append({"id": sc["id"], "w": OUT_W, "h": out_h,
                             "tiles": tiles, "kb": round(kb)})
    proc.kill()
    with open(os.path.join(outdir, "strips.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=1)
    print("\ntotal %.1f MB" % (sum(m["kb"] for m in manifest) / 1024))


asyncio.run(main())
