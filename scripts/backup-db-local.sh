#!/usr/bin/env bash
# 在服务器本机执行：SQLite backup API + 完整性检查 + 健康检查 + 14 天保留。
# 由 deploy 用户的 cron 每天 03:30 调用；失败会写 LAST_FAILURE 并打 syslog。
set -euo pipefail

DB="/opt/wangshu/data/wangshu.db"
DIR="/opt/wangshu/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="$DIR/wangshu-$STAMP.db"
mkdir -p "$DIR"

fail() {
  local reason="$1"
  echo "$(date -Iseconds) $reason" | tee "$DIR/LAST_FAILURE" >&2
  logger -t wangshu-backup "FAILED: $reason" || true
  exit 1
}
trap 'fail "backup script aborted at line $LINENO"' ERR

python3 - "$DB" "$TARGET" <<'PY'
import sqlite3, sys
src_path, dst_path = sys.argv[1], sys.argv[2]
src = sqlite3.connect(src_path)
dst = sqlite3.connect(dst_path)
with dst:
    src.backup(dst)
check = dst.execute("pragma integrity_check").fetchone()[0]
orders = dst.execute("select count(*) from orders").fetchone()[0]
src.close(); dst.close()
if check != "ok":
    raise SystemExit("integrity_check failed: " + check)
print("integrity=ok orders=" + str(orders))
PY

if ! curl --max-time 8 -fsS http://127.0.0.1:3100/api/health >/dev/null; then
  fail "api health check failed after backup"
fi

find "$DIR" -name 'wangshu-*.db' -type f -mtime +14 -delete
rm -f "$DIR/LAST_FAILURE"
logger -t wangshu-backup "OK $TARGET"
echo "backup ok: $TARGET"
