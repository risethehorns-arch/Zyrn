# -*- coding: utf-8 -*-
"""Does the light actually TRAVEL, and does a press actually react?

`getAnimations()` saying `running` proves an animation exists, not that
anything moves — v3 passed that check on one machine and was visually
frozen on another. This reads the rotating element's actual matrix over
time, which is the thing the reader sees.

  python glintprobe.py <url> <selector>
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9573"))

READ = """(function(sel){
  var e=document.querySelector(sel); if(!e) return JSON.stringify({none:1});
  var b=e.querySelector('.gl__b'), g=e.querySelector('.gl');
  var r=e.getBoundingClientRect();
  function deg(el){
    if(!el) return null;
    var m=getComputedStyle(el).transform;
    if(!m||m==='none') return 0;
    var p=m.replace(/matrix\\(|\\)/g,'').split(',');
    return Math.round(Math.atan2(parseFloat(p[1]),parseFloat(p[0]))*180/Math.PI);
  }
  return JSON.stringify({
    built: !!b,
    rot: deg(b),
    lit: g ? +getComputedStyle(g).opacity : -1,
    struck: e.classList.contains('is-struck'),
    x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2)
  });
})('%s')"""


async def main():
    url, sel = sys.argv[1], sys.argv[2]
    prof = os.path.join(os.environ["TEMP"], "gp-%d" % int(time.time() * 1000))
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
    async with websockets.connect(ws, max_size=32 * 1024 * 1024) as sock:
        n = {"i": 0}

        async def send(m, pp=None):
            n["i"] += 1; mine = n["i"]
            await sock.send(json.dumps({"id": mine, "method": m, "params": pp or {}}))
            while True:
                msg = json.loads(await asyncio.wait_for(sock.recv(), timeout=25))
                if msg.get("id") == mine:
                    return msg.get("result", {})

        async def ev(e):
            r = await send("Runtime.evaluate", {"expression": e, "returnByValue": True})
            return json.loads(r["result"]["value"])

        await send("Page.enable")
        await send("Network.enable")
        await send("Network.setCacheDisabled", {"cacheDisabled": True})
        await send("Emulation.setDeviceMetricsOverride",
                   {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})
        await send("Page.navigate", {"url": url})
        await asyncio.sleep(7.0)

        d = await ev(READ % sel)
        if d.get("none"):
            print("  selector not found"); proc.kill(); return
        print("  built=%s  lit=%.2f  rot=%s   (at rest)" % (d["built"], d["lit"], d["rot"]))

        await send("Input.dispatchMouseEvent",
                   {"type": "mouseMoved", "x": d["x"], "y": d["y"],
                    "button": "none", "pointerType": "mouse"})
        await asyncio.sleep(0.5)

        rots = []
        for i in range(6):
            r = await ev(READ % sel)
            rots.append(r["rot"])
            print("  hover t+%.2fs  lit=%.2f  rot=%4s" % (i * 0.32, r["lit"], r["rot"]))
            await asyncio.sleep(0.32)

        await send("Input.dispatchMouseEvent",
                   {"type": "mousePressed", "x": d["x"], "y": d["y"],
                    "button": "left", "clickCount": 1, "pointerType": "mouse"})
        await asyncio.sleep(0.20)
        p1 = await ev(READ % sel)
        print("  pressed       struck=%s  lit=%.2f" % (p1["struck"], p1["lit"]))
        await asyncio.sleep(1.3)
        p2 = await ev(READ % sel)
        print("  settled       struck=%s  lit=%.2f" % (p2["struck"], p2["lit"]))

        moved = len(set(rots)) >= 4
        print("\n  %s" % ("THE LIGHT TRAVELS (%d distinct angles)" % len(set(rots))
                          if moved else
                          "FROZEN — angles: %s" % sorted(set(rots))))
        print("  %s" % ("STRIKE FIRES AND CLEARS"
                        if p1["struck"] and not p2["struck"] else "STRIKE DID NOT CYCLE"))
    proc.kill()


asyncio.run(main())
