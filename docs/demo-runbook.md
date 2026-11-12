# Demo v0.5 运行手册

## 公网（已上线）

- **https://ziphare.me/**（Cloudflare 隧道 → nginx + systemd `wangshu-api` + SQLite）
- IP `http://203.0.113.10/` 仅兜底、不能登录。
- 生产现状见 [DEPLOY-STATE.md](DEPLOY-STATE.md)；部署/排障见 [deploy-ip.md](deploy-ip.md)。
- 演示账号：`demo@wangshu.test` / `（演示口令，见现场）`；管理员：`admin@wangshu.test`（口令见本机 `.secrets/admin-password`，不入库）。

## 首次准备

    pnpm install
    ./scripts/setup-assets.sh
    pnpm --filter @wangshu/api db:seed

## 启动

    pnpm dev

- Web: http://127.0.0.1:5173
- API: http://127.0.0.1:3100
- 不要把 API 改到 3000：本机 3000 被 vibeMusic 占用。

## 接口冒烟

    ./scripts/smoke-api.sh

## 截图

    node scripts/shot-demo.mjs

输出到 docs/screens/demo-*.png。

## 后台任务退出 134（better-sqlite3 / Node 24）

API 用工具的后台任务启动时，任务被回收会触发 better-sqlite3 在 Node 24 的 teardown abort（exit 134），不是业务异常。演示时用 detached 方式启动：

    cd /home/user/projects/wangshu
    nohup setsid pnpm --filter @wangshu/api start > /tmp/wangshu-api.log 2>&1 < /dev/null &
    nohup setsid pnpm --filter @wangshu/web dev --host 0.0.0.0 > /tmp/wangshu-web.log 2>&1 < /dev/null &

检查：

    curl --max-time 4 http://127.0.0.1:3100/api/health
    ss -tlnp | grep -E ':(3100|5173|5174)'

若 5173 被旧进程占用，Vite 会自动落到 5174；Windows 访问 http://localhost:5174 或 WSL IP:5174。

## 常见问题

### better-sqlite3: MODULE_NOT_FOUND

pnpm 11 默认忽略构建脚本。手工构建：

    cd node_modules/.pnpm/better-sqlite3@13.1.1/node_modules/better-sqlite3
    npm run build-release

### R1 贴图全黑 / KTX2 报错

确认 apps/web/public/basis/basis_transcoder.js 与 .wasm 存在；可重跑 ./scripts/setup-assets.sh。

### 车型图加载慢

配置器用静态车型图，不再加载 3D 模型；若图片慢，检查 `/images/*.webp` 与 nginx 缓存。

### 端口冲突

    ss -tlnp | grep -E ':(3100|5173)'

## 数据

SQLite 文件：apps/api/data/wangshu.db（gitignore）。重置：

    rm -f apps/api/data/wangshu.db
    pnpm --filter @wangshu/api db:seed