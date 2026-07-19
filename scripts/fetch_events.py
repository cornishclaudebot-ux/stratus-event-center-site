#!/usr/bin/env python3
"""Pull Club Stratus upcoming events from Bandsintown and write events.json.

Runs daily via launchd (com.stratus.events). Bandsintown sits behind
Cloudflare, so this uses scrapling's StealthyFetcher (Camoufox) from the
~/scrapling-mcp/.venv environment rather than plain HTTP.

The site (app.js) fetches events.json at load and falls back to its baked-in
EVENTS array if the file is missing or empty.

Usage:
  fetch_events.py            fetch, write events.json, commit + push if changed
  fetch_events.py --no-push  fetch and write only (for testing)
"""
import datetime
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import tempfile
import urllib.request

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = REPO / "events.json"
VENUE_URL = "https://www.bandsintown.com/v/10168441-club-stratus"

# --- 4K flyer enhancement (Real-ESRGAN, local GPU) ---
UPSCALER = pathlib.Path.home() / "realesrgan" / "realesrgan-ncnn-vulkan"
FLYERS = REPO / "assets" / "flyers"
TARGET_LONG = 3840  # 4K long edge

# Hand-curated enrichments keyed by ISO date: fuller titles, official ticket
# deep links and local flyers (Ticketon). Bandsintown stays the source of
# which dates exist; these only dress up what it finds.
OVERRIDES = {
    "2026-08-29": {
        "title": "Flex, La Factoría & Makano", "tag": "Reggaetón",
        "url": "https://ticketon.com/en/events/flex-la-factoria-demphra--mas-en-phoenix-phoenix-az-2026-08-29-bgc4gzbze0do",
        "flyer": "assets/event-flex.jpg",
    },
    "2026-09-26": {
        "title": "Durango Fest", "tag": "Duranguense",
        "url": "https://ticketon.com/en/events/durango-fest-en-phoenix-phoenix-az-2026-09-26-wbgo38az3d1z",
        "flyer": "assets/event-durango.jpg",
    },
}


def fetch_html():
    from scrapling.fetchers import StealthyFetcher
    page = StealthyFetcher.fetch(
        VENUE_URL, headless=True, solve_cloudflare=True, timeout=90000)
    for attr in ("html_content", "body"):
        html = getattr(page, attr, None)
        if html:
            return html if isinstance(html, str) else html.decode("utf-8", "replace")
    return str(page)


def parse(html):
    events = []
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(m.group(1))
        except ValueError:
            continue
        items = data if isinstance(data, list) else [data]
        for it in items:
            if not isinstance(it, dict) or it.get("@type") != "MusicEvent":
                continue
            start = it.get("startDate", "")
            date = start[:10]
            if not re.match(r"\d{4}-\d{2}-\d{2}$", date):
                continue
            tm = re.match(r".*T(\d{2}):(\d{2})", start)
            if tm:
                h = int(tm.group(1))
                time_str = f"{h % 12 or 12}:{tm.group(2)} {'AM' if h < 12 else 'PM'}"
            else:
                time_str = "8:00 PM"
            name = re.sub(r"\s*@ Club Stratus\s*$", "", it.get("name", ""), flags=re.I).strip()
            img = it.get("image") or ""
            if "placeholder" in img:
                img = None
            elif "/thumb/" in img:
                # Bandsintown serves a small thumbnail by default; the /large/
                # variant of the same photo is much sharper on retina cards
                img = img.replace("/thumb/", "/large/")
            offers = it.get("offers") or {}
            ev = {
                "date": date, "time": time_str, "title": name, "tag": None,
                "flyer": img or None,
                "url": offers.get("url") or it.get("url"),
            }
            ev.update(OVERRIDES.get(date, {}))
            events.append(ev)
    seen, out = set(), []
    for e in sorted(events, key=lambda x: x["date"]):
        k = (e["date"], e["title"].lower())
        if k in seen:
            continue
        seen.add(k)
        out.append(e)
    return out


def _dims(p):
    r = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(p)],
                       capture_output=True, text=True)
    vals = re.findall(r": (\d+)", r.stdout)
    return (int(vals[0]), int(vals[1])) if len(vals) >= 2 else (0, 0)


def enhance_flyer(ev):
    """Upscale the event's flyer toward 4K with Real-ESRGAN and serve it
    locally from assets/flyers/. Idempotent (stable filename per event, so
    already-enhanced flyers are reused) and never fatal: on any failure the
    original flyer reference is kept."""
    src = ev.get("flyer")
    if not src:
        return
    key = hashlib.md5((ev["date"] + ev["title"].lower()).encode()).hexdigest()[:12]
    out = FLYERS / f"{ev['date']}-{key}.jpg"
    rel = f"assets/flyers/{out.name}"
    if out.exists():
        ev["flyer"] = rel
        return
    try:
        FLYERS.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as td:
            raw = pathlib.Path(td) / "in.jpg"
            if src.startswith("http"):
                req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0"})
                raw.write_bytes(urllib.request.urlopen(req, timeout=60).read())
            else:
                raw.write_bytes((REPO / src).read_bytes())
            w, h = _dims(raw)
            if not w:
                print(f"enhance: unreadable image for {ev['title']}")
                return
            up = pathlib.Path(td) / "up.png"
            if max(w, h) < TARGET_LONG and UPSCALER.exists():
                # cwd matters: the binary resolves its models/ folder relative
                # to the working directory and segfaults if it can't find it
                subprocess.run([str(UPSCALER), "-i", str(raw), "-o", str(up),
                                "-s", "4", "-n", "realesrgan-x4plus"],
                               check=True, capture_output=True, timeout=900,
                               cwd=str(UPSCALER.parent))
            else:
                up = raw
            subprocess.run(["sips", "-Z", str(TARGET_LONG), "-s", "format", "jpeg",
                            "-s", "formatOptions", "85", str(up), "--out", str(out)],
                           check=True, capture_output=True)
            nw, nh = _dims(out)
            print(f"enhanced {ev['title']}: {w}x{h} -> {nw}x{nh}")
            ev["flyer"] = rel
    except Exception as e:
        print(f"enhance failed for {ev['title']}: {e}")


def main():
    push = "--no-push" not in sys.argv
    html = fetch_html()
    evs = parse(html)
    if not evs:
        print("No events parsed; keeping existing events.json")
        return 1
    for ev in evs:
        enhance_flyer(ev)
    payload = {
        "updated": datetime.datetime.now().isoformat(timespec="seconds"),
        "source": VENUE_URL,
        "events": evs,
    }
    strip = lambda s: re.sub(r'"updated":[^,]*,', "", s)
    old = OUT.read_text() if OUT.exists() else ""
    new = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    if strip(old) == strip(new):
        print("No changes")
        return 0
    OUT.write_text(new)
    print(f"Wrote {len(evs)} events to {OUT}")
    if push:
        subprocess.run(["git", "-C", str(REPO), "add", "events.json", "assets/flyers"], check=True)
        subprocess.run(["git", "-C", str(REPO), "commit", "-m",
                        "Auto-update events from Bandsintown"], check=True)
        subprocess.run(["git", "-C", str(REPO), "push", "origin", "main"], check=True)
        print("Committed and pushed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
