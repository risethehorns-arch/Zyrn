# -*- coding: utf-8 -*-
"""Does the nearest spark flare under a REAL pointer, and say its ref?"""
import asyncio, json, os, subprocess, sys, time, urllib.request
CHROME=r"C:\Program Files\Google\Chrome\Application\chrome.exe"; PORT=9471

STEP = """(function(){
  var t=document.querySelector('#sigLat .sig__track');
  t.style.marginTop='0px';
  var r=t.getBoundingClientRect();
  var span=Math.max(1,r.height-innerHeight);
  t.style.marginTop=(-(r.top+0.243*span))+'px';
  return 1;
})()"""
SPOT = """(function(){
  var v=document.querySelector('#sigLat .rig__view').getBoundingClientRect();
  var s=document.querySelectorAll('.lat__p')[7].getBoundingClientRect();
  return JSON.stringify({x:Math.round(s.left+s.width/2)||Math.round(s.left),
                         y:Math.round(s.top+s.height/2)||Math.round(s.top),
                         vx:Math.round(v.left),vy:Math.round(v.top)});
})()"""
READ = """(function(){
  var hot=document.querySelectorAll('.lat__p.is-hot');
  var t=hot.length?hot[0].querySelector('.lat__t'):null;
  var cs=t?getComputedStyle(t):null;
  return JSON.stringify({hot:hot.length,
    label:t?t.textContent.trim().slice(0,10):null,
    labelOn:cs?+cs.opacity>0.5:false});
})()"""
async def main():
    prof=os.path.join(os.environ["TEMP"],"lh-%d"%int(time.time()*1000))
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
    async with websockets.connect(ws,max_size=32*1024*1024) as sock:
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
        await send("Page.enable")
        await send("Emulation.setDeviceMetricsOverride",{"width":1440,"height":900,"deviceScaleFactor":1,"mobile":False})
        await send("Page.navigate",{"url":"http://localhost:8000/services/crm.html"})
        await asyncio.sleep(6)
        await send("Runtime.evaluate",{"expression":STEP,"returnByValue":True})
        await asyncio.sleep(1.5)
        spot=await ev(SPOT)
        # glide the REAL pointer onto the spark (eased tracker needs frames)
        for f in range(24):
            await send("Input.dispatchMouseEvent",{"type":"mouseMoved",
                "x":spot["x"],"y":spot["y"],"pointerType":"mouse"})
            await asyncio.sleep(0.05)
        r=await ev(READ)
        ok = r["hot"]==1 and r["labelOn"]
        print("spark at %d,%d  hot=%d  label=%r on=%s  %s"
              %(spot["x"],spot["y"],r["hot"],r["label"],r["labelOn"],
                "OK" if ok else "FAIL"))
    proc.kill()
asyncio.run(main())
