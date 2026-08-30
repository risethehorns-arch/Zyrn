# -*- coding: utf-8 -*-
"""Measure index.html's section centres as scroll progress.

CLAUDE.md hard rule: adding or removing a section on the landing page
re-anchors the field, because `program` stops are section centres expressed as
scroll progress and everything below an inserted section moves. Re-measure at
1440x900 AND 390x844 and take the mean — do not nudge by eye.

`offsetTop` / `offsetHeight`, never getBoundingClientRect: the rect includes
transforms, and every section on this page carries a reveal transform. That
distinction has already cost this project one silent, multi-day bug.

  python anchor.py <url>
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9492"))

JS = """
(function(){
  var out = [], seen = {};
  function add(name, el){
    if (!el || seen[name]) return;
    seen[name] = 1;
    var top = 0, n = el;
    while (n) { top += n.offsetTop; n = n.offsetParent; }
    out.push({ name: name, top: Math.round(top),
               h: Math.round(el.offsetHeight),
               mid: Math.round(top + el.offsetHeight / 2) });
  }
  document.querySelectorAll('[data-sys-section]').forEach(function(el){
    add('SYS.0' + el.getAttribute('data-sys-section'), el);
  });
  add('PROD', document.getElementById('production'));
  out.sort(function(a,b){ return a.top - b.top; });
  var run = document.documentElement.scrollHeight - window.innerHeight;
  return JSON.stringify({ run: run,
    doc: document.documentElement.scrollHeight, vh: window.innerHeight,
    rows: out.map(function(o){
      return { name: o.name, top: o.top, h: o.h,
               p: +(o.mid / run).toFixed(4) };
    })});
})()
"""


async def main():
    url = sys.argv[1]
    prof = os.path.join(os.environ["TEMP"], "an-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars",
        "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
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
    got = {}
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
        for (W, H) in [(1440, 900), (390, 844)]:
            await send("Emulation.setDeviceMetricsOverride",
                       {"width": W, "height": H, "deviceScaleFactor": 1,
                        "mobile": W < 900})
            await send("Page.navigate", {"url": url})
            await asyncio.sleep(7.0)
            r = await send("Runtime.evaluate",
                           {"expression": JS, "returnByValue": True})
            d = json.loads(r["result"]["value"])
            got["%dx%d" % (W, H)] = d
            print("\n%dx%d   document %spx, scrollable run %spx"
                  % (W, H, d["doc"], d["run"]))
            for row in d["rows"]:
                print("  %-8s top=%-6s h=%-5s  centre at %.3f"
                      % (row["name"], row["top"], row["h"], row["p"]))
    proc.kill()

    a = {r["name"]: r["p"] for r in got["1440x900"]["rows"]}
    b = {r["name"]: r["p"] for r in got["390x844"]["rows"]}
    print("\n  %-8s %8s %8s %8s %8s" % ("", "1440", "390", "mean", "spread"))
    for k in [r["name"] for r in got["1440x900"]["rows"]]:
        if k in b:
            print("  %-8s %8.3f %8.3f %8.3f %8.3f"
                  % (k, a[k], b[k], (a[k] + b[k]) / 2, abs(a[k] - b[k])))


asyncio.run(main())
