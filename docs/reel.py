# -*- coding: utf-8 -*-
"""Screencast a live site scrolling, as frames, for encoding into a reel.

Why a screencast and not stepped screenshots: the pages worth filming here are
the ones that MOVE. Lumina's /room and /invest are pinned scroll instruments —
the whole point is the thing animating as the track advances, and a stack of
stills taken at fixed offsets shows the poses and loses the motion between
them. `Page.startScreencast` hands back every frame the compositor actually
paints, with the timestamp it painted at, so the output is what a visitor sees.

Two things this gets right that the earlier still-capture did not:

  · NO `--virtual-time-budget`. That flag is what makes headless render about
    one frame per second, and it is the reason this project believed for weeks
    that headless could not film anything. Real GPU, wall-clock waits.
  · FORWARD SCROLL ONLY, from one load. Scrolling back up replays entry
    animations and froze the Lumina hero mid-wipe the last time this was tried.

Frames are written as JPEGs plus a `manifest.json` carrying each frame's real
offset in seconds, so ffmpeg can rebuild the true timing with a concat list
rather than assuming a constant rate.

  python reel.py <jobs.json> <outdir>
"""
import asyncio, base64, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9470"))


class CDP:
    """A CDP client that can receive events while a call is in flight.

    The send/recv-until-my-id helper every other script in this directory uses
    silently drops events, which is fine when you only want a return value and
    fatal when the events ARE the payload. One reader task, futures for calls,
    a queue for the frames.
    """

    def __init__(self, ws):
        self.ws = ws
        self.n = 0
        self.pending = {}
        self.frames = asyncio.Queue()
        self.task = asyncio.create_task(self._read())

    async def _read(self):
        try:
            while True:
                msg = json.loads(await self.ws.recv())
                if "id" in msg:
                    fut = self.pending.pop(msg["id"], None)
                    if fut and not fut.done():
                        fut.set_result(msg.get("result", {}))
                elif msg.get("method") == "Page.screencastFrame":
                    await self.frames.put(msg["params"])
        except Exception:
            pass

    async def send(self, method, params=None):
        self.n += 1
        mine = self.n
        fut = asyncio.get_event_loop().create_future()
        self.pending[mine] = fut
        await self.ws.send(json.dumps({"id": mine, "method": method,
                                       "params": params or {}}))
        return await asyncio.wait_for(fut, timeout=60)


async def launch():
    prof = os.path.join(os.environ["TEMP"], "reel-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new",
        "--remote-debugging-port=%d" % PORT, "--remote-allow-origins=*",
        "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
        "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist",
        "--use-gl=angle", "--autoplay-policy=no-user-gesture-required",
        "--force-device-scale-factor=2",
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
    if not ws:
        proc.kill()
        raise SystemExit("no devtools")
    return proc, ws


# Smooth scroll, driven in-page on rAF so the site's own scroll handlers see a
# real gesture rate rather than one enormous jump. eased at both ends: a linear
# ramp that starts instantly looks like a machine scrolling, which it is, and
# the point of the reel is that it does not look like one.
SCROLL = """
(function(to, ms){
  var from = window.scrollY, d = to - from, t0 = performance.now();
  return new Promise(function(res){
    function step(now){
      var p = Math.min(1, (now - t0) / ms);
      var e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2;
      window.scrollTo(0, from + d * e);
      if (p < 1) requestAnimationFrame(step); else res(window.scrollY);
    }
    requestAnimationFrame(step);
  });
})(%f, %f)
"""

# Lumina sets `html { scroll-behavior: smooth }`. Under that, EVERY
# window.scrollTo becomes an animated scroll the browser owns, so the rAF
# easing above turned into sixty animations each cancelling the last, and the
# page did not move until the final call finished. It cost a whole take:
# measured, 80% of the visual change in every segment landed inside the last
# 0.4 seconds, which looked like slow instruments and was in fact a page
# standing still and then jumping.
#
# Turning it off does not change what the site DOES — the pinned instruments
# read window.scrollY and animate identically. It only takes back control of
# when the scroll position is where. Wheel events were the other candidate and
# are more faithful to a real visitor, but they cannot be positioned exactly,
# and the case-page reel has to be scrubbable against a known scroll curve.
READY = """
(function(){
  var s = document.createElement('style');
  s.textContent = 'html,body{scroll-behavior:auto !important}';
  document.head.appendChild(s);
  return document.fonts.ready.then(function(){
    return { h: document.documentElement.scrollHeight,
             w: window.innerWidth, t: document.title,
             sb: getComputedStyle(document.documentElement).scrollBehavior };
  });
})()
"""


async def run_job(c, job, outdir, seq):
    """Film one page. Returns the frames written."""
    url = job["url"]
    W, H = job.get("w", 1440), job.get("h", 900)
    dpr = job.get("dpr", 2)

    await c.send("Emulation.setDeviceMetricsOverride",
                 {"width": W, "height": H, "deviceScaleFactor": dpr,
                  "mobile": job.get("mobile", False)})
    await c.send("Page.navigate", {"url": url})

    # settle: fonts, then the site's own entrance. Lumina's hero wipes in and
    # a frame taken through it is the exact failure this replaces.
    await asyncio.sleep(job.get("settle", 3.0))
    info = await c.send("Runtime.evaluate",
                        {"expression": READY, "returnByValue": True,
                         "awaitPromise": True})
    doc = info["result"].get("value") or {}
    print("  %-46s h=%s w=%s scroll-behavior=%s"
          % (url, doc.get("h"), doc.get("w"), doc.get("sb")))

    # Consent banners, chat bubbles and other fixed furniture sit in EVERY
    # frame of a scroll take and make a reel look like a screenshot of an
    # interruption. They are hidden for the capture — hidden, not dismissed:
    # clicking "Accept" on someone else's site to make a prettier video would
    # be consenting on their behalf, and the point of the reel is the design.
    if job.get("hide"):
        js = ("(function(){var s=document.createElement('style');"
              "s.textContent=%s+'{display:none !important}';"
              "document.head.appendChild(s)})()" % json.dumps(job["hide"]))
        await c.send("Runtime.evaluate", {"expression": js})
        await asyncio.sleep(0.3)

    # Some takes start part-way down a page — the homepage carries two pinned
    # instruments 6000px apart, and filming the scroll between them would be a
    # 4-second blur of nothing. Jump BEFORE the screencast opens, then let the
    # section settle, so the cut lands on a composed frame rather than mid-jump.
    if job.get("pre"):
        await c.send("Runtime.evaluate",
                     {"expression": "window.scrollTo(0,%f)" % job["pre"]})
        await asyncio.sleep(job.get("presettle", 1.6))

    # drain anything queued from the load before the take starts
    while not c.frames.empty():
        c.frames.get_nowait()

    await c.send("Page.startScreencast", {
        "format": "jpeg", "quality": job.get("q", 88),
        "maxWidth": W * dpr, "maxHeight": H * dpr, "everyNthFrame": 1})

    t0 = time.time()
    frames = []

    async def drain():
        while True:
            f = await c.frames.get()
            frames.append((time.time() - t0, f["data"]))
            try:
                await c.send("Page.screencastFrameAck",
                             {"sessionId": f["sessionId"]})
            except Exception:
                pass

    pump = asyncio.create_task(drain())

    # hold at the top so the entrance is IN the reel, then the take
    await asyncio.sleep(job.get("hold", 1.2))
    for (to, ms) in job["moves"]:
        await c.send("Runtime.evaluate",
                     {"expression": SCROLL % (to, ms), "returnByValue": True,
                      "awaitPromise": True})
        await asyncio.sleep(job.get("dwell", 0.5))
    await asyncio.sleep(job.get("tail", 0.4))

    pump.cancel()
    await c.send("Page.stopScreencast")

    tag = job["tag"]
    out = []
    for i, (t, data) in enumerate(frames):
        p = os.path.join(outdir, "%s_%s_%04d.jpg" % (seq, tag, i))
        with open(p, "wb") as fh:
            fh.write(base64.b64decode(data))
        out.append({"t": round(t, 4), "file": os.path.basename(p)})
    print("     %d frames over %.1fs  (%.1f fps)"
          % (len(out), frames[-1][0] if frames else 0,
             len(out) / frames[-1][0] if frames else 0))
    return {"tag": tag, "url": url, "w": W * dpr, "h": H * dpr, "frames": out}


async def main():
    jobs = json.load(open(sys.argv[1], encoding="utf-8"))
    outdir = sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    proc, ws = await launch()
    import websockets
    try:
        async with websockets.connect(ws, max_size=200 * 1024 * 1024) as sock:
            c = CDP(sock)
            await c.send("Page.enable")
            await c.send("Runtime.enable")
            man = []
            for i, job in enumerate(jobs):
                print("[%d/%d] %s" % (i + 1, len(jobs), job["tag"]))
                man.append(await run_job(c, job, outdir, "%02d" % i))
            with open(os.path.join(outdir, "manifest.json"), "w",
                      encoding="utf-8") as fh:
                json.dump(man, fh, indent=1)
            print("\nwrote %s/manifest.json" % outdir)
    finally:
        proc.kill()


asyncio.run(main())
