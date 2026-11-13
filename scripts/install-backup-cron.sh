#!/usr/bin/env bash
# 上传并安装服务器侧每日备份 cron。可重复执行。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:?请设置 DEPLOY_HOST，例如 deploy@your-server-ip}"
ssh "$HOST" "mkdir -p /opt/wangshu/app/scripts /opt/wangshu/backups"
scp -q "$ROOT/scripts/backup-db-local.sh" "$HOST:/opt/wangshu/app/scripts/backup-db-local.sh"
ssh "$HOST" 'chmod +x /opt/wangshu/app/scripts/backup-db-local.sh
  TMP=$(mktemp)
  crontab -l 2>/dev/null | grep -v "backup-db-local.sh" > "$TMP" || true
  echo "30 3 * * * /opt/wangshu/app/scripts/backup-db-local.sh >> /opt/wangshu/backups/backup.log 2>&1" >> "$TMP"
  crontab "$TMP"
  rm -f "$TMP"
  crontab -l | grep backup-db-local.sh'
echo "backup cron installed on $HOST"
