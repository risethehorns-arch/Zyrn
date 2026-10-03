# -*- coding: utf-8 -*-
"""THE BAY, driven with REAL input.

A screenshot proves the room is drawn. It does not prove that a slab can be
opened, that a neighbour comes to the front instead of navigating, that the
HUD moves the page, or that a drag takes the next slab — and `el.click()`
would pass on a control buried under the canvas. So everything here is a
CDP mouse / key event at the control's own centre, with a hit test first.

  python baytest.py <url-of-services.html>       (W, H from the environment)
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9641"))
W = int(os.environ.get("W", "1440")); H = int(os.environ.get("H", "900"))

STATE = """(function(){
  var t = document.querySelector('#sigBay .sig__track'), r = t.getBoundingClientRect();
  var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
  var cur = document.querySelector('.bay__pip[aria-current]');
  var vis = [].slice.call(document.querySelectorAll('.bay__p')).map(function(e){
    return getComputedStyle(e).visibility === 'visible' ? +e.dataset.i : null; }).filter(function(v){return v!==null});
  return JSON.stringify({p:+p.toFixed(4), y:Math.round(scrollY), pip: cur ? +cur.dataset.go : -1,
    step: document.getElementById('bayStep').textContent, vis: vis, href: location.pathname.split('/').pop(),
    live: document.getElementById('sigBay').classList.contains('is-live'),
    over: document.documentElement.scrollWidth - innerWidth});
})()"""

CENTRE = """(function(sel){
  var e = document.querySelector(sel); if (!e) return null;
  var r = e.getBoundingClientRect();
  var x = r.left + r.width/2, y = r.top + r.height/2;
  var h = document.elementFromPoint(x, y);
  return JSON.stringify({x:x, y:y, w:Math.round(r.width), h:Math.round(r.height),
    hit: !!(h && (h === e || e.contains(h)))});
})(%s)"""


async def main():
    url = sys.argv[1]
    prof = os.path.join(os.environ["TEMP"], "bt-%d" % int(time.time() * 1000))
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
    fails, logs = [], []
    try:
        async with websockets.connect(ws, max_size=64 * 1024 * 1024) as sock:
            n = {"i": 0}
            async def send(m, pp=None):
                n["i"] += 1; mine = n["i"]
                await sock.send(json.dumps({"id": mine, "method": m, "params": pp or {}}))
                while True:
                    msg = json.loads(await asyncio.wait_for(sock.recv(), timeout=25))
                    if msg.get("method") == "Runtime.exceptionThrown":
                        d = msg["params"]["exceptionDetails"]
                        logs.append("EXC " + (d.get("exception", {}).get("description") or d.get("text", ""))[:240])
                    if msg.get("id") == mine: return msg.get("result", {})
            async def ev(x):
                r = await send("Runtime.evaluate", {"expression": x, "returnByValue": True})
                return r.get("result", {}).get("value")
            async def state(): return json.loads(await ev(STATE))
            async def centre(sel):
                v = await ev(CENTRE % json.dumps(sel))
                return json.loads(v) if v else None
            async def click(sel, what):
                c = await centre(sel)
                if not c: fails.append("%s: no %s" % (what, sel)); return None
                if not c["hit"]: fails.append("%s: %s is covered at its centre" % (what, sel))
                for t in ("mousePressed", "mouseReleased"):
                    await send("Input.dispatchMouseEvent", {"type": t, "x": c["x"], "y": c["y"],
                                                            "button": "left", "clickCount": 1})
                return c
            async def key(k, code, vk):
                for t in ("keyDown", "keyUp"):
                    await send("Input.dispatchKeyEvent", {"type": t, "key": k, "code": code,
                                                          "windowsVirtualKeyCode": vk})
            async def settle(sec=1.9): await asyncio.sleep(sec)
            def expect(cond, what, got):
                print("  %-4s %s  %s" % ("ok" if cond else "FAIL", what, got))
                if not cond: fails.append(what)

            await send("Emulation.setDeviceMetricsOverride", {"width": W, "height": H, "deviceScaleFactor": 1, "mobile": W < 700})
            await send("Page.enable"); await send("Runtime.enable")
            await send("Page.navigate", {"url": url})
            for _ in range(60):
                await asyncio.sleep(0.25)
                if await ev("document.body.classList.contains('is-field-ready')"): break
            await asyncio.sleep(1.0)
            s = await state()
            expect(s["live"], "the instrument is live", "")
            # the room's stops are derived from how many slabs it holds, the
            # way bay.js derives them — never typed, so a slab added to the
            # markup moves every expectation below with it
            N = int(await ev("document.querySelectorAll('.bay__p').length"))
            last = await ev("(document.querySelector('.bay__p[data-i=\"%d\"]').getAttribute('href')||'').split('/').pop()" % (N - 1))
            EDGE, RUN_A, RUN_B = 0.06, 0.105, 0.895
            stop = lambda k: RUN_A + (RUN_B - RUN_A) * (EDGE + (1 - 2 * EDGE) / (N - 1) * k)

            # into the room: the HUD's own control, a real click
            await ev("window.__zyrnScrollTo((function(){var t=document.querySelector('#sigBay .sig__track'),y=0,n=t;while(n){y+=n.offsetTop;n=n.offsetParent}return y + 0.02*(t.offsetHeight-innerHeight)})(), 300)")
            await settle(1.2)
            await click('.bay__pip[data-go="0"]', "pip 01"); await settle()
            s = await state()
            expect(s["pip"] == 0 and abs(s["p"] - stop(0)) < 0.012, "pip 01 brings slab 01 to the front", "p=%s %s" % (s["p"], s["step"]))

            await click('#bayNext', "next"); await settle()
            s = await state()
            expect(s["pip"] == 1 and abs(s["p"] - stop(1)) < 0.012, "next goes to slab 02", "p=%s %s" % (s["p"], s["step"]))

            await key("ArrowRight", "ArrowRight", 39); await settle()
            s = await state()
            expect(s["pip"] == 2 and abs(s["p"] - stop(2)) < 0.012, "arrow right goes to slab 03", "p=%s %s" % (s["p"], s["step"]))
            await key("ArrowLeft", "ArrowLeft", 37); await settle()
            s = await state()
            expect(s["pip"] == 1, "arrow left goes back to slab 02", "p=%s" % s["p"])

            # a neighbour comes to the front; it does not navigate
            c = await ev("""(function(){var e=document.querySelector('.bay__p[data-i="2"]'),r=e.getBoundingClientRect();
              var x=Math.min(innerWidth-6, Math.max(6, r.left + Math.min(r.width*0.35, 60))), y=r.top+r.height*0.3;
              var h=document.elementFromPoint(x,y); return JSON.stringify({x:x,y:y,hit:!!(h&&e.contains(h))})})()""")
            c = json.loads(c)
            expect(c["hit"], "slab 03 (a neighbour) can be reached by the pointer", "")
            for t in ("mousePressed", "mouseReleased"):
                await send("Input.dispatchMouseEvent", {"type": t, "x": c["x"], "y": c["y"], "button": "left", "clickCount": 1})
            await settle()
            s = await state()
            expect(s["href"] == "services.html" and s["pip"] == 2, "clicking a neighbour brings it forward, no navigation", "%s pip=%s" % (s["href"], s["pip"]))

            # a drag takes the next slab, and the click that ends it opens nothing
            c = await centre('.bay__p[data-i="2"]')
            x0, y0 = c["x"], c["y"]
            await send("Input.dispatchMouseEvent", {"type": "mousePressed", "x": x0, "y": y0, "button": "left", "clickCount": 1})
            for k in range(1, 13):
                await send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x0 - k * (W * 0.02), "y": y0, "button": "left", "buttons": 1})
                await asyncio.sleep(0.016)
            await send("Input.dispatchMouseEvent", {"type": "mouseReleased", "x": x0 - 12 * (W * 0.02), "y": y0, "button": "left", "clickCount": 1})
            await settle()
            s = await state()
            expect(s["href"] == "services.html" and s["pip"] == 3, "a drag to the left takes slab 04", "%s pip=%s" % (s["href"], s["pip"]))

            # the closing view: every slab, any of them reachable
            await ev("window.__zyrnScrollTo((function(){var t=document.querySelector('#sigBay .sig__track'),y=0,n=t;while(n){y+=n.offsetTop;n=n.offsetParent}return y + 0.995*(t.offsetHeight-innerHeight)})(), 300)")
            await settle(1.6)
            s = await state()
            expect(len(s["vis"]) == N, "the closing view shows all %d" % N, str(s["vis"]))
            hits = json.loads(await ev("""JSON.stringify([].slice.call(document.querySelectorAll('.bay__p')).map(function(e){
              var r=e.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!(h&&e.contains(h))}))"""))
            expect(all(hits), "every slab in the closing view takes the pointer at its centre", str(hits))
            expect(s["over"] <= 0, "no sideways scroll", str(s["over"]))

            # and the slab in front OPENS
            await click('.bay__pip[data-go="%d"]' % (N - 1), "pip %02d" % N); await settle()
            await click('.bay__p[data-i="%d"] .bay__t' % (N - 1), "slab %02d" % N)
            for _ in range(40):
                await asyncio.sleep(0.2)
                h = await ev("location.pathname.split('/').pop()")
                if h == last: break
            expect(h == last, "the slab in front opens its page", str(h))
    finally:
        proc.kill()
    for l in dict.fromkeys(logs): print("  LOG", l)
    print("\n%s" % ("ALL CLEAR" if not fails and not logs else "FAILS: %s" % fails))

asyncio.run(main())
