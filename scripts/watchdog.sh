#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG=/tmp/wangshu-watchdog.log

api_up() { curl --max-time 2 -sf http://127.0.0.1:3100/api/health >/dev/null 2>&1; }
web_up() { curl --max-time 2 -sf http://127.0.0.1:5173/ >/dev/null 2>&1 || curl --max-time 2 -sf http://127.0.0.1:5174/ >/dev/null 2>&1; }

echo "$(date -Is) watchdog start" >> "$LOG"

while true; do
  if ! api_up && ! ss -tln 2>/dev/null | grep -q ':3100'; then
    echo "$(date -Is) API down, restart" >> "$LOG"
    nohup setsid pnpm --filter @wangshu/api start >> /tmp/wangshu-api.log 2>&1 < /dev/null &
    sleep 4
  fi
  if ! web_up; then
    echo "$(date -Is) WEB down, restart on 5174" >> "$LOG"
    nohup setsid pnpm --filter @wangshu/web dev --host 0.0.0.0 --port 5174 >> /tmp/wangshu-web.log 2>&1 < /dev/null &
    sleep 4
  fi
  sleep 15
done
