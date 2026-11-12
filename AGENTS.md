# 车鉴（CarLens）· 项目规范

## 1. 项目是什么

车鉴 CarLens 多品牌汽车配置聚合与在线报价平台（毕业设计，非官方）：在线配置 + 透明报价 + 下订 + 模拟支付 + 订单跟踪。当前演示车型数据以比亚迪公开素材为样本。
毕业论文题目：《“车鉴 CarLens”多品牌汽车配置聚合与在线报价平台的设计与实现》。

- 设计文档：docs/design.md
- 实施计划：docs/superpowers/plans/2026-11-11-wangshu-implementation.md
- Demo 范围：docs/status.md / docs/demo-v0.1.md（历史）
- 接口契约：docs/api-contract.md

## 2. 技术栈

- 前端：Vue 3 + TypeScript + Vite + Pinia + Vue Router；公网页面手写设计系统，不用组件库。
- 展示：封面用高清海报；配置器全系共用 `s7.glb` 四门轿车 3D 示意模型（three.js，按需加载）；3D 只做技术展示，车型封面仍以海报为准。
- 后端：Node 22+ / Fastify 5 / Drizzle ORM / SQLite（better-sqlite3）/ Zod。
- 共享：packages/shared 放类型与价格引擎（金额统一 integer 分）。
- 测试：Vitest；后续 Playwright。
- 部署：nginx 静态 + /api 反代；systemd 跑 Node 24 + tsx；SQLite 单文件；Cloudflare 隧道 + Let's Encrypt。
- **生产现状（域名 / 证书 / 关键配置 / 禁止事项）见 `docs/DEPLOY-STATE.md` —— 部署前必读。**

## 3. 目录

    apps/web        Vue SPA（公网 + 后续后台）
    apps/api        Fastify API
    packages/shared 共享类型 + 价格/规则引擎
    docs            设计、计划、论文、Demo 范围
    spike           视觉实验（gitignore，throwaway）

## 4. 命令

    pnpm install
    pnpm dev            # 并行启动 API + Web
    pnpm dev:api        # API only
    pnpm dev:web        # Web only
    pnpm typecheck
    pnpm test
    pnpm build

端口：API 3100，Web 5173；公网 80。
**不要用 3000**：本机 3000 被 vibeMusic musicapi 占用。

## 5. 硬性约定

- 金额一律 integer 分；价格与合法性由服务端计算，前端只传选项 ID。
- 页面必须处理 loading / empty / error 三态。
- TypeScript strict；禁止 any / @ts-ignore / 空 catch。
- 公网页面不使用 Element Plus 等组件库；后台可以。
- 支付只做模拟：页面显著标注「演示环境 · 模拟支付」，不接商户、不收款。
- 订单只返回给持有 orderNo 的人；金额服务端重算，不信任前端。
- 前端首屏 JS 预算 300KB gzip；车型图懒加载。
- 单条 commit 做一件事；未经用户明确要求不 push。
- **远程仓库操作（分支 / 提交规范 / 推送前清单 / 回滚）见 `docs/GIT-WORKFLOW.md`**；remote 为 `git@github.com:chunren1/CarLens.git`（SSH、私有）。

## 6. 当前 Demo 范围（v0.2）

包含：白底首页 + 广告式车型轮播、车型矩阵、车型详情、共用四门轿车 3D 配置器（车漆/轮毂/选装/实时报价；封面海报）、报价单、下订、模拟支付、订单、门店、试驾预约、金融计算器、服务/了解我们/新闻、选车向导、对比、注册/登录/账户、管理后台（订单/线索/概览/车型价格/门店/新闻）。
已上线：**https://ziphare.me/**（Cloudflare + Let's Encrypt，HTTP 301→HTTPS，HSTS 已开）；
IP 直连 http://203.0.113.10/ 仅作兜底，**不能登录**（Secure cookie）。部署见 docs/DEPLOY-STATE.md。
暂不做：车型/门店/内容 CRUD、真实支付。（HTTPS 已于 2026-11-12 上线；CSP 仍缺。）

## 7. 车型图片授权

- R1：Khronos Car Concept — Eric Chadwick / Darmstadt Graphics Group GmbH，CC BY 4.0；原始模型 Unity Fan，CC0。使用前隐藏 Khronos 车牌/方向盘标。
- S7：MMC Works · Generic Sedan Car，CC BY 4.0（Sketchfab）。
- 页脚「素材致谢」与 CREDITS.md 必须保留署名。

## 8. 设计令牌

以 docs/design.md 第 5 节为准：--bg #07090C / --surface #0D1117 / --accent #C8A96B / --accent-2 #7FA6D8；标题中文衬线，数字等宽。