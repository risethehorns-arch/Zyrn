# -*- coding: utf-8 -*-
"""THE SHAPE, exercised like a reader: click a chip, DRAG the slider,
arrow-key a group, and confirm the figure, manifest and mailto all move.

Real events only — pointer sequences via Input.dispatchMouseEvent, keys
via Input.dispatchKeyEvent onto the focused element. el.click() proves
nothing on a page whose failure mode is an overlay swallowing taps.
"""
import asyncio, base64, json, os, subprocess, sys, time, urllib.request
CHROME=r"C:\Program Files\Google\Chrome\Application\chrome.exe"; PORT=9481

SCROLLTO = """(function(){
  document.getElementById('shapeSec').scrollIntoView({block:'center'});
  return '1';
})()"""
STATE = """(function(){
  var host=document.querySelector('.shape');
  var chips=host.querySelectorAll('.shape__chips')[%d].querySelectorAll('.shape__chip');
  var on=-1; chips.forEach(function(c,i){if(c.classList.contains('is-on'))on=i});
  var man=[].map.call(host.querySelectorAll('.shape__mv'),function(v){return v.textContent}).join('|');
  var cta=host.querySelector('.shape__cta');
  var sl=host.querySelector('.shape__sl');
  var lit=host.querySelector('.sh__lit');
  var m=lit?getComputedStyle(lit).transform:null;
  return JSON.stringify({on:on,man:man,sub:decodeURIComponent((cta.href.split('subject=')[1]||'')),
    slv:sl?sl.getAttribute('aria-valuenow'):null,
    paths:host.querySelectorAll('.sh__p').length,
    dots:host.querySelectorAll('.sh__d').length,
    lit:m});
})()"""
SPOT = """(function(){
  var host=document.querySelector('.shape');
  var el=host.querySelectorAll('.shape__chips')[%d].querySelectorAll('.shape__chip')[%d];
  var r=el.getBoundingClientRect();
  var cx=Math.round(r.left+r.width/2), cy=Math.round(r.top+r.height/2);
  var hit=document.elementFromPoint(cx,cy);
  return JSON.stringify({x:cx,y:cy,reach:!!(hit&&(hit===el||el.contains(hit)))});
})()"""
SLSPOT = """(function(){
  var sl=document.querySelector('.shape__sl');
  var r=sl.getBoundingClientRect();
  return JSON.stringify({l:Math.round(r.left),t:Math.round(r.top+r.height/2),
                         w:Math.round(r.width)});
})()"""
FOCUS = """(function(){
  var g=document.querySelectorAll('.shape__chips')[0];
  var on=g.querySelector('.shape__chip.is-on'); on.focus();
  return '1';
})()"""

async def main():
    urls = sys.argv[1:]
    prof=os.path.join(os.environ["TEMP"],"sh-%d"%int(time.time()*1000))
    proc=subprocess.Popen([CHROME,"--headless=new","--remote-debugging-port=%d"%PORT,
      "--remote-allow-origins=*","--no-first-run","--hide-scrollbars",
      "--use-gl=swiftshader","--enable-unsafe-swiftshader",
      "--window-size=1520,1020","--user-data-dir="+prof,"about:blank"],
      stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    ws=None
    for _ in range(80):
        try:
            with urllib.request.urlopen("http://127.0.0.1:%d/json/list"%PORT,timeout=1) as r: tabs=json.load(r)
            p=[t for t in tabs if t.get("type")=="page"]
            if p: ws=p[0]["webSocketDebuggerUrl"];break
        except Exception: pass
        time.sleep(0.25)
    import websockets
    bad=0; shot=False
    async with websockets.connect(ws,max_size=64*1024*1024) as sock:
        n={"i":0}
        async def send(m,pp=None):
            n["i"]+=1;mine=n["i"]
            await sock.send(json.dumps({"id":mine,"method":m,"params":pp or {}}))
            while True:
                msg=json.loads(await asyncio.wait_for(sock.recv(),timeout=25))
                if msg.get("id")==mine: return msg.get("result",{})
        async def ev(e):
            r=await send("Runtime.evaluate",{"expression":e,"returnByValue":True})
            return json.loads(r["result"]["value"])
        async def click(x,y):
            for kind in ("mousePressed","mouseReleased"):
                await send("Input.dispatchMouseEvent",{"type":kind,"x":x,"y":y,
                    "button":"left","clickCount":1,"pointerType":"mouse"})
        await send("Page.enable")
        await send("Emulation.setDeviceMetricsOverride",{"width":1440,"height":900,"deviceScaleFactor":1,"mobile":False})
        for url in urls:
            name=url.rsplit("/",1)[-1]
            await send("Page.navigate",{"url":url}); await asyncio.sleep(6)
            flags=[]
            await ev(SCROLLTO); await asyncio.sleep(1.6)
            s0=await ev(STATE % 0)
            if s0["paths"]<4: flags.append("figure thin (%d paths)"%s0["paths"])
            if "ZYRN" not in s0["sub"]: flags.append("no subject")
            # 1 — click the chip AFTER the selected one (a fixed index can
            # be the default itself, which proves nothing)
            want=(s0["on"]+1)%3
            sp=await ev(SPOT % (0,want))
            if not sp["reach"]: flags.append("chip BURIED")
            await click(sp["x"],sp["y"]); await asyncio.sleep(1.0)
            s1=await ev(STATE % 0)
            if s1["on"]!=want: flags.append("click did not select (on=%s)"%s1["on"])
            if s1["sub"]==s0["sub"]: flags.append("subject did not change")
            if s1["man"]==s0["man"]: flags.append("manifest did not change")
            if s1["lit"]==s0["lit"]: flags.append("lit point did not move")
            # 2 — DRAG the slider left-to-right in real steps
            sl=await ev(SLSPOT)
            x0,y0=sl["l"]+2,sl["t"]
            await send("Input.dispatchMouseEvent",{"type":"mousePressed","x":x0,"y":y0,
                "button":"left","clickCount":1,"pointerType":"mouse"})
            for f in range(1,13):
                await send("Input.dispatchMouseEvent",{"type":"mouseMoved",
                    "x":x0+int(sl["w"]*f/12.0),"y":y0,"button":"left","pointerType":"mouse"})
                await asyncio.sleep(0.03)
            await send("Input.dispatchMouseEvent",{"type":"mouseReleased","x":x0+sl["w"],"y":y0,
                "button":"left","clickCount":1,"pointerType":"mouse"})
            await asyncio.sleep(0.9)
            s2=await ev(STATE % 0)
            if s2["slv"]!="2": flags.append("drag landed at %s, wanted 2"%s2["slv"])
            if s2["sub"]==s1["sub"]: flags.append("drag changed nothing")
            # 3 — keyboard on the chips
            await ev(FOCUS)
            await send("Input.dispatchKeyEvent",{"type":"rawKeyDown","key":"ArrowRight",
                "code":"ArrowRight","windowsVirtualKeyCode":39})
            await send("Input.dispatchKeyEvent",{"type":"keyUp","key":"ArrowRight",
                "code":"ArrowRight","windowsVirtualKeyCode":39})
            await asyncio.sleep(0.7)
            s3=await ev(STATE % 0)
            if s3["on"]!=(want+1)%3: flags.append("arrow key did not move (on=%s)"%s3["on"])
            if not shot:
                png=await send("Page.captureScreenshot",{"format":"png"})
                open(os.path.join(os.environ["CLAUDE_JOB_DIR"],"tmp","shape.png"),"wb")\
                    .write(base64.b64decode(png["data"]))
                shot=True
            bad+=0 if not flags else 1
            print("  %-34s %s"%(name,"ok — click · drag · keys · subject: %r"%s2["sub"][:56]
                  if not flags else "<-- "+"; ".join(flags)),flush=True)
    proc.kill()
    print("\n%s"%("ALL CLEAR" if bad==0 else "%d page(s) failing"%bad))
asyncio.run(main())
