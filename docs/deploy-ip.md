# 部署到 IP / 域名（历史流程，2026-11-12）

> **公开版说明：** 文中的 `203.0.113.10` 是占位符，真实服务器地址不写入公开仓库；部署用 `DEPLOY_HOST` 环境变量。

> **以 [DEPLOY-STATE.md](DEPLOY-STATE.md) 为准。** 域名已上线：**https://ziphare.me/**；IP `http://203.0.113.10/` 仅兜底，HTTP 上不能登录（Secure cookie）。
> 本文保留 IP 直连与部署脚本细节；nginx/证书/隧道/验收请看 DEPLOY-STATE。

## 架构

```
浏览器
  │  https://ziphare.me/（Cloudflare 边缘 + 隧道）
  ▼
cloudflared → nginx :80（server_name ziphare.me www.ziphare.me 203.0.113.10，root /var/www/wangshu）
  ├── /assets /models /images /basis  → /var/www/wangshu 静态文件
  ├── /api/                            → 127.0.0.1:3100（systemd: wangshu-api）
  └── 其它路径                          → /index.html（SPA fallback）

server:
  /opt/node                 Node v24.19.0 + tsx 4.20.6（全局）
  /opt/wangshu/app          API 源码 + 生产 node_modules（pnpm deploy 产物）
  /opt/wangshu/data         SQLite（wangshu.db，WAL）
  /var/www/wangshu          Web dist（含 3D 模型 19MB）
  /etc/systemd/system/wangshu-api.service
  /etc/nginx/sites-available/wangshu
```

- API 只监听 `127.0.0.1:3100`，公网只能通过 nginx `/api/` 访问。
- 数据持久化在 `/opt/wangshu/data`，重新部署不会覆盖。
- 当前 HTTP 演示，cookie 通过 `COOKIE_SECURE=false` 关闭 Secure；上 HTTPS 后改回 true。
- 服务器上原有的 ziphare 配置（`/etc/nginx/sites-enabled/ziphare`、`/var/www/site`）保持不动。

## 首次部署（已完成，留档）

1. 服务器装 Node 24（官方 tarball 校验 SHA256）：

```bash
ssh deploy@203.0.113.10
curl -fsSLO https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz
curl -fsSLO https://nodejs.org/dist/v24.19.0/SHASUMS256.txt
grep node-v24.19.0-linux-x64.tar.xz SHASUMS256.txt | sha256sum -c -
sudo mkdir -p /opt/node
sudo tar -xJf node-v24.19.0-linux-x64.tar.xz -C /opt/node --strip-components=1
sudo ln -sf /opt/node/bin/node /usr/local/bin/node
sudo ln -sf /opt/node/bin/npm /usr/local/bin/npm
sudo /opt/node/bin/npm install -g tsx@4.20.6
```

2. 建目录、部署服务与 nginx：

```bash
sudo mkdir -p /opt/wangshu/app /opt/wangshu/data /var/www/wangshu
sudo chown -R deploy:deploy /opt/wangshu /var/www/wangshu
sudo cp deploy/wangshu-api.service /etc/systemd/system/wangshu-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now wangshu-api
sudo cp deploy/nginx-wangshu.conf /etc/nginx/sites-available/wangshu
sudo ln -sf /etc/nginx/sites-available/wangshu /etc/nginx/sites-enabled/wangshu
sudo nginx -t && sudo systemctl reload nginx
```

3. 首次数据库：从本机备份复制或服务器 seed。当前线上保留的是本机 Demo 数据（演示账号 / 管理员 / 订单 / 线索）。

## 日常部署

本机执行：

```bash
cd /home/user/projects/wangshu
./scripts/deploy-ip.sh
```

脚本做五件事：

1. `pnpm --filter @wangshu/web build`（root base，API 走同源 `/api`）
2. `pnpm --filter @wangshu/api deploy --prod /tmp/wangshu-api-deploy`（含 better-sqlite3 原生模块）
3. 建目录并 `rsync --delete` 上传 API 与 Web
4. 若线上无数据库则远程 seed；**有数据库绝不覆盖**
5. `systemctl restart wangshu-api`，请求 `/api/health`

> 注意：本机与服务器都是 Linux x64 / Node 24，`better-sqlite3` 原生二进制可直接复用。换 Node 大版本或换架构时要重新 `pnpm deploy`。

## 验证

```bash
curl -sI https://ziphare.me/ | head -8
curl -s https://ziphare.me/api/health
curl -s https://ziphare.me/api/models | head -c 200
curl -sI https://ziphare.me/models | head -3
```

浏览器：统一用 https://ziphare.me/；首页、`/configurator/s7`（图片配置器）、登录、报价、下单、支付、`/account`、`/admin`。IP 只适合看页面，不能登录。

演示账号见 [docs/status.md](status.md)。管理员：`admin@wangshu.test`。

## 每日备份

服务器已装 `/etc/cron.d/wangshu-backup`，每天 04:20 执行 `/opt/wangshu/backup.py`：

- 在线 SQLite backup 到 `/opt/wangshu/backups/wangshu-YYYYmmdd-HHMMSS.db`
- 自动删除 14 天前的备份
- 日志：`/var/log/wangshu-backup.log`

手动执行：`ssh deploy@203.0.113.10 '/usr/bin/python3 /opt/wangshu/backup.py'`

## 数据备份 / 恢复

```bash
# 备份（服务器上用 Python sqlite3 的在线 backup，避免直接 cp WAL）
ssh deploy@203.0.113.10 'python3 - <<PY
import sqlite3
src=sqlite3.connect("/opt/wangshu/data/wangshu.db")
dst=sqlite3.connect("/opt/wangshu/data/backup-$(date +%Y%m%d-%H%M).db")
src.backup(dst); dst.close(); src.close()
print("backup ok")
PY'

# 恢复：停 API → 覆盖 → 启动
ssh deploy@203.0.113.10 'sudo systemctl stop wangshu-api'
scp /path/to/backup.db deploy@203.0.113.10:/opt/wangshu/data/wangshu.db
ssh deploy@203.0.113.10 'sudo systemctl start wangshu-api'
```

## 排障

| 现象 | 检查 |
|---|---|
| 502 / 接口 500 | `ssh deploy@... 'systemctl status wangshu-api; journalctl -u wangshu-api -n 80'` |
| 首页 404 | `sudo nginx -t`；`ls /var/www/wangshu/index.html`；server_name 是否为 IP |
| API 404 | 必须带 Host `203.0.113.10`；nginx 的 location `/api/` |
| 3D 一直转 | 看浏览器 Network 的 `/models/*.glb` 是否 200；弱网等待 10–15s；失败会切静帧 |
| 登录后刷新掉线 | 检查是否 HTTPS 但 `COOKIE_SECURE=false`，或 HTTP 但 cookie 被设 Secure |
| 订单没数据 | `/opt/wangshu/data/wangshu.db` 是否存在；服务日志是否迁移失败 |

## 域名/HTTPS 以后

- 域名实名 + 备案完成后，在 nginx 增加 `server_name ziphare.me www.ziphare.me` 或新子域，申请证书；
- 将 systemd 的 `COOKIE_SECURE` 改为 `true`；
- 把 nginx 80 跳 443；
- 不要把未备案域名直接 A 记录到大陆 IP（会被拦），继续走 Cloudflare 隧道或备案。