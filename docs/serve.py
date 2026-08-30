# -*- coding: utf-8 -*-
"""A static server that supports HTTP Range. Use this, not `python -m http.server`.

`python -m http.server` has no Range support at all, and for a site with video
that is not a detail — it is the difference between working and not:

  · a <video> whose server cannot serve ranges reports `seekable` as [0, 0].
    The browser will still play it front to back, but it CANNOT SEEK, so a
    scroll-scrubbed video sits on frame zero for ever and looks exactly like a
    poster that failed to become a video.
  · measured on this project, 2026-08-30: `v.currentTime = 10` on the case
    page's reel read back 0.00 three times in a row, `seekable` [0,0],
    readyState 1. Nothing was wrong with the file (250 frames, monotonic PTS,
    keyframe at 0) and nothing was wrong with rack.js.

GitHub Pages serves ranges, so the live site is unaffected — but a preview
handed to the owner on the no-Range server would show a dead instrument and
be reported as a bug that does not exist.

  python serve.py [port] [directory]
"""
import os, re, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = sys.argv[2] if len(sys.argv) > 2 else "."


class RangeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        # a preview is for looking at what was just built, never at what was
        # built an hour ago
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_head(self):
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404)
            return None

        size = os.fstat(f.fileno()).st_size
        m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
        if not m:
            f.close()
            self.send_error(400, "bad Range")
            return None
        a, b = m.group(1), m.group(2)
        if a == "":                       # suffix form: bytes=-500
            length = int(b or 0)
            start = max(0, size - length)
            end = size - 1
        else:
            start = int(a)
            end = int(b) if b else size - 1
        if start >= size or end >= size or start > end:
            f.close()
            self.send_response(416)
            self.send_header("Content-Range", "bytes */%d" % size)
            self.end_headers()
            return None

        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        f.seek(start)
        return _Slice(f, end - start + 1)


class _Slice:
    """A file object that stops after n bytes, so copyfile sends only the range."""

    def __init__(self, f, n):
        self.f, self.n = f, n

    def read(self, size=-1):
        if self.n <= 0:
            return b""
        if size is None or size < 0 or size > self.n:
            size = self.n
        data = self.f.read(size)
        self.n -= len(data)
        return data

    def close(self):
        self.f.close()


if __name__ == "__main__":
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), RangeHandler)
    print("serving %s on :%d  (Range: yes)" % (os.path.abspath(ROOT), PORT))
    srv.serve_forever()
