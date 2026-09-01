# -*- coding: utf-8 -*-
"""Is the instrument actually changing as you scroll?

"Barely anything changing, and then it just goes to the one below" is a
real note the owner once gave about a real instrument, and it is a
MEASURABLE claim. Step a track through 41 progress values, record the
instrument's visible state at each, and report how many steps produced a
change. A run of identical consecutive states is dead scroll, and the
LONGEST such run is the number that matters — that is what a reader
experiences as nothing happening.

Generic, unlike `motion.py`, which carried a hand-written state probe per
instrument. All five share one shell, so the state can be read the same
way everywhere: every inline style and class inside the rig, plus the step
readout. That covers every custom property the modules write and every
class they toggle, which between them is the whole of what moves.

  python rigmotion.py <url> [<url> ...]
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9525"))
N = 41

STEP = """(function(p){
  var t = document.querySelector('.sig__track');
  if (!t) return 0;
  t.style.marginTop = '0px';
  var r = t.getBoundingClientRect();
  var span = Math.max(1, r.height - innerHeight);
  t.style.marginTop = (-(r.top + p * span)) + 'px';
  return 1;
})(%s)"""

STATE = """(function(){
  var rig = document.querySelector('.rig');
  if (!rig) return '';
  var out = [rig.getAttribute('style') || '', rig.getAttribute('data-act') || ''];
  var all = rig.querySelectorAll('*');
  for (var i = 0; i < all.length; i++){
    var e = all[i];
    var st = e.getAttribute('style');
    if (st) out.push(st);
    if (e.className && e.className.baseVal !== undefined) out.push(e.className.baseVal);
    else if (typeof e.className === 'string' && e.className) out.push(e.className);
    if (e.tagName === 'path' || e.tagName === 'circle'){
      out.push(e.getAttribute('d') || '');
      out.push((e.getAttribute('cx') || '') + ',' + (e.getAttribute('cy') || ''));
      out.push(e.style.opacity || '');
    }
    if (!e.children.length && e.textContent && e.textContent.length < 60){
      out.push(e.textContent);
    }
  }
  var s = document.querySelector('.sig__step');
  out.push(s ? s.textContent : '');
  return out.join('|');
})()"""


async def main():
    urls = sys.argv[1:]
    prof = os.path.join(os.environ["TEMP"], "rm-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars",
        "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
        "--window-size=1500,1000", "--user-data-dir=" + prof, "about:blank",
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
    worst = 0
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

        async def ev(expr):
            r = await send("Runtime.evaluate",
                           {"expression": expr, "returnByValue": True})
            return r.get("result", {}).get("value")

        await send("Page.enable")
        await send("Emulation.setDeviceMetricsOverride",
                   {"width": 1440, "height": 900, "deviceScaleFactor": 1,
                    "mobile": False})
        for url in urls:
            await send("Page.navigate", {"url": url})
            await asyncio.sleep(5.0)
            last, changes, run, longest, dead_at = None, 0, 0, 0, 0
            for i in range(N):
                p = i / (N - 1.0)
                await ev(STEP % ("%.4f" % p))
                await asyncio.sleep(0.13)
                st = await ev(STATE)
                if last is not None:
                    if st == last:
                        run += 1
                        if run > longest:
                            longest = run
                            dead_at = p
                    else:
                        changes += 1
                        run = 0
                last = st
            worst = max(worst, longest)
            print("  %-38s %2d/%d steps changed   longest dead run %d "
                  "(%.0f%% of the track, around p=%.2f)"
                  % (url.rsplit("/", 1)[-1], changes, N - 1, longest,
                     100.0 * longest / (N - 1), dead_at))
    proc.kill()
    print("\nworst dead run across all: %d of %d steps" % (worst, N - 1))


asyncio.run(main())
