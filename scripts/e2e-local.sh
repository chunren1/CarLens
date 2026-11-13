#!/usr/bin/env bash
# 本地 E2E：使用临时 SQLite 副本，不污染线上/本地开发库。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB="/tmp/wangshu-e2e.db"
LOG_DIR="/tmp/wangshu-e2e"
rm -rf "$LOG_DIR"; mkdir -p "$LOG_DIR"
rm -f "$DB" "$DB-wal" "$DB-shm"

ADMIN_PASSWORD="$(cat .secrets/admin-password)" ALLOW_DB_RESET=1 DATABASE_URL="$DB"   pnpm --filter @wangshu/api db:seed >/dev/null

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then pkill -P "$API_PID" 2>/dev/null || true; kill "$API_PID" 2>/dev/null || true; fi
  if [[ -n "${WEB_PID:-}" ]]; then pkill -P "$WEB_PID" 2>/dev/null || true; kill "$WEB_PID" 2>/dev/null || true; fi
  fuser -k 3100/tcp 5173/tcp 2>/dev/null || true
}
trap cleanup EXIT
fuser -k 3100/tcp 5173/tcp 2>/dev/null || true

DATABASE_URL="$DB" PORT=3100 NODE_ENV=test COOKIE_SECURE=false pnpm --filter @wangshu/api start >"$LOG_DIR/api.log" 2>&1 &
API_PID=$!
pnpm --filter @wangshu/web dev --host 127.0.0.1 >"$LOG_DIR/web.log" 2>&1 &
WEB_PID=$!

for i in {1..40}; do
  if curl --max-time 2 -fsS http://127.0.0.1:3100/api/health >/dev/null 2>&1 && curl --max-time 2 -fsS http://127.0.0.1:5173/ >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl --max-time 5 -fsS http://127.0.0.1:3100/api/health >/dev/null
curl --max-time 5 -fsS http://127.0.0.1:5173/ >/dev/null

E2E_BASE_URL="http://127.0.0.1:5173" E2E_ADMIN_PASSWORD="$(cat .secrets/admin-password)" \
  node --test tests/e2e/core-flow.test.mjs
