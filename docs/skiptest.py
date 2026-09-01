# -*- coding: utf-8 -*-
"""Does the skip control exist on every pinned track, and does it work?

`el.click()` is not enough here — it dispatches straight at the node and
skips hit testing, so it would happily "prove" a button buried under an
overlay. This dispatches a real mouse press at the button's own centre,
then reads the scroll position back after the smooth scroll settles.

  python skiptest.py <url> [<url> ...]
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9557"))

COUNT = """(function(){
  return JSON.stringify({
    tracks: document.querySelectorAll(
      '.sig__track,.rk__track,.wp__track,.rb__track,.in__track').length,
    skips: document.querySelectorAll('.skip').length
  });
})()"""

# park at the middle of the first track, then report where the button is
PARK = """(function(){
  var t=document.querySelector('.sig__track,.rk__track,.wp__track,.rb__track,.in__track');
  var top=0,n=t; while(n){top+=n.offsetTop;n=n.offsetParent;}
  window.scrollTo(0, top + t.offsetHeight*0.45);
  return JSON.stringify({y:Math.round(window.scrollY),
                         end:Math.round(top+t.offsetHeight)});
})()"""

WHERE = """(function(){
  var b=document.querySelector('.skip');
  if(!b) return JSON.stringify({none:1});
  var r=b.getBoundingClientRect();
  var cx=Math.round(r.left+r.width/2), cy=Math.round(r.top+r.height/2);
  var hit=document.elementFromPoint(cx,cy);
  return JSON.stringify({
    x:cx, y:cy, on:b.classList.contains('is-on'),
    w:Math.round(r.width), h:Math.round(r.height),
    // the element the pointer would actually land on: the button or a child
    reach: !!(hit && (hit===b || b.contains(hit))),
    scroll: Math.round(window.scrollY)
  });
})()"""


async def main():
    urls = sys.argv[1:]
    prof = os.path.join(os.environ["TEMP"], "sk-%d" % int(time.time() * 1000))
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
    bad = 0
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
        for url in urls:
            name = url.rsplit("/", 1)[-1]
            await send("Page.navigate", {"url": url})
            await asyncio.sleep(6.0)
            c = await ev(COUNT)
            parked = await ev(PARK)
            await asyncio.sleep(1.4)
            w = await ev(WHERE)
            flags = []
            if c["skips"] != c["tracks"]:
                flags.append("%d skip(s) for %d track(s)" % (c["skips"], c["tracks"]))
            if w.get("none"):
                flags.append("NO BUTTON")
            else:
                if not w["on"]:
                    flags.append("not visible mid-track")
                if not w["reach"]:
                    flags.append("BURIED — a real tap would not reach it")
                if w["h"] < 30:
                    flags.append("tap %dpx" % w["h"])
                # the real press
                for kind in ("mousePressed", "mouseReleased"):
                    await send("Input.dispatchMouseEvent",
                               {"type": kind, "x": w["x"], "y": w["y"],
                                "button": "left", "clickCount": 1,
                                "pointerType": "mouse"})
                await asyncio.sleep(2.6)
                after = await ev(WHERE)
                moved = after["scroll"] - w["scroll"]
                if moved < 200:
                    flags.append("CLICK MOVED %dpx" % moved)
                if after["scroll"] < parked["end"] - 1000:
                    flags.append("landed short of the track end")
                w["moved"] = moved
            bad += 0 if not flags else 1
            print("  %-34s tracks %d  skips %d  %dx%d  moved %+5dpx  %s"
                  % (name, c["tracks"], c["skips"], w.get("w", 0), w.get("h", 0),
                     w.get("moved", 0), "ok" if not flags else "<-- " + "; ".join(flags)),
                  flush=True)
    proc.kill()
    print("\n%s" % ("ALL CLEAR" if bad == 0 else "%d page(s) failing" % bad))


asyncio.run(main())
