# 项目交接文档 · 车鉴 CarLens

> 交接对象：另一台电脑上的开发 agent（不是项目所有者的原电脑）。
> 交接目标：让接手 agent 能独立启动、开发、测试、部署这套项目，不靠猜。
> 当前公开仓库：https://github.com/chunren1/CarLens （main）
> 线上：https://ziphare.me/
> 本文不包含服务器地址、管理员口令等敏感信息；这些在私密附件中。

---

## 0. 先读这一段

这是一个已经上线、已经答辩可用的毕业设计项目，不是空仓库。

接手后**先不要重构**。按本文件顺序完成环境、私密资产、启动、测试，再改代码。

当前状态：

- 10 个品牌 / 20 款车型 / 45 个版本
- 7 款车有 2D 换色图，共 25 张；其余 13 款回退封面
- 3D 全系共用 s7.glb
- API 测试 45/45，共享定价测试 5/5，E2E 2/2
- 线上健康检查 db: ok
- 每日 03:30 自动 SQLite 备份
- 支付是模拟支付，不接真实商户

项目所有者的偏好：

- 先保证可演示、可回滚，再加功能
- 不为了“用新技术”换数据库；SQLite 是明确取舍
- 提交前必须跑 typecheck / test / build
- 没有明确授权不要 push 公开仓库

---

## 1. 交接包清单

### 1.1 从 Git 仓库得到

    git clone git@github.com:chunren1/CarLens.git
    cd CarLens

仓库包含：源码、迁移、测试、图片、论文、PPT、部署配置、文档。

### 1.2 Git 不包含，必须由项目所有者单独安全传给你

这些文件在 .gitignore 里，**不在公开仓库**：

| 文件/目录 | 用途 | 原机器路径 |
|---|---|---|
| .secrets/admin-password | 本地/线上管理员口令 | 项目根 .secrets/admin-password |
| .secrets/HANDOFF-PRIVATE.md | 服务器 DEPLOY_HOST 等私密信息 | 项目根 .secrets/HANDOFF-PRIVATE.md |
| apps/web/public/models/s7.glb | 3D 配置器共用模型，约 4.3 MB | apps/web/public/models/s7.glb |
| apps/web/public/basis/ | KTX2 transcoder，约 572 KB | apps/web/public/basis/ |
| docs/thesis/source/ | 学校规范/模板原件，仅本地参考 | docs/thesis/source/ |

传输方式建议：U 盘、加密压缩包、1Password/私密网盘，不要发到公开群聊或提交 Git。

没有 s7.glb 的后果：2D 配置器正常，3D 模式加载失败并回退海报。
没有 basis 的后果：3D 的 KTX2 贴图可能不显示。

如果原机器上还保留 s7 的源模型，路径是 /mnt/d/edge/generic_sedan_car.glb（仅原机器有）；新机器不必须有它，直接复制压缩后的 s7.glb 即可。

### 1.3 新电脑环境

已验证环境：

- Node.js 24.19.0（Node 22+ 也可，但建议 24）
- pnpm 11.28.5（packageManager 已锁）
- Git
- Chrome/Chromium（E2E 需要）
- 推荐 WSL2 / Linux 原生文件系统，不要把项目放 /mnt/c 或 /mnt/d 上开发

安装依赖：

    corepack enable
    corepack prepare pnpm@11.28.5 --activate
    pnpm install

如果新机器没有 Chrome：

- 安装 Google Chrome；E2E 默认找 /usr/bin/google-chrome
- 或设置 E2E_CHROME_PATH=/path/to/chrome

---

## 2. 第一次启动（按顺序）

### 2.1 放好私密资产

    mkdir -p .secrets apps/web/public/models apps/web/public/basis
    # 从所有者处拷入这些文件：
    # .secrets/admin-password
    # .secrets/HANDOFF-PRIVATE.md
    # apps/web/public/models/s7.glb
    # apps/web/public/basis/basis_transcoder.js
    # apps/web/public/basis/basis_transcoder.wasm

chmod 600 .secrets/admin-password .secrets/HANDOFF-PRIVATE.md

### 2.2 生成 KTX2 资源（如果 basis 没拷）

    ./scripts/setup-assets.sh

脚本会：

- 如果 models/s7.glb 已存在，跳过模型压缩
- 从 apps/web/node_modules/three/examples/jsm/libs/basis 复制 transcoder

如果 s7.glb 不存在，脚本会尝试从 /mnt/d/edge/generic_sedan_car.glb 生成，这个路径在新电脑通常不存在；所以优先直接拷 s7.glb。

### 2.3 初始化本地数据库

    ADMIN_PASSWORD='本地管理员口令，至少 12 位' \
      pnpm --filter @wangshu/api db:seed

说明：

- 本地数据库路径默认 apps/api/data/wangshu.db
- 这个命令会重建本地演示数据
- **绝对不要对生产库执行 db:seed**，会清空线上订单/线索/用户

### 2.4 启动

    pnpm dev

或分开：

    pnpm dev:api   # http://127.0.0.1:3100
    pnpm dev:web   # http://127.0.0.1:5173

打开 http://127.0.0.1:5173。

### 2.5 第一次验收

    curl -s http://127.0.0.1:3100/api/health
    curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5173/

应该看到：

    {"status":"ok","version":"0.1.0","db":"ok","time":"..."}
    200

然后手动检查：

1. 首页轮播正常
2. /models 20 款车
3. /models/tesla-model3 详情
4. /configurator/s7：3D 能出车；切 2D 不请求 three
5. /admin：管理员能登录
6. /posters：海报馆正常

---

## 3. 项目地图

    apps/web                    Vue 3 + TypeScript + Vite + Pinia + Vue Router
      src/pages                 24 个页面（首页/车型/配置器/订单/后台/论文无关）
      src/components            Header/Footer/HeroCarousel/ModelCard/StateBlock/3D
      src/stores                auth / configurator
      src/lib                   api / assets / format / config-snapshot
      public/images/brands      20 张 1600×1000 车型基准图
      public/images/paints      25 张换色图（7 款车）
      public/images/masks       5 张 mask（第一批颜色）
      public/models/s7.glb      3D 模型（Git 忽略，需单独拿）
      public/basis              KTX2 解码器（Git 忽略，setup-assets 生成）

    apps/api                    Fastify 5 + Drizzle + better-sqlite3 + Zod
      src/server.ts             入口
      src/routes                 auth/models/quote/orders/payments/test-drives/stores/news/admin/health
      src/repositories           catalog/orders
      src/db/schema.ts          18 张表
      src/db/client.ts          SQLite 连接、WAL、busy_timeout、迁移
      src/db/seed.ts            20 款车/45 版本的种子
      migrations                Drizzle SQL 迁移

    packages/shared             共享类型 + 计价引擎（整数分）
      src/pricing.ts            裸车/税/保险/上牌/定金
      src/types.ts              ModelSummary / OptionCatalog / Order

    scripts                     部署、备份、E2E、素材/爬虫（部分一次性）
    docs                        设计、部署、论文、验收
    HANDOFF.md                  本文

### 关键页面

- / 首页：20 款车轮播
- /models：品牌筛选 + 20 款车
- /models/:slug：详情
- /configurator/:slug：3D/2D 配置器
- /quote → /order/new → /pay/:orderNo → /orders/:orderNo
- /admin：概览/订单/线索/车型价格/门店/新闻/换色图
- /wizard /compare /stores /test-drive /finance /service /posters /news
- 404：/:pathMatch(.*)*

---

## 4. 业务与数据

### 计价

所有金额 integer 分：

    S = trim + paint + wheel + interior + packages
    Tfull = round(S / 1.13 * 0.10)
    Trelief = min(round(Tfull * 0.5), 1_500_000)
    I = roundTo(S * 0.022 + 95_000, 1_000)
    R = 50_000
    D = 500_000
    Total = S + Tfull - Trelief + I + R

实现：packages/shared/src/pricing.ts。
前端只传选项 id，API 重算，不信任前端金额。

### 订单

- 订单号：WS + 日期 + 8 位随机十六进制
- 下订支持 Idempotency-Key（8–80 位），重复请求返回原订单
- 同 key 不同手机号返回 409 IDEMPOTENCY_CONFLICT
- 订单保存 config_json 快照
- 支付：模拟支付，payments 幂等，不接商户

### 数据表

users / sessions / models / trims / paints / wheels / interiors / packages /
model_options / option_rules / configs / stores / leads / appointments /
orders / payments / settings / news / model_paint_images

关键唯一索引：

- orders.idempotency_key
- model_paint_images(model_id, paint_id)
- 其他按 schema.ts

### 车型数据

- 20 款车型、10 品牌
- 45 个版本
- 车漆 5 色：玄空黑/雪域白/时光灰/亚特兰蒂斯灰/极光蓝
- 选装：3 轮毂 / 2 内饰 / 3 选装包
- 4 门店 / 4 新闻
- 换色图：7 款车 25 张；其余回退 heroImage

新增车型：

1. 在 apps/api/src/db/seed.ts 的 MODEL_SEED 增加车型和 trims
2. 在 apps/web/public/images/brands 放 1600×1000 WebP
3. 本地 db:seed 重建
4. 如需换色图，按 docs/IMAGE-BATCH1.md 的流程做 mask + WebP + generation-log
5. 更新 docs/status.md 的数据规模

---

## 5. 开发命令

    pnpm install
    pnpm dev
    pnpm typecheck        # shared + api + web
    pnpm test             # 共享定价 + API；45 API + 5 shared
    pnpm test:e2e         # 本地临时库 + Chrome，起 3100/5173
    pnpm --filter @wangshu/web build
    pnpm --filter @wangshu/api typecheck

### E2E

    pnpm test:e2e

要求：

- .secrets/admin-password 存在
- Chrome 在 /usr/bin/google-chrome，或设置 E2E_CHROME_PATH
- 3100/5173 可用（脚本会先 fuser 清理）

覆盖：

- 2D 配置 → 报价 → 下订 → 模拟支付
- 管理员登录 → 换色图审核页
- 断言 2D 不请求 three chunk

E2E 用 /tmp/wangshu-e2e.db，seed 临时库，不碰线上和本地开发库。

### 构建

    pnpm --filter @wangshu/web build

3D 已拆成 three-core / three-addons；只有 3D 模式加载。

---

## 6. 部署

### 6.1 前提

- 服务器信息在 .secrets/HANDOFF-PRIVATE.md（DEPLOY_HOST）
- 本机有对应 SSH 私钥，且已在服务器 authorized_keys
- 服务器 deploy 用户可 sudo systemctl/nginx
- 服务器是部署机，不是构建机（内存约 1.7G，不能构建）
- 一律在本地构建再上传

### 6.2 部署命令

    cd CarLens
    DEPLOY_HOST='<从私密文件读取>' ./scripts/deploy-ip.sh

脚本会：

1. 本地 pnpm web build
2. 打包 API 生产依赖
3. rsync API 到 /opt/wangshu/app
4. rsync dist 到 /var/www/wangshu
5. 上传 scripts/backup-db-local.sh
6. 首次无库时 seed（需要 ADMIN_PASSWORD 环境变量）
7. systemctl restart wangshu-api
8. 健康检查

验收：

    curl -s https://ziphare.me/api/health
    # {"status":"ok","db":"ok",...}

### 6.3 不能做的事

- 不要在服务器跑 pnpm build（内存不足）
- 不要在生产跑 db:seed（会清空数据）
- 不要给 deploy 脚本加 rsync --delete（历史上有安全问题；清理静态资源要按 manifest）
- 不要在 HTTP IP 上登录（COOKIE_SECURE=true，登录会看似成功但立刻失效）

### 6.4 nginx / systemd

- nginx 配置：deploy/nginx-wangshu.conf，线上 /etc/nginx/sites-available/wangshu
- systemd：deploy/wangshu-api.service，线上 /etc/systemd/system/wangshu-api.service
- 必须保留：
  - COOKIE_SECURE=true
  - /models 的 SPA 路由与 .glb 静态分流
  - HTTP→HTTPS 301

改 nginx/unit 后：

    sudo nginx -t && sudo systemctl reload nginx
    sudo systemctl daemon-reload && sudo systemctl restart wangshu-api

### 6.5 备份

服务器 cron 已安装：

    30 3 * * * /opt/wangshu/app/scripts/backup-db-local.sh >> /opt/wangshu/backups/backup.log 2>&1

脚本做：

- SQLite backup API
- integrity_check
- /api/health
- 14 天保留
- 失败写 /opt/wangshu/backups/LAST_FAILURE + syslog

手动执行：

    ssh <DEPLOY_HOST> /opt/wangshu/app/scripts/backup-db-local.sh

恢复前先停 API，拷回 DB，再启动；不要在 API 写入时直接覆盖。

---

## 7. 关键架构决策

1. **SQLite 而不是 MySQL/PostgreSQL**
   - 单机、演示规模、部署简单
   - WAL + busy_timeout + synchronous NORMAL + 每日备份
   - 迁移到 PostgreSQL 是未来选项，见 docs/DATABASE-DECISION.md
   - 不要因为“服务器资源多”就换库

2. **3D 共用 s7.glb**
   - 20 款车共用，仅选装示意
   - 2D 模式不加载 three.js；封面用 heroImage
   - 3D 资源在 Git 外，交接必须单独拿

3. **配置/价格服务端计算**
   - packages/shared/pricing.ts
   - 订单保存 config_json 快照
   - 前端只展示

4. **换色图是确定性 Lab 重映射**
   - 不是整图生成
   - 只对 mask 内像素改色
   - 已有 7 款车 25 张，非漆面 MAE/P99 记录在 generation-log-*.json
   - 2D 只读 model_paint_images.reviewed=1

5. **后台换色图审核**
   - /admin → 换色图
   - 取消审核立即回退封面

---

## 8. 已知边界与后续

### 已知边界

- 支付是模拟网关，不接真实商户
- 没有真实库存、金融、交付、退款
- 3D 全系共用 s7.glb，不是逐车模型
- 剩余 13 款车没有 2D 换色图
- SU7 的官方图仍有“新一代 SU7”标题字
- SQLite 单机，不适合多实例写
- 没有 CI、没有前端单元测试、没有覆盖率门槛
- 备份告警只写日志/LAST_FAILURE，没有外部通知

### 建议后续（按收益排序）

1. 补 13 款车的换色图（素材工作）
2. 给剩余车型补更干净的官方基准图
3. 后台支持上传换色图（当前只能审核已有路径）
4. 加 axe/可访问性自动化
5. 加 CI（typecheck + test + build + E2E）
6. 如需生产化：PostgreSQL + 对象存储 + 外部告警 + 真实支付/库存

### 不建议现在做

- 逐车 3D 高模
- 为 20 款车重做 3D
- 换 MySQL/PostgreSQL（除非明确多实例）
- 接真实支付（需要商户资质）

---

## 9. 常见故障

### 页面 404 /models 或配置器空白
- 检查 nginx 的 /models 路由分流（见 deploy/nginx-wangshu.conf）
- 本地 vite dev 不会暴露这个 nginx 问题，必须用线上 URL 验证

### 3D 黑屏 / 只显示海报
- 检查 apps/web/public/models/s7.glb 是否存在
- 检查 apps/web/public/basis/* 是否存在
- 检查浏览器控制台 KTX2 / GLB 请求
- 2D 模式正常不代表 3D 正常

### 登录成功又回到未登录
- 生产必须 HTTPS + COOKIE_SECURE=true
- 用 http://IP 登录是预期失败

### API 3100 被占用
- 本机 3000 是 vibeMusic，不要改 API 到 3000
- 查 ss -ltnp | grep 3100
- E2E 脚本会 fuser -k 3100/5173，确保没有别的服务

### SQLite busy
- 已设置 busy_timeout=5000
- 检查是否有长事务/多个进程写
- 看 /opt/wangshu/backups/LAST_FAILURE

### 部署后还是旧页面
- 检查 dist 是否上传
- 检查 /var/www/wangshu/assets 是否有旧文件
- 需要清残留时按 manifest 清理，不要 rsync --delete
- 图片换色有 PAINT_IMAGE_VERSION 缓存版本，改图时同步 bump

### E2E 失败
- 先确认 Chrome 路径：E2E_CHROME_PATH
- 确认 .secrets/admin-password
- 确认 3100/5173 没旧进程
- 日志：/tmp/wangshu-e2e/api.log、web.log
- 核心链路会新建临时订单，只写临时库

---

## 10. 交接验收清单

接手 agent 完成以下全部，才算交接完成：

- [ ] pnpm install 成功
- [ ] s7.glb / basis / .secrets 已放好
- [ ] 本地 db:seed 成功
- [ ] pnpm dev 后首页 200
- [ ] /api/health db:ok
- [ ] /models 显示 20 款车
- [ ] 配置器 3D 出车，2D 正常
- [ ] pnpm typecheck 全绿
- [ ] pnpm test 全绿（45 API + 5 shared）
- [ ] pnpm test:e2e 2/2
- [ ] pnpm --filter @wangshu/web build 成功
- [ ] 能解释 SQLite 取舍、3D 共用、模拟支付边界
- [ ] 没有把 .secrets / s7.glb / 真实服务器地址提交到 Git
- [ ] 改动前先看 docs/FINAL-CHECKLIST.md 和 docs/DATABASE-DECISION.md

---

## 11. 给接手 agent 的规则

1. 不要先重构；先跑通，再改。
2. 不要提交 .secrets、真实服务器地址、未脱敏订单数据。
3. 不要对生产 db:seed、不要 rsync --delete、不要强制推送。
4. 改动后至少跑 typecheck + 相关测试 + build。
5. 部署前先确认 DEPLOY_HOST 和 SSH key；部署后 curl 健康检查。
6. 论文/PPT 是交付物，不要覆盖；个人信息由项目所有者填。
7. 如果不确定，先读 docs/FINAL-CHECKLIST.md、docs/E2E-AND-OPS.md、docs/DATABASE-DECISION.md，不要猜。

---

## 12. 文档索引

- docs/FINAL-CHECKLIST.md：最终验收
- docs/E2E-AND-OPS.md：E2E 与备份
- docs/DATABASE-DECISION.md：为什么 SQLite
- docs/IMAGE-BATCH1.md：第一批换色图
- docs/BRAND-IMAGE-SOURCES-20261113.md：高清基准图来源
- docs/architecture.md：架构
- docs/design.md：设计
- docs/api-contract.md：API
- docs/DEPLOY-STATE.md：线上现状（部分历史内容已过时，以 HANDOFF/最新部署为准）
- docs/thesis/：论文/图/PPT/讲稿
- scripts/deploy-ip.sh：部署
- scripts/backup-db-local.sh / install-backup-cron.sh：备份
- scripts/e2e-local.sh + tests/e2e/core-flow.test.mjs：E2E

最后更新：2026-11-14
