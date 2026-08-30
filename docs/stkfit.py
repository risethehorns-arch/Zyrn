# -*- coding: utf-8 -*-
"""Measure THE STACK's projected footprint against the things it must not hit.

A 3D explode overflows its own layout box by definition — the layers are
translated in Z and the perspective magnifies them, so the box the browser
reserved is not the box you see. getBoundingClientRect DOES report the
projected rect for a transformed element, which makes this measurable rather
than a matter of opinion.

Reports, at open = 1: the union of the six layers, and whether it collides
with the step readout above it or the note below it.

  python stkfit.py <url>
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9499"))

JS = """
(function(){
  var stk = document.getElementById('stk');
  stk.style.setProperty('--open','1');
  stk.style.setProperty('--drift','0');
  /* worst case: the BOTTOM layer pulled all the way to the front, which is
     the largest the projected union ever gets */
  stk.setAttribute('data-act','0');
  var ls0 = document.querySelectorAll('.stk__l');
  for (var q=0;q<ls0.length;q++) ls0[q].classList.toggle('is-lit', q===0);
  function r(sel){var e=document.querySelector(sel);if(!e)return null;
    var b=e.getBoundingClientRect();
    return {l:Math.round(b.left),t:Math.round(b.top),
            r:Math.round(b.right),b:Math.round(b.bottom)};}
  var ls = [].slice.call(document.querySelectorAll('.stk__l'));
  var u = null;
  ls.forEach(function(e){
    var b = e.getBoundingClientRect();
    if(!u) u = {l:b.left,t:b.top,r:b.right,b:b.bottom};
    else { u.l=Math.min(u.l,b.left); u.t=Math.min(u.t,b.top);
           u.r=Math.max(u.r,b.right); u.b=Math.max(u.b,b.bottom); }
  });
  u = {l:Math.round(u.l),t:Math.round(u.t),r:Math.round(u.r),b:Math.round(u.b)};
  var head = r('#sigStack .sig__head'), note = r('#stkNote'),
      key = r('#stkKey'), view = r('.stk__view');
  function hit(a,b){ if(!a||!b) return 0;
    var x = Math.min(a.r,b.r)-Math.max(a.l,b.l);
    var y = Math.min(a.b,b.b)-Math.max(a.t,b.t);
    return (x>0&&y>0) ? Math.round(Math.min(x,y)) : 0; }
  return JSON.stringify({vw:innerWidth, vh:innerHeight,
    union:u, view:view, head:head, note:note, key:key,
    offLeft: Math.max(0, -u.l), offRight: Math.max(0, u.r-innerWidth),
    offTop: Math.max(0, -u.t), offBottom: Math.max(0, u.b-innerHeight),
    hitHead: hit(u,head), hitNote: hit(u,note), hitKey: hit(u,key)});
})()
"""


async def main():
    url = sys.argv[1]
    prof = os.path.join(os.environ["TEMP"], "sf-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars",
        "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
        "--window-size=2600,1200", "--user-data-dir=" + prof, "about:blank",
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
    async with websockets.connect(ws, max_size=64 * 1024 * 1024) as sock:
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
        bad = 0
        for (W, H) in [(1920, 1080), (1440, 900), (1180, 800), (900, 700),
                       (2530, 500), (393, 610), (360, 640)]:
            await send("Emulation.setDeviceMetricsOverride",
                       {"width": W, "height": H, "deviceScaleFactor": 1,
                        "mobile": W < 900})
            await send("Page.navigate", {"url": url})
            await asyncio.sleep(5.0)
            await send("Runtime.evaluate", {"expression":
                "(function(){var e=document.querySelector('#sigStack .sig__track');"
                "window.scrollTo(0,e.offsetTop+(e.offsetHeight-window.innerHeight)*0.5)})()"})
            await asyncio.sleep(1.4)
            r = await send("Runtime.evaluate",
                           {"expression": JS, "returnByValue": True})
            d = json.loads(r["result"]["value"])
            flags = []
            for k, label in (("offLeft", "L"), ("offRight", "R"),
                             ("offTop", "T"), ("offBottom", "B")):
                if d[k] > 2:
                    flags.append("%s%+d" % (label, d[k]))
            for k, label in (("hitHead", "HEAD"), ("hitNote", "NOTE"),
                             ("hitKey", "KEY")):
                if d[k] > 2:
                    flags.append("%s %dpx" % (label, d[k]))
            ok = not flags
            bad += 0 if ok else 1
            print("  %-10s union %5d..%-5d x %5d..%-5d   %s"
                  % ("%dx%d" % (W, H), d["union"]["l"], d["union"]["r"],
                     d["union"]["t"], d["union"]["b"],
                     "ok" if ok else "  <-- " + ", ".join(flags)))
        print("\n%s" % ("ALL CLEAR" if bad == 0 else "%d viewport(s) failing" % bad))
    proc.kill()


asyncio.run(main())
