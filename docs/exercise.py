# -*- coding: utf-8 -*-
"""Step every scroll instrument through its whole range and watch for errors.

check.py loads a page and listens -- which is exactly why it missed a crash
in the re-base instrument. _track.js seeds each client with cb(0), so a bug
that only fires at p>0 is invisible until something actually scrolls. Every
signature instrument on this site is scroll-driven, so "the page loaded
clean" was never the same claim as "the page works".

Uses the same negative-margin trick as sig.py, so the document stays at
scroll 0 and Lenis is not fought.

  python exercise.py <url> [<url> ...]
"""
import asyncio, json, os, subprocess, sys, time, urllib.request
CHROME=r"C:\Program Files\Google\Chrome\Application\chrome.exe"; PORT=9409

FIND = """(function(){
  // Explicit list, not [class$="__track"] -- that also matches
  // .readout__track, the scroll rail, and dragging THAT around with a
  // negative margin moves site chrome rather than exercising an instrument.
  // .wp__track was missing until 2026-09-01, so THEHUB's wipe — one of
  // the two instruments on that page — was never once stepped by this.
  var sel='.sig__track,.rk__track,.rb__track,.in__track,.wp__track';
  return JSON.stringify([].map.call(document.querySelectorAll(sel),function(t,i){
    if(!t.id) t.id='__ex'+i;
    return t.id;
  }));
})()"""

def STEP(tid, p):
    return ("(function(){var t=document.getElementById('%s');t.style.marginTop='0px';"
            "var r=t.getBoundingClientRect();var span=Math.max(1,r.height-innerHeight);"
            "t.style.marginTop=(-(r.top+%s*span))+'px';return 1})()" % (tid, p))

async def main():
    urls = sys.argv[1:]
    prof=os.path.join(os.environ["TEMP"],"ex-%d"%int(time.time()*1000))
    proc=subprocess.Popen([CHROME,"--headless=new","--remote-debugging-port=%d"%PORT,
      "--remote-allow-origins=*","--no-first-run","--no-default-browser-check",
      "--hide-scrollbars","--window-size=1600,1000","--user-data-dir="+prof,"about:blank"],
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
    bad=0
    async with websockets.connect(ws,max_size=64*1024*1024) as c:
        n={"i":0}; events=[]
        async def send(m,pp=None):
            n["i"]+=1;mine=n["i"]
            await c.send(json.dumps({"id":mine,"method":m,"params":pp or {}}))
            while True:
                msg=json.loads(await c.recv())
                if msg.get("id")==mine: return msg.get("result",{})
                events.append(msg)
        async def drain(sec):
            end=time.time()+sec
            while time.time()<end:
                try: events.append(json.loads(await asyncio.wait_for(c.recv(),timeout=0.2)))
                except asyncio.TimeoutError: pass
        await send("Page.enable"); await send("Runtime.enable")
        await send("Emulation.setDeviceMetricsOverride",{"width":1440,"height":900,"deviceScaleFactor":1,"mobile":False})
        for u in urls:
            await send("Page.navigate",{"url":u}); await asyncio.sleep(5.5)
            r=await send("Runtime.evaluate",{"expression":FIND,"returnByValue":True})
            ids=json.loads(r["result"]["value"])
            events.clear()
            for tid in ids:
                for i in range(13):
                    await send("Runtime.evaluate",{"expression":STEP(tid,i/12.0),"returnByValue":True})
                    await asyncio.sleep(0.16)
                await drain(0.4)
                # park it again so the next track measures from a clean page
                await send("Runtime.evaluate",{"expression":
                    "document.getElementById('%s').style.marginTop='0px';1"%tid,"returnByValue":True})
            errs=[]
            for e in events:
                m,pp=e.get("method"),e.get("params",{})
                if m=="Runtime.exceptionThrown":
                    d=pp.get("exceptionDetails",{})
                    errs.append("JS   "+(d.get("exception",{}).get("description") or d.get("text","?"))[:160])
                elif m=="Runtime.consoleAPICalled" and pp.get("type") in ("error","warning"):
                    t=" ".join(str(a.get("value",a.get("description","")))for a in pp.get("args",[]))[:160]
                    if t.strip(): errs.append(pp["type"][:4].upper()+" "+t)
            seen=set(); out=[]
            for e in errs:
                if e not in seen: seen.add(e); out.append(e)
            name=u.split('/',3)[-1] or '/'
            if out:
                bad+=len(out)
                print("\n  %-42s %d instrument(s)  %d ISSUE(S)"%(name,len(ids),len(out)))
                for e in out: print("      "+e)
            else:
                print("  %-42s %d instrument(s) stepped 0->1  clean"%(name,len(ids)))
    proc.kill()
    print("\n%s"%("ALL CLEAN"if not bad else"%d issue(s)"%bad))
asyncio.run(main())
