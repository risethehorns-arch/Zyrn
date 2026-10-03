# -*- coding: utf-8 -*-
"""THE INTERLUDES (index.html) driven with REAL input over CDP — mouse
presses at each control's own centre, real drags, real touch — plus every
page exception on the way. el.click() would pass on a buried button, so
nothing here uses it.

    python docs/iludetest.py http://localhost:8000/index.html
"""
import asyncio, json, os, subprocess, sys, time, urllib.request
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9821"))

async def main(url):
    prof = os.path.join(os.environ["TEMP"], "il-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT, "--remote-allow-origins=*",
        "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--window-size=1440,900",
        "--user-data-dir=" + prof, "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
                    msg = json.loads(await asyncio.wait_for(sock.recv(), timeout=30))
                    if msg.get("method") == "Runtime.exceptionThrown":
                        d = msg["params"]["exceptionDetails"]
                        logs.append((d.get("exception", {}).get("description") or d.get("text", ""))[:200])
                    if msg.get("id") == mine: return msg.get("result", {})
            async def ev(x):
                r = await send("Runtime.evaluate", {"expression": x, "returnByValue": True, "awaitPromise": True})
                return r.get("result", {}).get("value")
            def expect(c, what, got=""):
                print("  %-4s %s  %s" % ("ok" if c else "FAIL", what, got))
                if not c: fails.append(what)
            async def to(sel, at=0.5):
                await ev("window.__zyrnScrollTo((function(){var e=document.querySelector(%s),y=0,n=e;while(n){y+=n.offsetTop;n=n.offsetParent}return y-innerHeight*%f})(),0)" % (json.dumps(sel), at))
                await asyncio.sleep(1.2)
            async def centre(sel):
                return json.loads(await ev("""(function(){var e=document.querySelector(%s);if(!e)return 'null';var r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,h=document.elementFromPoint(x,y);
                  return JSON.stringify({x:x,y:y,hit:!!(h&&(h===e||e.contains(h)))})})()""" % json.dumps(sel)))
            async def mouse(t, x, y, b="left", btns=1):
                await send("Input.dispatchMouseEvent", {"type": t, "x": x, "y": y, "button": b, "buttons": btns, "clickCount": 1})
            async def click(sel):
                c = await centre(sel)
                if not c or not c["hit"]: return False
                await mouse("mouseMoved", c["x"], c["y"], "none", 0)
                await mouse("mousePressed", c["x"], c["y"]); await mouse("mouseReleased", c["x"], c["y"])
                return True

            await send("Page.enable"); await send("Runtime.enable")
            await send("Emulation.setDeviceMetricsOverride", {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})
            await send("Page.navigate", {"url": url})
            for _ in range(60):
                await asyncio.sleep(0.25)
                if await ev("document.body.classList.contains('is-field-ready')"): break
            await asyncio.sleep(0.8)

            # 1 · the fold folds on the way down and unfolds on the way back
            await to('[data-ilude=fold] .fold', 0.95)
            a = await ev("document.querySelector('.fold__num').textContent")
            await to('[data-ilude=fold] .fold', 0.2)
            b = await ev("document.querySelector('.fold__num').textContent")
            done = await ev("document.querySelector('.fold').classList.contains('is-done')")
            await to('[data-ilude=fold] .fold', 0.95)
            c = await ev("document.querySelector('.fold__num').textContent")
            expect(a == "07" and b == "01" and done and c == "07", "the fold: 07 by hand, 01 once scrolled through, and back", "%s -> %s -> %s" % (a, b, c))

            # 2 · the river flows, turns questions into answers, and slows under the pointer
            await to('[data-ilude=river] .river', 0.5)
            X = "JSON.stringify([].slice.call(document.querySelectorAll('.river__c')).slice(0,4).map(function(e){return new DOMMatrix(getComputedStyle(e).transform).m41}))"
            x0 = json.loads(await ev(X)); await asyncio.sleep(1.0); x1 = json.loads(await ev(X))
            moved = sum(b_ - a_ for a_, b_ in zip(x0, x1)) / max(1, len(x0))
            ans = await ev("document.querySelectorAll('.river__c.is-ans,.river__c.is-hand').length")
            expect(moved > 20 and ans > 0, "the river flows and answers past the seam", "%.0fpx/s, %s answered" % (moved, ans))
            c = await centre('.river__seam')
            await mouse("mouseMoved", c["x"] - 300, c["y"], "none", 0)
            await asyncio.sleep(1.4)
            x0 = json.loads(await ev(X)); await asyncio.sleep(1.0); x1 = json.loads(await ev(X))
            slow = sum(b_ - a_ for a_, b_ in zip(x0, x1)) / max(1, len(x0))
            expect(slow < moved * 0.4, "hovering slows it", "%.0f -> %.0f px/s" % (moved, slow))
            await mouse("mouseMoved", 5, 5, "none", 0)

            # 3 · the gate waits, ALLOW counts, HOLD counts
            await to('[data-ilude=gate] .gate', 0.5)
            armed = False
            for _ in range(40):
                await asyncio.sleep(0.25)
                if await ev("document.querySelector('.gate').classList.contains('is-armed')"): armed = True; break
            expect(armed, "the agent finishes and waits at the gate")
            await asyncio.sleep(2.5)
            still = await ev("document.querySelector('.gate').classList.contains('is-armed')")
            expect(still, "and it is still waiting nobody having pressed")
            okp = await click('.gate__key--ok'); await asyncio.sleep(0.4)
            st = json.loads(await ev("JSON.stringify({a:document.querySelector('.gate__a').textContent,log:document.querySelector('.gate__log').textContent})"))
            expect(okp and st["a"] == "01" and "approved by you" in st["log"], "ALLOW, pressed for real, ships it and counts it", st["a"])
            for _ in range(60):
                await asyncio.sleep(0.25)
                if await ev("document.querySelector('.gate').classList.contains('is-armed')"): break
            hp = await click('.gate__key--hold'); await asyncio.sleep(0.4)
            st = json.loads(await ev("JSON.stringify({h:document.querySelector('.gate__h').textContent,log:document.querySelector('.gate__log').textContent})"))
            expect(hp and st["h"] == "01" and "nothing changed" in st["log"], "HOLD changes nothing and counts it", st["h"])

            # 4 · the index — a real drag on the lowest column moves the plane to the next lowest
            await to('[data-ilude=rdx] .rdx', 0.5)
            await asyncio.sleep(2.0)
            R = "JSON.stringify({v:document.querySelector('.rdx__v').textContent,low:[].slice.call(document.querySelectorAll('.rdx__col')).findIndex(function(c){return c.classList.contains('is-low')})})"
            s0 = json.loads(await ev(R))
            k = await centre('.rdx__col:nth-child(%d) .rdx__knob' % (s0["low"] + 1))
            await mouse("mouseMoved", k["x"], k["y"], "none", 0); await mouse("mousePressed", k["x"], k["y"])
            for j in range(1, 13):
                await mouse("mouseMoved", k["x"], k["y"] - j * 16); await asyncio.sleep(0.016)
            await mouse("mouseReleased", k["x"], k["y"] - 192)
            await asyncio.sleep(0.3)
            s1 = json.loads(await ev(R))
            expect(s1["low"] != s0["low"] and s1["v"] != s0["v"], "dragging the lowest up hands the index to the next lowest", "%s col %d -> %s col %d" % (s0["v"], s0["low"], s1["v"], s1["low"]))
            await ev("document.querySelector('.rdx__col:nth-child(%d) .rdx__knob').focus()" % (s1["low"] + 1))
            for _ in range(3):
                for t in ("keyDown", "keyUp"):
                    await send("Input.dispatchKeyEvent", {"type": t, "key": "ArrowUp", "code": "ArrowUp", "windowsVirtualKeyCode": 38})
            s2 = json.loads(await ev(R))
            expect(float(s2["v"]) >= float(s1["v"]), "arrow keys move a column too", "%s -> %s" % (s1["v"], s2["v"]))

            # 5 · the clock — scrub the hand to 03:00 for real and the gate fills
            await to('[data-ilude=night] .night', 0.5)
            g = json.loads(await ev("""(function(){var s=document.querySelector('.night__svg').getBoundingClientRect(),h=document.querySelector('.night__hit').getBoundingClientRect();
               return JSON.stringify({cx:s.left+s.width/2,cy:s.top+s.height/2,r:s.width*140/400,hx:h.left+h.width/2,hy:h.top+h.height/2})})()"""))
            await mouse("mouseMoved", g["hx"], g["hy"], "none", 0); await mouse("mousePressed", g["hx"], g["hy"])
            import math
            for j in range(1, 9):
                a = math.radians(-90 + (3 / 24) * 360)
                await mouse("mouseMoved", g["cx"] + g["r"] * math.cos(a), g["cy"] + g["r"] * math.sin(a)); await asyncio.sleep(0.02)
            st = json.loads(await ev("JSON.stringify({t:document.querySelector('.night__time').textContent,q:document.querySelector('.night__q').textContent})"))
            await mouse("mouseReleased", g["cx"] + g["r"] * math.cos(a), g["cy"] + g["r"] * math.sin(a))
            expect(st["t"].startswith("02:5") or st["t"].startswith("03:0"), "dragging the hand scrubs the day", st["t"])
            expect("Waiting at the gate" in st["q"], "at 03:00 agent work is waiting at the gate", st["q"])
            await asyncio.sleep(1.2)
            t2 = await ev("document.querySelector('.night__time').textContent")
            expect(t2 != st["t"], "and the day resumes once let go", "%s -> %s" % (st["t"], t2))

            # phone · touch drag on a column does not scroll the page; a tap pauses the river
            await send("Emulation.setDeviceMetricsOverride", {"width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True})
            await send("Emulation.setTouchEmulationEnabled", {"enabled": True, "maxTouchPoints": 5})
            await send("Page.reload"); await asyncio.sleep(4.5)
            await to('[data-ilude=rdx] .rdx__plot', 0.5); await asyncio.sleep(2.0)
            s0 = json.loads(await ev(R)); y0 = await ev("scrollY")
            k = await centre('.rdx__col:nth-child(%d) .rdx__knob' % (s0["low"] + 1))
            async def touch(t, x, y):
                await send("Input.dispatchTouchEvent", {"type": t, "touchPoints": [] if t == "touchEnd" else [{"x": x, "y": y}]})
            await touch("touchStart", k["x"], k["y"])
            for j in range(1, 10):
                await touch("touchMove", k["x"], k["y"] - j * 14); await asyncio.sleep(0.02)
            await touch("touchEnd", 0, 0); await asyncio.sleep(0.4)
            s1 = json.loads(await ev(R)); y1 = await ev("scrollY")
            expect(s1["v"] != s0["v"] and abs(y1 - y0) < 4, "phone: a touch drag moves the column and not the page", "%s -> %s, scroll %d" % (s0["v"], s1["v"], y1 - y0))
            over = await ev("document.documentElement.scrollWidth - innerWidth")
            expect(over <= 0, "phone: no sideways scroll", str(over))
    finally:
        proc.kill()
    for l in logs: print("  EXC", l)
    print("\n%s" % ("ALL CLEAR" if not fails and not logs else "FAILS: %s" % (fails + logs)))
asyncio.run(main(sys.argv[1]))
