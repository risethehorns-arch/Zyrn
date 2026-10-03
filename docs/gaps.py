# -*- coding: utf-8 -*-
"""Where is a page empty? Union of every painted content box (text runs,
panels, media, svg, canvas — not the fixed chrome, not the field), then
the vertical bands taller than MIN of the viewport that hold none of it,
and per band which element sits above and below. usage: gaps.py url..."""
import asyncio, json, os, subprocess, sys, time, urllib.request
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9781"))
SIZES = [tuple(map(int, s.split("x"))) for s in os.environ.get("VP", "2560x1260 1440x900 390x844").split()]
JS = r"""(function(){
  document.querySelectorAll('[data-reveal]').forEach(function(e){e.classList.add('is-in')});
  var main=document.querySelector('main')||document.body, boxes=[];
  var all=main.querySelectorAll('*');
  for (var i=0;i<all.length;i++){
    var e=all[i], cs=getComputedStyle(e);
    if (cs.position==='fixed'||cs.visibility==='hidden'||cs.display==='none') continue;
    var tag=e.tagName, own=false;
    for (var c=e.firstChild;c;c=c.nextSibling) if (c.nodeType===3&&c.nodeValue.trim()) {own=true;break;}
    var media=/^(IMG|VIDEO|CANVAS|svg)$/.test(tag);
    var panel=(cs.borderTopWidth!=='0px'&&cs.borderTopStyle!=='none')||(cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&cs.backgroundColor!=='transparent');
    if (!own&&!media&&!panel) continue;
    var r=e.getBoundingClientRect(); if (r.width<2||r.height<2) continue;
    if (panel&&!own&&!media&&r.height<4) { /* hairlines count */ }
    boxes.push([r.top+scrollY, r.bottom+scrollY, r.left, r.right, (e.className&&e.className.baseVal===undefined?e.className:tag).toString().slice(0,40)]);
  }
  boxes.sort(function(a,b){return a[0]-b[0]});
  var H=innerHeight, gaps=[], reach=0, last='(top)';
  for (var j=0;j<boxes.length;j++){
    var b=boxes[j];
    if (b[0]-reach > 0.22*H) gaps.push({from:Math.round(reach),to:Math.round(b[0]),h:Math.round(b[0]-reach),pct:Math.round(100*(b[0]-reach)/H),above:last,below:b[4]});
    if (b[1]>reach){reach=b[1]; last=b[4];}
  }
  /* wide sections: how much of each section's width is used */
  var secs=[].slice.call(main.querySelectorAll(':scope > section, :scope > div.runway')).map(function(s){
    var r=s.getBoundingClientRect(); return {k:(s.id||s.className).toString().slice(0,26), top:Math.round(r.top+scrollY), h:Math.round(r.height)};
  });
  return JSON.stringify({W:innerWidth,H:H,doc:document.documentElement.scrollHeight,gaps:gaps,secs:secs});
})()"""
async def run(url):
    prof = os.path.join(os.environ["TEMP"], "gp-%d" % int(time.time()*1000))
    proc = subprocess.Popen([CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT, "--remote-allow-origins=*",
        "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--window-size=1440,900", "--user-data-dir="+prof, "about:blank"],
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
    try:
        async with websockets.connect(ws, max_size=64*1024*1024) as sock:
            n = {"i": 0}
            async def send(m, pp=None):
                n["i"] += 1; mine = n["i"]
                await sock.send(json.dumps({"id": mine, "method": m, "params": pp or {}}))
                while True:
                    msg = json.loads(await sock.recv())
                    if msg.get("id") == mine: return msg.get("result", {})
            await send("Page.enable")
            for W, H in SIZES:
                await send("Emulation.setDeviceMetricsOverride", {"width": W, "height": H, "deviceScaleFactor": 1, "mobile": W < 900})
                await send("Page.navigate", {"url": url}); await asyncio.sleep(4)
                d = json.loads((await send("Runtime.evaluate", {"expression": JS, "returnByValue": True}))["result"]["value"])
                print("\n%s  %dx%d  doc %dpx" % (url.split('/')[-1], W, H, d["doc"]))
                for g in d["gaps"]:
                    print("   gap %5d..%-5d %4dpx = %3d%% of a screen   after [%s]  before [%s]" % (g["from"], g["to"], g["h"], g["pct"], g["above"], g["below"]))
                if os.environ.get("SECS"):
                    for s_ in d["secs"]: print("      %-28s top %5d h %5d" % (s_["k"], s_["top"], s_["h"]))
    finally: proc.kill()
for u in sys.argv[1:]: asyncio.run(run(u))
