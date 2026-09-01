# -*- coding: utf-8 -*-
"""Does every signature instrument FIT inside its pinned stage, everywhere?

A pinned stage cannot be scrolled to reveal what does not fit, so anything
that overflows one is simply gone. And a 3D scene overflows its own layout
box by definition — the layers are pushed in Z and the perspective
magnifies them, so the box the browser reserved is not the box you see.
getBoundingClientRect DOES report the projected rect of a transformed
element, which is what makes this measurable rather than a matter of
opinion.

Generalises stkfit.py, which only knew about THE STACK. All five
instruments share one shell now (`.rig` / `.rig__view` / `.rig__key`), so
one probe covers all five — and it steps each one through its whole range
rather than checking a single open state, because the widest moment of an
instrument is not always the last one.

Reports, per viewport and per progress value: the projected union of
everything drawn inside the stage, and whether it collides with the step
readout above it, the note below it, the key rail beside it, or the edges
of the window.

  python rigfit.py <url> [<url> ...]
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("PORT", "9517"))

# The full sweep. Both are overridable from the environment — VP="1440x900
# 390x844" and STEPS="0 0.4 0.8" — because a full run is nine windows by
# eight progress values per page and there is no reason to pay for all of
# it while chasing one number.
VIEWPORTS = [(1920, 1080), (1440, 900), (1280, 820), (1024, 760),
             (2530, 500), (900, 700), (393, 610), (390, 844), (360, 640)]
STEPS = [0.0, 0.16, 0.32, 0.48, 0.64, 0.80, 0.94, 1.0]
if os.environ.get("VP"):
    VIEWPORTS = [tuple(int(n) for n in v.split("x"))
                 for v in os.environ["VP"].split()]
if os.environ.get("STEPS"):
    STEPS = [float(v) for v in os.environ["STEPS"].split()]

# Put the track at a given progress WITHOUT scrolling: _track.js and
# position:sticky both derive from the track's rect, so a negative margin
# pins the stage with the document still at scroll 0. Fighting Lenis with
# window.scrollTo does not work reliably headless.
STEP = """(function(p){
  var t = document.querySelector('.sig__track');
  if (!t) return 0;
  t.style.marginTop = '0px';
  var r = t.getBoundingClientRect();
  var span = Math.max(1, r.height - innerHeight);
  t.style.marginTop = (-(r.top + p * span)) + 'px';
  return 1;
})(%s)"""

# The parallax and the lean are driven by a POINTER, and headless never
# moves one — so a plain run measures the scene at rest and says nothing
# about the state a reader actually puts it in. PARALLAX=1 pins --px/--py/
# --lean to a corner so the widest deflection is what gets measured.
PIN = """(function(v){
  var t = ['.rig','.stk','.fld__scene','.wll__scene','.prs__prism','.pln__svg'];
  for (var i=0;i<t.length;i++){
    var e=document.querySelector(t[i]); if(!e) continue;
    e.style.setProperty('--px', v);
    e.style.setProperty('--py', v);
    e.style.setProperty('--lean', v);
  }
  return 1;
})('%s')"""

MEASURE = """(function(){
  var view = document.querySelector('.rig__view');
  var rig  = document.querySelector('.rig');
  if (!view || !rig) return JSON.stringify({skip:1});

  function box(e){ var b = e.getBoundingClientRect();
    return {l:b.left, t:b.top, r:b.right, b:b.bottom, w:b.width, h:b.height}; }

  /* The union of everything actually PAINTED inside the stage. Leaf-ish
     elements only: a wrapper's own rect can be smaller than the union of
     children it does not clip, and larger than what it draws. */
  /* ONE LAYOUT PASS. The first version interleaved getComputedStyle and
     getBoundingClientRect over every element, which forces a synchronous
     layout of a preserve-3d subtree on EVERY iteration — about a thousand
     of them per viewport, and it took minutes per window rather than
     seconds. Visibility comes from checkVisibility(), a single call that
     does not invalidate anything, and every rect is then read in one tight
     loop with no style access between them. */
  var u = null;
  var all = view.querySelectorAll('*');
  var live = [];
  for (var i = 0; i < all.length; i++){
    var e = all[i];
    if (e.checkVisibility && !e.checkVisibility({
          opacityProperty: true, visibilityProperty: true,
          contentVisibilityAuto: true })) continue;
    live.push(e);
  }
  for (var j = 0; j < live.length; j++){
    var b = box(live[j]);
    if (b.w < 1 || b.h < 1) continue;
    if (!u) u = {l:b.l, t:b.t, r:b.r, b:b.b};
    else { u.l = Math.min(u.l, b.l); u.t = Math.min(u.t, b.t);
           u.r = Math.max(u.r, b.r); u.b = Math.max(u.b, b.b); }
  }
  var vb = box(view);
  if (!u) u = vb;

  /* An instrument whose stage CLIPS cannot paint outside it, and the row
     of panels running off both edges of THE FOLD is deliberate. Clamp the
     union to the stage where the stage is doing the clipping. */
  var clip = getComputedStyle(view).overflow;   // one call, not one per element
  if (clip === 'hidden' || clip === 'clip'){
    u = {l:Math.max(u.l, vb.l), t:Math.max(u.t, vb.t),
         r:Math.min(u.r, vb.r), b:Math.min(u.b, vb.b)};
  }

  function q(sel){ var e = document.querySelector(sel); return e ? box(e) : null; }
  function hit(a, b){
    if (!a || !b) return 0;
    var x = Math.min(a.r, b.r) - Math.max(a.l, b.l);
    var y = Math.min(a.b, b.b) - Math.max(a.t, b.t);
    return (x > 0 && y > 0) ? Math.round(Math.min(x, y)) : 0;
  }
  var head = q('.sig__head'), note = q('.sig__note'), key = q('.rig__key');
  /* Below 900px the key rail sits UNDER the stage, so an overlap with it
     is not a defect there — it is the layout. */
  var stacked = key && head && key.l < (head.l + 4);
  return JSON.stringify({
    vw: innerWidth, vh: innerHeight,
    u: {l:Math.round(u.l), t:Math.round(u.t), r:Math.round(u.r), b:Math.round(u.b)},
    offL: Math.round(Math.max(0, -u.l)),
    offR: Math.round(Math.max(0, u.r - innerWidth)),
    offT: Math.round(Math.max(0, -u.t)),
    offB: Math.round(Math.max(0, u.b - innerHeight)),
    hitHead: hit(u, head), hitNote: hit(u, note),
    hitKey: stacked ? 0 : hit(u, key),
    docOver: Math.max(0, document.documentElement.scrollWidth - innerWidth)
  });
})()"""


async def main():
    urls = sys.argv[1:]
    prof = os.path.join(os.environ["TEMP"], "rf-%d" % int(time.time() * 1000))
    proc = subprocess.Popen([
        CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
        "--remote-allow-origins=*", "--no-first-run",
        "--no-default-browser-check", "--hide-scrollbars",
        # HARDWARE, not swiftshader. These instruments are 3D transforms on
        # a 620vh sticky page, and software rasterisation of that made every
        # CDP round trip take fifteen seconds — the probe was measuring the
        # renderer, not the layout. There is no video on these pages, so the
        # headless-plus-hardware decode bug does not apply here.
        "--use-gl=angle", "--use-angle=d3d11", "--enable-gpu",
        "--ignore-gpu-blocklist",
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
    total_bad = 0
    async with websockets.connect(ws, max_size=64 * 1024 * 1024) as sock:
        n = {"i": 0}

        async def send(m, pp=None):
            n["i"] += 1
            mine = n["i"]
            await sock.send(json.dumps({"id": mine, "method": m,
                                        "params": pp or {}}))
            while True:
                # A recv with no timeout blocks forever if the browser dies
                # mid-run, and headless Chrome under swiftshader does die.
                # Twenty seconds is far longer than any call here needs.
                msg = json.loads(await asyncio.wait_for(sock.recv(), timeout=20))
                if msg.get("id") == mine:
                    return msg.get("result", {})

        async def ev(expr):
            r = await send("Runtime.evaluate",
                           {"expression": expr, "returnByValue": True})
            return r.get("result", {}).get("value")

        await send("Page.enable")
        # Without this the probe re-measures the module it already has in
        # memory and reports a fix as having had no effect — confidently,
        # repeatedly, and with numbers identical to the run before it.
        await send("Network.enable")
        await send("Network.setCacheDisabled", {"cacheDisabled": True})
        for url in urls:
            name = url.rsplit("/", 1)[-1]
            print("\n%s" % name)
            # NAVIGATE ONCE, then resize. A full navigation per viewport was
            # nine cold starts of a 90k-particle simulation per page, and
            # under swiftshader that ran to minutes per window. Everything
            # this probe measures responds to a resize — the media queries,
            # the clamp on --righ, and the fold's own ResizeObserver — so
            # the other eight navigations were buying nothing.
            await send("Page.navigate", {"url": url})
            await asyncio.sleep(float(os.environ.get("SETTLE", "3.0")))
            for (W, H) in VIEWPORTS:
                await send("Emulation.setDeviceMetricsOverride",
                           {"width": W, "height": H, "deviceScaleFactor": 1,
                            "mobile": W < 900})
                await asyncio.sleep(0.7)
                worst, flags = None, []
                for p in STEPS:
                    await ev(STEP % p)
                    if os.environ.get("PARALLAX"):
                        await ev(PIN % os.environ["PARALLAX"])
                    # LONGER THAN THE LONGEST TRANSITION ON THE PAGE.
                    # The modules write custom properties and the CSS
                    # transitions the transforms that read them, so a
                    # measurement taken 180ms after a step catches the
                    # layers still travelling from the previous one — which
                    # reported a closed stack overlapping its own note by
                    # 26px. The slowest transition here is 620ms.
                    await asyncio.sleep(float(os.environ.get("SETTLE_STEP", "0.85")))
                    d = json.loads(await ev(MEASURE))
                    if d.get("skip"):
                        break
                    for k, label in (("offL", "L"), ("offR", "R"),
                                     ("offT", "T"), ("offB", "B")):
                        if d[k] > 2:
                            flags.append("p%.2f %s%+d" % (p, label, d[k]))
                    for k, label in (("hitHead", "HEAD"), ("hitNote", "NOTE"),
                                     ("hitKey", "KEY")):
                        if d[k] > 2:
                            flags.append("p%.2f %s %dpx" % (p, label, d[k]))
                    if d["docOver"] > 2:
                        flags.append("p%.2f HSCROLL %d" % (p, d["docOver"]))
                    if worst is None or d["u"]["b"] - d["u"]["t"] > worst[1]:
                        worst = (d["u"], d["u"]["b"] - d["u"]["t"])
                ok = not flags
                total_bad += 0 if ok else 1
                u = worst[0] if worst else {"l": 0, "r": 0, "t": 0, "b": 0}
                print("  %-10s union %5d..%-5d x %4d..%-4d  %s"
                      % ("%dx%d" % (W, H), u["l"], u["r"], u["t"], u["b"],
                         "ok" if ok else "<-- " + "; ".join(flags[:4])),
                      flush=True)
    proc.kill()
    print("\n%s" % ("ALL CLEAR" if total_bad == 0
                    else "%d viewport(s) failing" % total_bad))


asyncio.run(main())
