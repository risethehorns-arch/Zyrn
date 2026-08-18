# -*- coding: utf-8 -*-
"""Prove the entrance gating: plays on a first visit, is suppressed on a repeat
visit in the same tab, and replays when ?intro=1 is present.

Has to navigate twice in ONE tab, because the whole question is what
sessionStorage does between the two loads — a fresh profile per load would
make every visit look like a first visit and the test would always pass.
"""
import asyncio, json, os, subprocess, time, urllib.request

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9355
BASE = "http://localhost:8000/index.html"

PROBE = """(function(){
  return JSON.stringify({
    introEl: !!document.getElementById('intro'),
    isIntro: document.body.classList.contains('is-intro'),
    seen: sessionStorage.getItem('zyrn:seen-intro'),
  });
})()"""


async def main():
    prof = os.path.join(os.environ["TEMP"], "introtest-%d" % int(time.time() * 1000))
    proc = subprocess.Popen(
        [CHROME, "--headless=new", "--remote-debugging-port=%d" % PORT,
         "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check",
         "--window-size=1280,800", "--user-data-dir=" + prof, "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    ws_url = None
    for _ in range(80):
        try:
            with urllib.request.urlopen("http://127.0.0.1:%d/json/list" % PORT, timeout=1) as r:
                tabs = json.load(r)
            page = [t for t in tabs if t.get("type") == "page"]
            if page:
                ws_url = page[0]["webSocketDebuggerUrl"]; break
        except Exception:
            pass
        time.sleep(0.25)
    if not ws_url:
        proc.kill(); raise SystemExit("no devtools")

    import websockets
    try:
        async with websockets.connect(ws_url, max_size=16 * 1024 * 1024) as ws:
            n = {"i": 0}

            async def send(method, params=None):
                n["i"] += 1
                mine = n["i"]
                await ws.send(json.dumps({"id": mine, "method": method, "params": params or {}}))
                while True:
                    msg = json.loads(await ws.recv())
                    if msg.get("id") == mine:
                        return msg.get("result", {})

            await send("Page.enable")
            await send("Runtime.enable")

            # Sample at 1.0s, NOT after the sequence: intro.js removes the
            # element 240ms after the entrance finishes, so at 3.2s a run that
            # played and completed looks exactly like one that was suppressed.
            # At 1.0s the gate decision has been made (it is synchronous inside
            # initIntro) and a playing entrance is still on screen.
            async def visit(url, label, wait=1.0):
                await send("Page.navigate", {"url": url})
                await asyncio.sleep(wait)
                r = await send("Runtime.evaluate",
                               {"expression": PROBE, "returnByValue": True})
                v = json.loads(r["result"]["value"])
                verdict = "PLAYS" if v["introEl"] else "suppressed"
                print("  %-34s %-11s  introEl=%-5s seen=%s"
                      % (label, verdict, v["introEl"], v["seen"]))
                return v["introEl"]

            print("\n  entrance gating — one tab, three loads\n")
            a = await visit(BASE, "1. first visit")
            b = await visit(BASE, "2. reload, same tab")
            c = await visit(BASE + "?intro=1", "3. reload with ?intro=1")

            ok = a and (not b) and c
            print("\n  %s" % ("PASS — plays, suppresses, replays on demand"
                              if ok else "FAIL — %s/%s/%s" % (a, b, c)))
    finally:
        proc.kill()

asyncio.run(main())
