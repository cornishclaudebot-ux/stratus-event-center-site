#!/bin/bash
# ============================================================
# Stratus Event Center — Bandsintown auto-pull
# (runs on Aiden's Mac via launchd com.stratus.events, every 5 min)
#
# Same architecture as dartyforlife-site: GitHub Actions cannot do
# this pull because Bandsintown's Cloudflare 403s datacenter IPs and
# the fetch needs Camoufox (scrapling) anyway. This Mac's residential
# IP + stealth browser is the reliable route, so the worker lives
# here and the cloud only WATCHES (see .github/workflows/sentinel.yml).
#
# Failure-proofing:
#  - fetch_events.py already retries the page load 3x internally
#  - consecutive-failure streak tracked in logs/.pull-state;
#    12 strikes (~1 hour broken at 5-min ticks) -> ONE alert email,
#    and a recovery email when it heals. No spam in between.
#  - push retries once after re-rebasing (bot vs. human race)
#  - heartbeat.txt refreshed at most once a day so the watchdog +
#    cloud sentinel can tell "quiet week" from "pipeline dead"
# ============================================================
set -uo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
REPO="/Users/aidencornish/stratus-event-center-site"
PYTHON="/Users/aidencornish/scrapling-mcp/.venv/bin/python"
STATE="$REPO/logs/.pull-state"
LOG="$REPO/logs/events-sync.log"
ALERT_TO="dartyforlife@gmail.com"
ALERT_FROM="Stratus Site Watchdog <rentals@apexaz.ai>"
RESEND_KEY_FILE="/Users/aidencornish/apex-audit-engine/.env"
ALERT_AT=12   # 12 consecutive failures at 5-min ticks = ~1 hour broken

cd "$REPO" || exit 1
mkdir -p logs

# keep the log from growing forever at 288 runs/day
if [ -f "$LOG" ] && [ "$(stat -f%z "$LOG" 2>/dev/null || echo 0)" -gt 1500000 ]; then
  tail -n 3000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

send_alert() { # $1 subject, $2 body
  local key
  key=$(grep '^RESEND_API_KEY=' "$RESEND_KEY_FILE" 2>/dev/null | cut -d= -f2)
  [ -z "$key" ] && { echo "[$(ts)] no resend key, cannot alert"; return 1; }
  curl -s -m 20 -X POST "https://api.resend.com/emails" \
    -H "Authorization: Bearer $key" -H "Content-Type: application/json" \
    -d "$(python3 -c 'import json,sys; print(json.dumps({"from":sys.argv[1],"to":[sys.argv[2]],"subject":sys.argv[3],"text":sys.argv[4]}))' \
        "$ALERT_FROM" "$ALERT_TO" "$1" "$2")" >/dev/null 2>&1
}

fail_streak() { cat "$STATE" 2>/dev/null || echo 0; }

mark_failure() { # $1 = reason
  local n; n=$(( $(fail_streak) + 1 )); echo "$n" > "$STATE"
  echo "[$(ts)] FAILURE #$n: $1"
  if [ "$n" -eq "$ALERT_AT" ]; then
    send_alert "Stratus site auto-update is DOWN" \
"The Stratus event sync has failed $ALERT_AT times in a row (about an hour).

Latest reason: $1
Log: ~/stratus-event-center-site/logs/events-sync.log

The site is still up and serving the last good events. Common causes: Mac offline or asleep, Bandsintown blocking or slow, git conflict."
    echo "[$(ts)] alert email sent"
  fi
  exit 1
}

mark_success() {
  local n; n=$(fail_streak)
  if [ "$n" -ge "$ALERT_AT" ]; then
    send_alert "Stratus site auto-update RECOVERED" \
"The Stratus event sync is pulling and pushing again as of $(ts). No action needed."
    echo "[$(ts)] recovery email sent"
  fi
  echo 0 > "$STATE"
}

# Backoff while broken: after 3 straight failures only try every 3rd tick
# (15 min), so a refusing host never gets hammered 288x/day. Heals fast:
# the first success resets everything.
TICKS="$REPO/logs/.tick-count"
streak=$(fail_streak)
if [ "$streak" -ge 3 ]; then
  t=$(( $(cat "$TICKS" 2>/dev/null || echo 0) + 1 )); echo "$t" > "$TICKS"
  if [ $(( t % 3 )) -ne 0 ]; then
    echo "[$(ts)] backoff: streak $streak, skipping tick $t"
    exit 0
  fi
fi

# decorrelate from the fixed 5-min grid so fetches don't look mechanical
sleep $(( RANDOM % 45 ))

echo "[$(ts)] pull start"

git pull --rebase --autostash origin main >/dev/null 2>&1 || mark_failure "git pull --rebase failed"

"$PYTHON" scripts/fetch_events.py --no-push || mark_failure "Bandsintown fetch failed (see log above)"

# Heartbeat: proof the whole pull->push->deploy chain works, committed at
# most once a day even when no events changed.
hb_age_ok() {
  [ -f heartbeat.txt ] || return 1
  python3 -c "
import datetime,sys
try:
    t=datetime.datetime.fromisoformat(open('heartbeat.txt').read().strip().replace('Z','+00:00'))
    sys.exit(0 if (datetime.datetime.now(datetime.timezone.utc)-t).total_seconds() < 20*3600 else 1)
except Exception: sys.exit(1)"
}

# change detection must catch NEW files too (fresh flyers are untracked)
changed=$(git status --porcelain events.json assets/flyers 2>/dev/null)

if [ -z "$changed" ]; then
  if hb_age_ok; then
    echo "[$(ts)] no change, nothing to deploy"
    mark_success
    exit 0
  fi
  echo "[$(ts)] no event change, refreshing daily heartbeat"
fi

ts > heartbeat.txt
git add events.json assets/flyers heartbeat.txt
git -c user.name="stratus-events-bot" -c user.email="actions@users.noreply.github.com" \
    commit -q -m "Auto-update events from Bandsintown ($(date -u +"%Y-%m-%d %H:%MZ"))"

if ! git push -q origin main 2>/dev/null; then
  git pull --rebase --autostash origin main >/dev/null 2>&1
  git push -q origin main 2>/dev/null || mark_failure "git push failed twice"
fi

echo "[$(ts)] pushed fresh data, site redeploying"
mark_success
