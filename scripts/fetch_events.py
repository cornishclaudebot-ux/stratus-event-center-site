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
import json
import pathlib
import re
import subprocess
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = REPO / "events.json"
VENUE_URL = "https://www.bandsintown.com/v/10168441-club-stratus"

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


def main():
    push = "--no-push" not in sys.argv
    html = fetch_html()
    evs = parse(html)
    if not evs:
        print("No events parsed; keeping existing events.json")
        return 1
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
        subprocess.run(["git", "-C", str(REPO), "add", "events.json"], check=True)
        subprocess.run(["git", "-C", str(REPO), "commit", "-m",
                        "Auto-update events from Bandsintown"], check=True)
        subprocess.run(["git", "-C", str(REPO), "push", "origin", "main"], check=True)
        print("Committed and pushed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
