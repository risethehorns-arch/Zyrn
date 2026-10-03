# -*- coding: utf-8 -*-
"""The seven-channel tab strip: does the Pulse marker sit over the active
tab, do names wrap, and does the strip fit, at several widths?"""
import asyncio, json, os, subprocess, sys, time, urllib.request
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9691"))
SIZES = [(1920, 1080), (1440, 900), (1280, 820), (1024, 760), (900, 700), (390, 844)]
JS = """(function(){
  var tabs=document.querySelector('.tabs'), act=tabs.querySelector('.tab.is-active');
  var tr=tabs.getBoundingClientRect(), ar=act.getBoundingClientRect();
  var m=getComputedStyle(act,'::before'); var mw=parseFloat(m.width); var mx=new DOMMatrixReadOnly(m.transform).m41;
  var left=parseFloat(m.left)||0;
  var markerL = (m.position==='absolute' && m.top==='0px' && m.height==='2px') ? (tr.left+left+mx) : (ar.left);
  var markerR = (m.height==='2px') ? markerL+mw : ar.right;
  var names=[].slice.call(tabs.querySelectorAll('.tab__name')).map(function(n){var r=n.getBoundingClientRect();return [n.textContent, Math.round(r.height/parseFloat(getComputedStyle(n).lineHeight))]});
  return JSON.stringify({cols:getComputedStyle(tabs).gridTemplateColumns.split(' ').length, markerL:Math.round(markerL), markerR:Math.round(markerR), act:[Math.round(ar.left),Math.round(ar.right)], tabsW:Math.round(tr.width), over:document.documentElement.scrollWidth-innerWidth, lines:names.map(function(n){return n[1]}), active:act.querySelector('.tab__name').textContent});
})()"""
async def main():
    url = sys.argv[1]
    prof = os.path.join(os.environ["TEMP"], "tb-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT, "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars", "--window-size=1440,900", "--user-data-dir=" + prof, "about:blank"],
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
                    msg = json.loads(await sock.recv())
                    if msg.get("id") == mine: return msg.get("result", {})
            await send("Page.enable")
            await send("Page.navigate", {"url": url})
            await asyncio.sleep(4)
            for W, H in SIZES:
                await send("Emulation.setDeviceMetricsOverride", {"width": W, "height": H, "deviceScaleFactor": 1, "mobile": W < 700})
                await asyncio.sleep(0.8)
                r = await send("Runtime.evaluate", {"expression": JS, "returnByValue": True})
                d = json.loads(r["result"]["value"])
                wide = W > 1023
                mok = (not wide) or (abs(d["markerL"] - d["act"][0]) <= 2 and abs(d["markerR"] - d["act"][1]) <= 2)
                lok = max(d["lines"]) <= (1 if W >= 1280 else 2)
                ok = mok and lok and d["over"] <= 0
                bad += not ok
                print("  %-9s cols %d  marker %4d..%-4d active %4d..%-4d  lines %s  over %d  %s" % ("%dx%d" % (W, H), d["cols"], d["markerL"], d["markerR"], d["act"][0], d["act"][1], d["lines"], d["over"], "ok" if ok else "FAIL"))
    finally:
        proc.kill()
    print("ALL CLEAR" if not bad else "%d FAIL" % bad)
asyncio.run(main())
