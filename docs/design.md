# 车鉴（CarLens）· 多品牌汽车配置聚合与在线报价平台 设计文档

> 版本 v0.1 · 2026-11-11
> 设计主导：lead（AI）｜实现：lead｜验收：项目所有者
> 状态：草案。M0 车身视觉定稿后升 v1.0，作为论文「系统设计」章节的底稿。
>
> **2026-11-12 改版**：白底官网、广告式车型轮播；**封面用高清海报，配置器全系共用 s7 四门轿车 3D 示意模型**（three.js 按需加载）；3D 只做选配视觉，不替代封面。

## 1. 一句话

一个虚构新能源品牌「比亚迪」的官方直营官网：用户从「不知道买什么」开始，三步问答得到推荐，进配置器把车漆、轮毂、选装点成自己想要的样子，实时看到裸车价与落地价；保存配置后可在线下订，走模拟支付网关支付定金，生成可跟踪的订单；后台管理车型、配置、订单、线索、门店与内容。

## 2. 为什么是这个形态

1. 参考对象全是品牌官网（小米、Lucid、Tesla、理想、BBA），老师也要求仿照 BYD/宝马/奥迪的官网结构，没有聚合平台。
2. 单品牌才能把配置器做深：聚合平台只能做列表和参数，配置器只能看不能配。
3. 本科毕设的评分点是系统完整性、技术深度、可演示性，单品牌三点都能覆盖：官网有完整度，配置器有深度，下订与订单可演示。

明确不做：

- 真实支付（只做模拟网关，不接商户、不收款）、真实车源、真实物流交付
- 多品牌聚合、二手车、金融风控
- SSR / SEO（演示场景不需要，纯 SPA）

## 3. 用户与旅程

三类角色：

- 购车者：不知道买什么、怕配置选错、怕价格不透明。
- 运营/销售：维护车型与选装、跟进线索、安排试驾。
- 评委：3 分钟内要看到「这系统能干什么」。

主旅程：

1. 首页：一句话主张 + 一台车 + 三个数字。
2. 不会选：向导三问，出 3 台推荐，每台一句理由。
3. 车型页 → 配置器：换漆、换轮毂、加选装，价格和参数实时变。
4. 保存配置 → 报价单：裸车、购置税、保险、落地价，打印、预约试驾。
5. 立即下订：选交付门店、确认配置快照与定金，创建订单。
6. 模拟支付：跳转支付网关页，支付定金，订单进入已支付。
7. 订单跟踪：状态时间线（待支付 → 已支付 → 已确认 → 已交付）。
8. 后台：车型、配置、订单、线索、预约、门店、内容管理。

## 4. 信息架构

公共路由：

- / 首页
- /models 车型矩阵
- /models/:slug 车型详情
- /configurator/:slug 配置器
- /compare 对比
- /wizard 选车向导
- /quote/:shareId 报价单（可分享）
- /order/new?config=... 下订
- /pay/:orderNo 模拟支付
- /orders/:orderNo 订单详情
- /finance 金融方案
- /stores 门店查询
- /service 车主服务
- /brand 品牌故事
- /news 新闻
- /account 我的配置、订单、预约
- /login /register

后台路由：

- /admin 看板
- /admin/models 车型与配置
- /admin/orders 订单
- /admin/leads 线索
- /admin/appointments 试驾预约
- /admin/stores 门店
- /admin/settings 价格与定金参数
- /admin/users 用户

## 5. 设计语言

平台：车鉴（CarLens）。主张：多品牌的车，放在一起讲清楚。

关键词：暗场、金属、留白、精确、安静。

色彩令牌：

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| --bg | #07090C | 页面底色 |
| --surface | #0D1117 | 卡片、面板 |
| --surface-2 | #131A23 | 抬起层、输入框 |
| --line | #222B36 | 1px 描边 |
| --text | #EDF2F8 | 主文本 |
| --muted | #93A0B0 | 次要文本 |
| --accent | #C8A96B | 主按钮、选中、价格 |
| --accent-2 | #7FA6D8 | 数据、链接 |
| --danger | #E06C75 | 错误、冲突 |
| --ok | #6FCF97 | 通过、可用 |

字体：

- 展示：Noto Serif SC / Songti SC（中文衬线，标题与铭牌）
- 正文：Noto Sans SC / PingFang SC
- 数字：JetBrains Mono / ui-monospace，tabular-nums
- 中文字体用系统字体，不加载 10MB 的 CJK webfont；英文衬线自托管小字体，控制首屏体积。

间距：4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 96。
圆角：4 / 8 / 14 / 22 / 999。
动效：120 / 180 / 240 / 420 / 680ms；主缓动 cubic-bezier(.16,1,.3,1)；全部尊重 prefers-reduced-motion。

车身呈现（2026-11-12 定稿）：

采用方案 C：运行时 3D（three.js + GLB）。

- **R1（旗舰 GT）**：Khronos Car Concept，CC BY 4.0，9.8MB / 21.3 万面 / KTX2 / 3 套车漆 / 独立轮子；隐藏 Khronos 车牌与方向盘标。
- **S7（四门轿跑）**：MMC Works Generic Sedan，CC BY 4.0，11.3 万面，4K 压 2K WebP 后 8.5MB；部件分离，可换漆。
- 署名：页脚「素材致谢」+ CREDITS.md。
- 降级：低端机用 1K / 关闭 Bloom 的演示模式；2.5D 仅作录屏兜底。

## 6. 配置器与购车流程

### 6.1 配置器

布局：

    ┌──────────────────────────────────────────────────────────────┐
    │ ‹ 车型     比亚迪 S7 · 配置器                     已选 ¥268,000 │
    ├────────────────────────────────────────┬─────────────────────┤
    │                                        │ 版本                 │
    │          ┌────────────────┐            │ ○标准 ○长续航 ●性能   │
    │          │                │            │ 车漆                 │
    │          │   车辆 + 倒影    │            │ ● ○ ○ ○ ○           │
    │          │   聚光 + 尘埃     │            │ 星夜黑 / 月岩灰 …     │
    │          └────────────────┘            │ 轮毂                 │
    │                                        │ ○19 ○20 ●21         │
    │       ← 鼠标移动，轻微视差 →              │ 续航 705 → 650 km    │
    │                                        │ 选装                 │
    │                                        │ ☑ 智驾包    +¥12,000 │
    │                                        │ ☐ 舒适包    +¥8,000  │
    │                                        │ ⚠ 21 轮毂需配性能版   │
    ├────────────────────────────────────────┴─────────────────────┤
    │ 裸车 ¥268,000  购置税 ¥11,858  保险 ¥6,850  ──  落地 ¥286,708 │
    │ [保存配置]  [生成报价单]  [立即下订]  [预约试驾]                │
    └──────────────────────────────────────────────────────────────┘

规则：

- 选项有 requires、excludes、minTrim 三类约束。
- 服务端权威：前端只传选项 ID，价格和合法性全部服务端计算。
- 违反规则时给可执行提示，例如「21 英寸轮毂需搭配性能版本」。

价格公式（放进 settings 表，可配置，论文可讨论政策变化）：

    裸车价     = 版本价 + 车漆价 + 轮毂价 + 内饰价 + 选装包价
    全额购置税 = 裸车价 ÷ 1.13 × 10%
    减免额     = min(全额购置税 × 50%, 15000)
    实缴购置税 = 全额购置税 - 减免额
    保险       = 裸车价 × 2.2% + 950（交强险），按 10 元取整
    上牌       = 500
    落地价     = 裸车价 + 实缴购置税 + 保险 + 上牌

默认按 2026–2027 新能源政策：减半征收，每辆减税额不超过 15000 元。以上参数全部进 settings 表，可改。

保存与分享：

- 配置序列化为短码，/quote/:shareId 公开可访问。
- 报价单先做打印样式（浏览器另存 PDF），后续再加服务端 PDF。

### 6.2 官方直营购车与订单

流程：

1. 配置器底部「立即下订」→ 选择交付门店、填写购车人信息、确认配置快照与定金金额。
2. 创建订单（status = pending_payment），生成不可猜测的 orderNo。
3. 跳转模拟支付网关 /pay/:orderNo：显示订单号、定金金额、二维码占位与「模拟支付」按钮。
4. 支付成功 → POST /api/orders/:orderNo/pay → 写 payments 记录，订单 status = paid。
5. 订单页 /orders/:orderNo 展示状态时间线：待支付 → 已支付 → 已确认 → 已交付；可取消。

支付说明：

- 演示环境只做模拟网关，不接支付宝/微信商户，不产生真实扣款；页面显著标注「模拟支付」。
- 订单金额由服务端按配置快照计算，前端只传 orderNo。
- 支付接口幂等：重复支付返回当前状态，不重复写 payments。
- 订单仅本人可查看与支付；管理员可在后台改状态。
- 定金默认 5000 元，放 settings 表，可按车型覆盖。

订单状态机：

    pending_payment --pay--> paid --confirm--> confirmed --deliver--> delivered
          |                    |
          +------cancel--------+--> cancelled

## 7. 推荐引擎

输入：预算区间、主要用途（通勤/家庭/长途/性能）、充电条件、座位数、偏好标签。

打分权重：预算 30%、用途 25%、能源 20%、空间 15%、偏好 10%。

输出：Top 3，每台 2 条理由。理由由得分最高的维度模板化生成，不依赖大模型，保证离线可演示。

## 8. 技术架构

   浏览器
     │ HTTPS（有域名后）或 HTTP（IP）
     ▼
   Cloudflare 边缘 ── 隧道 ──► localhost:80
                                 │
                           nginx（静态 + /api 反代）
                             │              │
                    /var/www/site      127.0.0.1:3000
                    （Vue SPA）          Fastify（Docker，256M）
                                            │
                                      SQLite 文件
                                      /opt/wangshu/data

选型：

- 前端：Vue 3 + TypeScript + Vite + Pinia + Vue Router。公网手写设计系统，后台用 Element Plus。
- 后端：Node 22 + Fastify + TypeScript + Drizzle ORM + SQLite。Zod 校验。会话用 httpOnly Cookie + sessions 表。
- 部署：静态文件 /var/www/site 由 nginx 发；API 跑 Docker（node:22-alpine，256M 限额）；nginx 把 /api 反代到 127.0.0.1:3000；SQLite 单文件，每日 backup；cloudflared 隧道已就绪。

为什么：

- 服务器 2 核 1740MB、不能构建：容器限内存，构建全在本地，镜像 save/load 上云。
- 宿主没装 Node/MySQL：用容器，不污染系统。
- SQLite 单文件：零运维、备份简单、演示规模足够；论文里作为「轻量部署」论证。
- 如果学校强制 Java/MySQL：后端可换，前端与数据模型不动，预计多两周。

## 9. 数据模型

| 表 | 关键字段 | 说明 |
| --- | --- | --- |
| users | id, email, name, password_hash, role, created_at | 用户与管理员 |
| sessions | id, user_id, expires_at | 会话 |
| models | id, slug, name, en_name, body, segment, price_from, seats | 车系 |
| trims | id, model_id, name, price, range_km, zero_100, power_kw | 版本 |
| paints | id, name, hex, price | 车漆 |
| wheels | id, name, size_inch, price, range_delta | 轮毂 |
| interiors | id, name, hex, price | 内饰 |
| packages | id, name, price, description | 选装包 |
| model_options | model_id, kind, option_id, price, available | 车型可选项 |
| option_rules | model_id, if_option, requires_option, excludes_option, min_trim | 约束 |
| configs | id, share_id, user_id, model_id, payload_json, price_snapshot | 保存的配置 |
| leads | id, config_id, name, phone, city, store_id, status | 线索 |
| appointments | id, lead_id, store_id, slot, status | 试驾预约 |
| stores | id, name, city, address, phone, hours | 门店 |
| orders | id, order_no, user_id, config_id, store_id, deposit_amount, status, created_at, paid_at | 订单 |
| payments | id, order_id, provider, amount, status, paid_at, raw_json | 支付记录（模拟） |
| settings | key, value | 税率、保险、定金等参数 |

## 10. API

公开：

- GET /api/models
- GET /api/models/:slug
- GET /api/models/:slug/options
- POST /api/quote
- GET /api/quote/:shareId
- GET /api/recommendations
- POST /api/leads
- POST /api/appointments
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/me
- GET /api/stores
- POST /api/orders
- GET /api/orders
- GET /api/orders/:orderNo
- POST /api/orders/:orderNo/pay

后台：

- CRUD /api/admin/models、trims、paints、wheels、interiors、packages、rules
- GET / PATCH /api/admin/leads
- GET / PATCH /api/admin/appointments
- GET / PATCH /api/admin/orders
- CRUD /api/admin/stores
- GET / PATCH /api/admin/settings
- GET /api/admin/stats
- GET /api/health

## 11. 非功能

性能：首屏 JS 小于 300KB gzip（不含 3D）；LCP 小于 2.0s；动画 60fps；图片 WebP。

安全：argon2id；httpOnly + SameSite=Lax；Origin 校验；登录与线索限流；Zod 校验；安全响应头（nginx 已有）；密钥只进 .env。

支付与订单：模拟网关，不接真实商户；页面与论文标注「模拟支付」；金额服务端计算；支付幂等；订单仅本人可读写，管理员可改状态；下单与支付限流。

可访问性：键盘可达、焦点可见、对比度 AA、prefers-reduced-motion。

测试：Vitest 单测（价格/规则/评分）、Fastify inject API 测试、Playwright E2E 主旅程、CI 四件套（lint / typecheck / test / build）。

## 12. 部署

路径：

- 静态：/var/www/site
- API：容器 wangshu-api，127.0.0.1:3000
- 数据：/opt/wangshu/data/wangshu.db
- 备份：/opt/wangshu/backups，每日 .backup，保留 14 天
- 入口：http://203.0.113.10/（IP，现成可用）；ziphare.me（隧道，实名后）
- 健康：GET /api/health 返回 version、commit、time

上线验收：静态 200、API health 200、报价接口正确、下单与模拟支付流程通、后台登录、公网可达、备份文件存在。

## 13. 里程碑

| 时间 | 里程碑 | 交付 | 验收 |
| --- | --- | --- | --- |
| 2026-11-12 → 11-20 | M0 视觉锁定 | 三版车身同屏对比 + 设计令牌 + 首页/配置器静态样张 | 选定一种 |
| 11-21 → 12-05 | M1 地基 | 仓库、数据库、种子数据、登录、CI | 后台能登录，数据能改 |
| 12-06 → 12-25 | M2 公网站 | 首页、车型、详情、对比、向导 | 真接口，选车流程通 |
| 12-26 → 2027-01-20 | M3 配置器 | 规则、价格、保存、报价单、试驾 | 换配置价格实时变 |
| 01-21 → 02-28 | M4 购车闭环与后台 | 订单、模拟支付、金融、门店、内容、CRUD | 能完整下订并支付 |
| 03-01 → 03-15 | M5 上线 | 部署、备份、验收 | 公网全链路 200 |
| 03-16 → 03-31 | 打磨与冻结 | 3D/统计/性能/安全/测试 | 3-31 功能冻结 |
| 04-01 → 04-30 | 论文初稿 | 论文 + 测试报告 | 导师过稿 |
| 05-01 → 05-31 | 答辩准备 | 演练、演示视频、备份方案 | 3 分钟讲顺 |
| 2027-06 | 答辩 | — | — |

## 14. 风险

| 风险 | 影响 | 处理 |
| --- | --- | --- |
| 车身视觉不够高级 | 最大 | M0 三方案对比，先定后做 |
| 支付被误解为真实交易 | 高 | 页面与论文标注「模拟支付」，不接商户、不收款 |
| 范围膨胀（卖车 + 后台） | 高 | 3-31 冻结；订单只做定金与状态机，不做真实支付/物流 |
| 服务器 1.7G 内存 | 中 | 容器限 256M，不在机上构建 |
| 域名实名卡住 | 中 | IP 与隧道双入口 |
| 学校强制 Java/MySQL | 高 | 12 月前确认，换后端约多两周 |
| 论文时间被挤 | 高 | 4 月整月留给论文，材料平时就存 |

## 15. 待定

- M0 已定：方案 C（运行时 3D）；R1 = Khronos Car Concept，S7 = MMC Works；均 CC BY 4.0，已接入配置器。
- 平台名：车鉴 CarLens（教师 2026-11 确认）。
- 题目（教师确认）：《“车鉴 CarLens”多品牌汽车配置聚合与在线报价平台的设计与实现》。
- 支付为模拟网关（老师已认可「只是跳转页面」），论文中注明。
- 2026-11-12 确认学校不强制 Java/MySQL，后端按 Node + SQLite 实施。
- 域名 ziphare.me 实名中，先用 IP 203.0.113.10；实名后切换。
- 用户要求以实现为目标，不硬卡日期；§13 日期仅作参考。