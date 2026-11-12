# 车鉴（CarLens）

> 在线演示：**https://ziphare.me/**（Cloudflare + Let's Encrypt；IP `http://203.0.113.10/` 仅兜底）
> 生产现状见 [docs/DEPLOY-STATE.md](docs/DEPLOY-STATE.md)；答辩流程见 [docs/defense-demo.md](docs/defense-demo.md)。
> 架构见 [docs/architecture.md](docs/architecture.md)，测试见 [docs/test-report.md](docs/test-report.md)。
> 3D/安全变更附注：[REVIEW ADDENDUM](docs/REVIEW-20261112-v06-ADDENDUM.md)（完整审查报告含 PII，仅本地保留）。

多品牌汽车配置聚合与在线报价平台 + 在线配置器 + 透明报价 + 模拟支付订单（本科毕业设计）。

- 题目：《“车鉴 CarLens”多品牌汽车配置聚合与在线报价平台的设计与实现》
- 平台：车鉴（CarLens，多品牌汽车配置聚合与在线报价平台，毕业设计演示；当前车型数据以比亚迪公开车型/海报为样本），主张「多品牌的车，放在一起讲清楚」
- 前端：Vue 3 + TypeScript + Vite + Pinia + Vue Router
- 展示：白底官网 + 左文右图海报轮播 + 官方海报馆；**车型封面用高清海报，配置器全系共用 s7 四门轿车 3D 示意模型**（4.3MB GLB，按需加载；可切 2D 高清海报，2D 不加载 3D）
- 后端：Node 22+ / Fastify 5 / Drizzle ORM / SQLite / Zod
- 部署：Cloudflare 隧道 → nginx :80 → systemd Node 24 + tsx → SQLite；`https://ziphare.me/`，源站 80 兜底、443 关闭

## 当前状态

Demo v0.8：**10 品牌 / 12 款车型**（比亚迪、特斯拉、小鹏、极氪、小米、蔚来、理想、问界、零跑、埃安），白底官网、12 张车型轮播、**20 张跨品牌官方海报馆**、共用四门轿车 3D 配置器、实时报价、下订、模拟支付、订单、试驾/门店/金融/账户/新闻/后台。
暂不做：真实支付、订单退款、优惠券、CSP；HTTPS 已于 2026-11-12 上线。

## 快速开始

    pnpm install
    # 首次需要模型（不入库）
    ./scripts/setup-assets.sh
    ADMIN_PASSWORD='你的强口令' pnpm --filter @wangshu/api db:seed
    pnpm dev

- Web: http://127.0.0.1:5173
- API: http://127.0.0.1:3100
- 不要把 API 改到 3000：本机 3000 被 vibeMusic 占用。

## 目录

    apps/web         Vue SPA
    apps/api         Fastify API
    packages/shared  共享类型 + 价格/规则引擎
    docs             设计、计划、论文、Demo 范围
    scripts          模型准备等脚本

## 文档

- [系统设计](docs/design.md)
- [Demo v0.1 范围](docs/demo-v0.1.md)
- [API 契约](docs/api-contract.md)
- [实施计划](docs/superpowers/plans/2026-11-11-wangshu-implementation.md)
- [素材致谢](CREDITS.md)

## 说明

支付为模拟网关：不接商户、不收款，页面显著标注「演示环境 · 模拟支付」。
金额统一 integer 分，价格与合法性由服务端计算。