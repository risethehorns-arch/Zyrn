# -*- coding: utf-8 -*-
"""Cut captured frames into a reel and encode it.

The frames carry the real time they were painted at, not a frame number, so
the concat list is written with a per-frame `duration` and ffmpeg rebuilds the
true timing. Capture ran between 17 and 39 fps depending on how hard the page
was working; resampling to a constant 30 is ffmpeg's job, not the capture's.

Cuts are hard. The 2026 reading on this is consistent — aggressive cutting
outperforms complexity — and the doctrine already caps the landing page at five
scenes for the same reason. No dissolves.

  python cut.py <spec.json>

A spec names the source directory, the output stem, the frame size, and a list
of takes as {tag, from, to} in seconds within that take.
"""
import json, os, subprocess, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
FFMPEG = "ffmpeg"


def build_list(src, man, takes, path):
    """One ffmpeg concat list across every take, with real durations."""
    by = {s["tag"]: s for s in man}
    lines, n, total = [], 0, 0.0
    for t in takes:
        seg = by[t["tag"]]
        fs = seg["frames"]
        lo, hi = t["from"], t["to"]
        window = [f for f in fs if lo <= f["t"] <= hi]
        if len(window) < 2:
            raise SystemExit("take %s: only %d frames in %.1f..%.1f"
                             % (t["tag"], len(window), lo, hi))
        for i, f in enumerate(window):
            # a frame is shown until the next one was painted; the last frame
            # of a take gets the take's median so a cut is never a long hold
            if i + 1 < len(window):
                d = window[i + 1]["t"] - f["t"]
            else:
                d = (window[-1]["t"] - window[0]["t"]) / max(1, len(window) - 1)
            d = min(max(d, 0.008), 0.25)
            # relative to the LIST FILE, which lives beside the frames: the
            # concat demuxer resolves paths against the list, not the cwd, so a
            # "lum/xxx.jpg" written from inside lum/ resolves to lum/lum/xxx.jpg
            lines.append("file '%s'" % f["file"])
            lines.append("duration %.4f" % d)
            total += d
            n += 1
        # concat demuxer ignores the duration of the very last entry unless the
        # file is repeated, so repeat it
        lines.append("file '%s'" % window[-1]["file"])
        print("  %-9s %3d frames  %.2fs" % (t["tag"], len(window), sum(
            min(max((window[i + 1]["t"] - window[i]["t"]), 0.008), 0.25)
            for i in range(len(window) - 1))))
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    return n, total


def encode(listfile, out, w, h, fps, gop, crf_vp9, crf_h264, extra=""):
    vf = ("fps=%d,scale=%d:%d:flags=lanczos,format=yuv420p" % (fps, w, h))
    common = ["-f", "concat", "-safe", "0", "-i", listfile]

    # WebM / VP9 — the primary. `-g` sets the keyframe interval: a scrubbed
    # video seeks to the nearest keyframe and decodes forward, so a long GOP
    # makes scrubbing lurch. Short GOP costs bytes and buys smoothness.
    cmd = [FFMPEG, "-y"] + common + [
        "-vf", vf, "-an",
        "-c:v", "libvpx-vp9", "-crf", str(crf_vp9), "-b:v", "0",
        "-g", str(gop), "-deadline", "good", "-cpu-used", "2",
        "-row-mt", "1", "-tile-columns", "2",
        out + ".webm"]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)

    # MP4 / H.264 — the fallback that every Safari and every in-app browser
    # plays. faststart so the moov atom is at the front and playback can begin
    # before the file is complete.
    cmd = [FFMPEG, "-y"] + common + [
        "-vf", vf, "-an",
        "-c:v", "libx264", "-crf", str(crf_h264), "-preset", "slow",
        "-g", str(gop), "-keyint_min", str(gop), "-sc_threshold", "0",
        "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        out + ".mp4"]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    src = spec["src"]
    man = json.load(open(os.path.join(src, "manifest.json"), encoding="utf-8"))
    for job in spec["outputs"]:
        print("\n%s  (%dx%d @ %dfps, gop %d)"
              % (job["out"], job["w"], job["h"], job["fps"], job["gop"]))
        lf = os.path.join(src, "_%s.txt" % os.path.basename(job["out"]))
        n, total = build_list(src, man, job["takes"], lf)
        encode(lf, job["out"], job["w"], job["h"], job["fps"], job["gop"],
               job.get("crf_vp9", 34), job.get("crf_h264", 24))
        for ext in ("webm", "mp4"):
            p = job["out"] + "." + ext
            sz = os.path.getsize(p)
            dur = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=nw=1:nk=1", p],
                capture_output=True, text=True).stdout.strip()
            print("  %-46s %7.0f KB   %ss"
                  % (os.path.basename(p), sz / 1024, dur[:5]))


main()
