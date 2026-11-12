# 车鉴（CarLens）· 多品牌汽车配置聚合与在线报价平台 · 系统架构

> 2026-11-12 · Demo v0.5 · 线上 https://ziphare.me/（IP 仅兜底）

## 1. 全局结构

```
浏览器（Vue 3 SPA）
  │  HTTPS  https://ziphare.me/（Cloudflare 边缘 + 隧道）
  ▼
cloudflared → nginx :80
  ├── /assets /models /images /basis → /var/www/wangshu（静态）
  ├── /api/ → 127.0.0.1:3100（Fastify）
  └── 其它 → /index.html（SPA fallback）

Fastify API（systemd: wangshu-api）
  ├── routes（health/models/quote/stores/orders/payments/auth/test-drives/news/admin）
  ├── repositories（catalog/orders/settings/stores）
  ├── db（Drizzle + better-sqlite3 + migrations）
  └── /opt/wangshu/data/wangshu.db（WAL）

packages/shared
  ├── types.ts    共享 DTO（Model/Order/Quote/...）
  └── pricing.ts  价格与规则引擎（纯函数）
```

## 2. 前端分层

- `pages/`：路由页面，负责取数、状态、组合。
- `components/`：展示组件（HeroCarousel、ModelCard、ConfigSummary、PriceBar 等）。
- `stores/configurator.ts`：配置器状态（catalog、选中 ID、quote、loading/error）。
- `stores/auth.ts`：当前用户与登录状态。
- `lib/api.ts`：统一 `request<T>`、错误映射、所有接口方法。
- `lib/assets.ts`：资源路径接到 `import.meta.env.BASE_URL`，支持子路径部署。

车型封面/首页轮播/海报馆使用高清海报（当前资源覆盖 10 个品牌、20 张）；配置器统一懒加载 `s7.glb` 四门轿车 3D 示意模型（three.js，~295 KB gzip JS + 4.3 MB GLB），所有车型/版本共用；右上角可切 2D 高清海报，2D 模式不渲染/不请求 3D；3D 只负责选配视觉，不替代封面。新增车型补一张 4 门海报与 seed 数据。

## 3. 核心数据流：配置 → 报价

1. 用户进入 `/configurator/:slug`，前端 `GET /models/:slug/options` 取选项目录。
2. 选中项只存 option ID；每次变化调用 `POST /quote`。
3. 服务端 `calculateQuote(input, catalog, settings)`：
   - 校验选项存在、车型匹配、必选、冲突、版本门槛；
   - 计算选装小计；
   - 购置税：`min(subtotal / 1.13 × 10% × 50%, 15,000 元)`（新能源减免）；
   - 保险：`round10(subtotal × 2.2% + 950 元)`；
   - 上牌 500 元；总价 = 小计 + 税 + 保险 + 上牌；定金 5,000 元。
4. 前端只展示服务端结果，不参与定价。

**金额统一 integer 分**，避免浮点误差。

## 4. 订单状态机

```
pending_payment ──pay──► paid ──confirm──► confirmed ──deliver──► delivered
       │                   │                   │
       └──cancel───────────┴──cancel───────────┘
                （用户仅能取消 pending_payment；
                 已支付需联系门店；后台可取消 paid）
```

- 订单号：`WS + Asia/Shanghai 日期 + 8 位随机 hex`。
- 下单时写完整报价快照 `configJson`，后续改价不影响历史订单。
- 模拟支付幂等：只有 `pending_payment` 会改状态并写一条 `payments`。
- 用户订单通过 `userId` 关联；未登录订单只能凭 `orderNo` 访问。

## 5. 主数据

| 表 | 作用 |
|---|---|
| models / trims | 车型与版本 |
| paints / wheels / interiors / packages | 选装主数据 |
| model_options | 车型可用选项 + 价格 |
| option_rules | 冲突/依赖/版本门槛 |
| stores | 直营门店 |
| orders / payments | 订单与模拟支付 |
| users / sessions | 账户与 httpOnly 会话 |
| leads / appointments | 试驾线索与预约 |
| news | 新闻内容（后台 CRUD） |
| settings | 税率/保险/上牌/定金参数 |

种子数据：2 车型 / 6 版本 / 5 车漆 / 3 轮毂 / 2 内饰 / 3 选装包 / 4 门店 / 4 新闻。

## 6. 鉴权

- 注册：scrypt + 随机盐；不存明文。
- 会话：32 字节随机 token，DB 存 SHA-256；cookie `ws_sid`（httpOnly / SameSite=Lax）。
- 生产 HTTP 演示用 `COOKIE_SECURE=false`；上 HTTPS 后改 true。
- 管理员通过 `users.role = "admin"` 控制；后台接口统一 `requireAdmin`。

## 7. 部署与运维

- Node 24 + tsx 通过 systemd 运行 API，`Restart=always`。
- nginx 静态 + `/api` 反代；只有 80 端口对公网开放。
- 每日 04:20 SQLite 在线备份到 `/opt/wangshu/backups`，保留 14 天。
- 部署脚本 `scripts/deploy-ip.sh`；详见 [deploy-ip.md](deploy-ip.md)。

## 8. 边界与已知取舍

- 支付是**模拟**，不接商户、不产生真实扣款。
- SQLite 单机适合演示规模；高并发需换 PostgreSQL + 队列。
- 车型图为静态资源；生产可上 CDN/对象存储。
- 域名未实名，当前 IP + HTTP；上 HTTPS 后改 cookie 与 nginx。