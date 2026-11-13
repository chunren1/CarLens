#!/usr/bin/env bash
# 构建并部署到通过 DEPLOY_HOST 指定的服务器（不写死 IP）。
# 前置：设置 DEPLOY_HOST（user@host）；服务器已装 Node 24 + tsx，见 docs/deploy-ip.md。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOST="${DEPLOY_HOST:?请设置 DEPLOY_HOST，例如 deploy@your-server-ip}"
WEB_HOST="${HOST#*@}"
REMOTE_APP=/opt/wangshu/app
REMOTE_DATA=/opt/wangshu/data
REMOTE_WEB=/var/www/wangshu

echo "==> 1/5 构建 Web"
pnpm --filter @wangshu/web build

echo "==> 2/5 打包 API（生产依赖）"
rm -rf /tmp/wangshu-api-deploy
pnpm --filter @wangshu/api deploy --prod /tmp/wangshu-api-deploy >/tmp/wangshu-api-deploy.log
tail -3 /tmp/wangshu-api-deploy.log
rm -rf /tmp/wangshu-api-deploy/data

echo "==> 3/5 准备服务器目录"
ssh "$HOST" "sudo mkdir -p $REMOTE_APP $REMOTE_DATA $REMOTE_WEB && sudo chown -R deploy:deploy /opt/wangshu $REMOTE_WEB"

echo "==> 4/5 上传（API / Web）"
rsync -az /tmp/wangshu-api-deploy/ "$HOST:$REMOTE_APP/"
rsync -az apps/web/dist/ "$HOST:$REMOTE_WEB/"
ssh "$HOST" "mkdir -p $REMOTE_APP/scripts"
scp -q scripts/backup-db-local.sh "$HOST:$REMOTE_APP/scripts/backup-db-local.sh"
ssh "$HOST" "chmod +x $REMOTE_APP/scripts/backup-db-local.sh"

echo "==> 5/5 首次种子与重启"
if ! ssh "$HOST" "test -f $REMOTE_DATA/wangshu.db"; then
  : "${ADMIN_PASSWORD:?首次 seed 必须设置 ADMIN_PASSWORD}"
  ssh "$HOST" "cd $REMOTE_APP && ADMIN_PASSWORD='$ADMIN_PASSWORD' ALLOW_DB_RESET=1 DATABASE_URL=$REMOTE_DATA/wangshu.db /opt/node/bin/tsx src/db/seed.ts"
fi
ssh "$HOST" 'sudo systemctl restart wangshu-api
for i in 1 2 3 4 5 6; do
  if curl --max-time 3 -fsS http://127.0.0.1:3100/api/health; then exit 0; fi
  sleep 1
done
exit 1'

echo
echo "部署完成：http://$WEB_HOST/"
echo "健康检查：curl --max-time 8 http://$WEB_HOST/api/health"