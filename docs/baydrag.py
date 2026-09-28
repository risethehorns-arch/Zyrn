# -*- coding: utf-8 -*-
"""THE BAY: does a drag hand over without a swing-back?

v1's defect: release a slab part-way to the next and it swung BACK toward
where it came from before going forward, because the drag offset decayed
faster than the scroll it handed over to could move. A screenshot cannot
see that; a per-frame trace can. This drags with real mouse events, logs
slab 01's x position every animation frame from press to settle, and
reports:

  · reversals after release — the direction of travel must not flip
    (beyond sub-pixel noise) once the hand lets go
  · the largest single-frame jump, anywhere — a jump is a snap
  · where it came to rest, which must be the slab the release implied

  python baydrag.py <url-of-services.html>      (W, H from the environment)
"""
import asyncio, json, os, subprocess, sys, time, urllib.request
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9671"))
W = int(os.environ.get("W", "1440")); H = int(os.environ.get("H", "900"))

GO = """(function(p){var t=document.querySelector('#sigBay .sig__track'),y=0,n=t;while(n){y+=n.offsetTop;n=n.offsetParent}
  window.__zyrnScrollTo(y + p*(t.offsetHeight-innerHeight), 300); return 1})(%s)"""
TRACE = """(function(){window.__tr=[];var el=document.querySelectorAll('.bay__p')[1];
  function f(){var m=/translate3d\\(([-\\d.]+)px/.exec(el.style.transform);
    window.__tr.push([performance.now(), m?+m[1]:null, (document.querySelector('.bay__pip[aria-current]')||{dataset:{}}).dataset.go]);
    if(window.__tr.length<900) requestAnimationFrame(f)}
  requestAnimationFrame(f); return 1})()"""

async def main():
    url = sys.argv[1]
    prof = os.path.join(os.environ["TEMP"], "bd-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
        "--use-gl=angle", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist",
        "--window-size=%d,%d" % (max(W, 500), H), "--user-data-dir=" + prof, "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ws = None
    for _ in range(80):
        try:
            with urllib.request.urlopen("http://127.0.0.1:%d/json/list" % PORT, timeout=1) as r:
                p = [t for t in json.load(r) if t.get("type") == "page"]
            if p: ws = p[0]["webSocketDebuggerUrl"]; break
        except Exception: pass
        time.sleep(0.25)
    import websockets
    bad = 0
    try:
        async with websockets.connect(ws, max_size=64 * 1024 * 1024) as sock:
            n = {"i": 0}
            async def send(m, pp=None):
                n["i"] += 1; mine = n["i"]
                await sock.send(json.dumps({"id": mine, "method": m, "params": pp or {}}))
                while True:
                    msg = json.loads(await asyncio.wait_for(sock.recv(), timeout=30))
                    if msg.get("id") == mine: return msg.get("result", {})
            async def ev(x):
                r = await send("Runtime.evaluate", {"expression": x, "returnByValue": True})
                return r.get("result", {}).get("value")
            await send("Emulation.setDeviceMetricsOverride", {"width": W, "height": H, "deviceScaleFactor": 1, "mobile": False})
            await send("Page.enable")
            await send("Page.navigate", {"url": url})
            for _ in range(60):
                await asyncio.sleep(0.25)
                if await ev("document.body.classList.contains('is-field-ready')"): break
            await asyncio.sleep(1.2)

            # how far the hand moves per slab, read off the room at rest: the
            # distance between slab 01 and slab 02 on screen. Every case is
            # in SLABS, so the same gesture means the same thing on a phone.
            await ev(GO % 0.1524); await asyncio.sleep(2.2)
            step = await ev("(function(){var p=document.querySelectorAll('.bay__p'),a=p[0].getBoundingClientRect(),b=p[1].getBoundingClientRect();return (b.left+b.width/2)-(a.left+a.width/2)})()")
            print("  one slab = %.0fpx of hand" % step)
            # (name, total drag in slabs, duration ms, expected pip)
            cases = [("slow drag past half-way", -0.62, 700, "1"),
                     ("slow drag short of half", -0.30, 700, "0"),
                     ("short flick", -0.18, 90, "1"),
                     ("drag and come back", None, 900, "0")]
            for name, frac, dur, want in cases:
                await ev(GO % 0.1524); await asyncio.sleep(2.2)
                c = json.loads(await ev("(function(){var r=document.querySelectorAll('.bay__p')[0].getBoundingClientRect();return JSON.stringify([r.left+r.width/2,r.top+r.height/2])})()"))
                x0, y0 = c
                await ev(TRACE)
                await send("Input.dispatchMouseEvent", {"type": "mousePressed", "x": x0, "y": y0, "button": "left", "clickCount": 1})
                steps = max(4, dur // 16)
                path = []
                for k in range(1, steps + 1):
                    t = k / steps
                    if frac is None:          # out to half a slab and back to a tenth
                        dx = step * (-0.5 * min(1, t * 2) + 0.4 * max(0, t * 2 - 1))
                    else:
                        dx = step * frac * t
                    path.append(dx)
                    await send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x0 + dx, "y": y0, "button": "left", "buttons": 1})
                    await asyncio.sleep(dur / steps / 1000)
                await send("Input.dispatchMouseEvent", {"type": "mouseReleased", "x": x0 + path[-1], "y": y0, "button": "left", "clickCount": 1})
                await ev("window.__rel = performance.now()")
                await asyncio.sleep(2.4)
                t_rel = await ev("window.__rel") - 40
                tr = await ev("JSON.stringify(window.__tr)")
                tr = [r for r in json.loads(tr) if r[1] is not None]
                after = [r for r in tr if r[0] >= t_rel]
                jumps = max(abs(tr[i][1] - tr[i - 1][1]) for i in range(1, len(tr)))
                # direction after release: count sign flips of the per-frame delta, ignoring < 0.4px
                ds = [after[i][1] - after[i - 1][1] for i in range(1, len(after))]
                ds = [d for d in ds if abs(d) > 0.4]
                flips = sum(1 for i in range(1, len(ds)) if (ds[i] > 0) != (ds[i - 1] > 0))
                rest = tr[-1][2]
                # a flick may overshoot once and settle (a spring's single return) — no more
                # Going on to the next slab, the travel after release must never
                # reverse. Returning to the same slab, it reverses exactly once —
                # that IS the return — and never a second time.
                allowed = 1 if want == "0" and frac is not None else 0
                ok = flips <= allowed and rest == want and jumps < step * 0.12
                bad += not ok
                print("  %-4s %-28s frames %3d  reversals after release %d  biggest frame step %5.1fpx  rests on pip %s (want %s)"
                      % ("ok" if ok else "FAIL", name, len(tr), flips, jumps, rest, want))
    finally:
        proc.kill()
    print("\nALL CLEAR" if not bad else "\n%d FAIL" % bad)

asyncio.run(main())
