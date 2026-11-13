# E2E 与运维

## 本地 E2E

命令：

    pnpm test:e2e

实现：scripts/e2e-local.sh

- 用临时 SQLite（/tmp/wangshu-e2e.db），先 seed，再启动本地 API 3100 + Vite 5173
- 跑 tests/e2e/core-flow.test.mjs
- 结束后用 fuser 清理 3100/5173，避免残留进程
- 需要 Chrome（默认 /usr/bin/google-chrome，可用 E2E_CHROME_PATH 覆盖）和 .secrets/admin-password

覆盖：

1. 配置器切 2D、生成报价、立即下订、填购车信息、模拟支付、进入订单详情页
2. 后台管理员登录、进入“换色图”审核页
3. 2D 模式断言不请求 three.js chunk

## 3D 拆包

vite.config.ts 的 manualChunks 把 3D 依赖拆成：

- three-core：约 583 KB（gzip 145 KB）
- three-addons：约 377 KB（gzip 147 KB）
- basis_transcoder：约 527 KB（wasm，按需）

只有点开 3D 模式才加载；2D 模式不请求上述文件，E2E 有断言。

## 服务器备份

已安装 deploy 用户 cron：

    30 3 * * * /opt/wangshu/app/scripts/backup-db-local.sh >> /opt/wangshu/backups/backup.log 2>&1

脚本做四件事：

1. SQLite backup API 备份到 /opt/wangshu/backups/wangshu-时间.db
2. integrity_check
3. /api/health 健康检查
4. 清理 14 天前备份

失败时：

- 写 /opt/wangshu/backups/LAST_FAILURE
- 写 syslog（logger -t wangshu-backup）
- 退出码非 0，cron 日志可查

当前没有接外部告警渠道（邮件/Webhook），失败以日志和 LAST_FAILURE 文件为准；需要接企业微信/邮件时可在 fail() 里加 curl。

## 部署

deploy-ip.sh 会同时上传 backup-db-local.sh，但不会自动改 crontab；

首次安装/更新 cron：

    ./scripts/install-backup-cron.sh
