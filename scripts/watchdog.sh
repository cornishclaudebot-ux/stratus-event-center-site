#!/bin/bash
# ============================================================
# Stratus Event Center — daily end-to-end watchdog (launchd, 9:05am)
# Checks what USERS actually see, not what we hope is running:
#   1. the live site loads (Pages + TLS)
#   2. live heartbeat.txt is fresh (<30h) -> whole pull->push->deploy chain
#   3. live events.json parses and carries an events array
#   4. Resend key valid -> the alert path itself works
# Any failure -> one plain email listing exactly what is broken.
# All green -> silence.
# ============================================================
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
SITE="https://cornishclaudebot-ux.github.io/stratus-event-center-site"
ALERT_TO="dartyforlife@gmail.com"
ALERT_FROM="Stratus Site Watchdog <rentals@apexaz.ai>"
KEY=$(grep '^RESEND_API_KEY=' /Users/aidencornish/apex-audit-engine/.env 2>/dev/null | cut -d= -f2)
FAILS=""

add_fail() { FAILS="${FAILS}- $1"$'\n'; }

# 1. site up
code=$(curl -s -o /dev/null -w "%{http_code}" -m 20 "$SITE/")
[ "$code" = "200" ] || add_fail "Stratus site returned $code (site down or Pages broken)"

# 2. pipeline heartbeat on the LIVE site
fresh=$(curl -s -m 20 "$SITE/heartbeat.txt" | python3 -c "
import sys,datetime
try:
    t=datetime.datetime.fromisoformat(sys.stdin.read().strip().replace('Z','+00:00'))
    age=(datetime.datetime.now(datetime.timezone.utc)-t).total_seconds()/3600
    print('OK' if age < 30 else f'STALE {age:.0f}h')
except Exception as e:
    print('BROKEN', e)")
[ "$fresh" = "OK" ] || add_fail "live heartbeat is $fresh (event sync chain broken - check ~/stratus-event-center-site/logs/events-sync.log, and whether this Mac was asleep)"

# 3. live events.json sane
evs=$(curl -s -m 20 "$SITE/events.json" | python3 -c "
import sys,json
try:
    j=json.load(sys.stdin)
    print('OK' if isinstance(j.get('events'),list) else 'NO-ARRAY')
except Exception:
    print('UNPARSEABLE')")
[ "$evs" = "OK" ] || add_fail "live events.json is $evs (site is falling back to baked-in events)"

# 4. resend key
rcode=$(curl -s -o /dev/null -w "%{http_code}" -m 20 "https://api.resend.com/domains" -H "Authorization: Bearer $KEY")
[ "$rcode" = "200" ] || add_fail "Resend API key check returned $rcode (alert emails would not deliver)"

if [ -n "$FAILS" ]; then
  echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") FAILURES:"; printf '%s' "$FAILS"
  [ -n "$KEY" ] && curl -s -m 20 -X POST "https://api.resend.com/emails" \
    -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
    -d "$(python3 -c 'import json,sys; print(json.dumps({"from":sys.argv[1],"to":[sys.argv[2]],"subject":"Stratus daily check: something is broken","text":"Daily Stratus site health check found problems:\n\n"+sys.argv[3]+"\nEverything not listed above is working."}))' \
        "$ALERT_FROM" "$ALERT_TO" "$FAILS")" >/dev/null
else
  echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") all checks green"
fi
