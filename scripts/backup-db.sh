#!/usr/bin/env bash
# 备份线上 SQLite：在服务器侧用 sqlite backup API，避免直接 cp 正在写入的库。
# 用法：DEPLOY_HOST=deploy@47.119.159.250 ./scripts/backup-db.sh
set -euo pipefail
HOST="${DEPLOY_HOST:-deploy@47.119.159.250}"
STAMP="$(date +%Y%m%d-%H%M%S)"
REMOTE="/opt/wangshu/backups/wangshu-${STAMP}.db"

ssh "$HOST" "mkdir -p /opt/wangshu/backups && python3 - <<'PY'
import sqlite3
src = sqlite3.connect('/opt/wangshu/data/wangshu.db')
dst = sqlite3.connect('${REMOTE}')
with dst:
    src.backup(dst)
src.close()
dst.close()
print('${REMOTE}')
PY
find /opt/wangshu/backups -name 'wangshu-*.db' -type f -mtime +14 -delete
ls -lh '${REMOTE}'"

echo "backup done: ${REMOTE}"
