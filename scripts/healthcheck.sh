#!/usr/bin/env bash
#
# Probe the readiness endpoint and alert when it fails.
#
# Run from cron every minute, or point an uptime monitor at the same URL:
#   * * * * *  cd /srv/bpkihs-alumni && ./scripts/healthcheck.sh >> /var/log/bpkihs-health.log 2>&1
#
# Optional:
#   HEALTHCHECK_URL               default http://127.0.0.1:3000/api/health
#   HEALTHCHECK_TIMEOUT_SECONDS   default 10
#   ALERT_WEBHOOK_URL             Slack-compatible JSON webhook; needs jq
#
# The endpoint answers 503 when the database query fails, so a 200 here means the process
# and its database are both usable, not merely that the port is open.
set -euo pipefail

health_url="${HEALTHCHECK_URL:-http://127.0.0.1:3000/api/health}"
timeout_seconds="${HEALTHCHECK_TIMEOUT_SECONDS:-10}"
webhook="${ALERT_WEBHOOK_URL:-}"

if curl --fail --silent --show-error --max-time "$timeout_seconds" "$health_url" >/dev/null; then
  exit 0
fi

message="BPKIHS Alumni: health check failed at ${health_url} on $(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "$message" >&2

if [[ -n "$webhook" ]]; then
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg text "$message" '{text: $text}' |
      curl --fail --silent --show-error --max-time "$timeout_seconds" \
        -H 'Content-Type: application/json' --data-binary @- "$webhook" >/dev/null || true
  else
    echo "ALERT_WEBHOOK_URL is set but jq is not installed; alert not sent" >&2
  fi
fi

exit 1
