# 测试报告（2026-11-12）

## 命令

```bash
pnpm --filter @wangshu/api test   # API
pnpm --filter @wangshu/web typecheck
pnpm --filter @wangshu/web build
```

## 结果

- API：**11 个测试文件 / 41 tests 全绿**
- Web：`vue-tsc --noEmit` 通过；`vite build` 通过

| 文件 | 覆盖 |
|---|---|
| test/health.test.ts | 健康检查 |
| test/models.test.ts | 车型列表/详情/选项目录 |
| test/quote.test.ts | 价格公式、选装、规则冲突、版本门槛 |
| test/orders.test.ts | 下单快照、订单读取、幂等支付、用户订单、取消 |
| test/auth.test.ts | 注册/登录/退出/会话/密码哈希 |
| test/admin.test.ts | 权限、概览、订单状态机、线索、车型价/门店 |
| test/test-drives.test.ts | 试驾预约写入 leads + appointments |
| test/news.test.ts | 新闻列表/详情/草稿隔离/后台 CRUD |
| test/seed.test.ts | 种子幂等与数量 |
| test/payments-authz.test.ts | 支付订单归属（他人 404、本人 200、游客 bearer） |
| test/rate-limit.test.ts | 登录连续失败触发 429 |

## 线上冒烟（已实测）

- `GET /api/health` 200
- 首页、配置器（共用 S7 4.3MB 四门轿车 3D 模型）、新闻列表/详情 200
- 登录 demo / admin，访问账户与后台
- 创建订单 → 取消（cancelled）→ 再支付 409
- 后台确认订单、查看试驾线索、编辑车型价格/门店、新闻 CRUD

## 未覆盖

- 3D 渲染正确性只能靠截图目检，没有 WebGL 单元测试；3D 失败有海报回退。
- 真实支付、HTTPS/域名、邮件/短信均不在 Demo 范围。
- 并发/压力测试未做；SQLite 单机演示规模。