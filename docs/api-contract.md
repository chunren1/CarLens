# API 契约 v0.1

Base URL: /api。金额单位：分（integer）。错误统一：

    { "code": "OPTION_CONFLICT", "message": "21 英寸轮毂需搭配性能版本" }

## 健康

GET /health -> 200

    { "status": "ok", "version": "0.1.0", "time": "2026-11-12T..." }

## 车型

GET /models -> ModelSummary[]

    [{ "id": 1, "slug": "r1", "name": "望舒 R1", "enName": "WANGSHU R1",
       "body": "双门 GT", "segment": "旗舰", "priceFrom": 88800000,
       "seats": 5, "tagline": "...", "heroImage": "/images/seal-hero.webp" }]

GET /models/:slug -> ModelSummary & { trims: Trim[] }

GET /models/:slug/options -> OptionCatalog

    { "model": ModelSummary, "trims": Trim[], "paints": Paint[],
      "wheels": Wheel[], "interiors": Interior[], "packages": PackageOption[],
      "rules": OptionRule[] }

## 报价

POST /quote  body:

    { "modelSlug": "s7", "trimId": 11, "paintId": 21, "wheelId": 31,
      "interiorId": 41, "packageIds": [1] }

200 -> QuoteResult

    { "model": ..., "trim": ..., "paint": ..., "wheel": ..., "interior": ...,
      "packages": [...], "lines": [{ "key": "trim", "label": "标准版", "amount": 26800000 }],
      "subtotal": 26800000, "taxFull": 2371681, "taxRelief": 1185841,
      "tax": 1185840, "insurance": 685000, "registration": 50000,
      "total": 28720840, "rangeKm": 705, "deposit": 500000, "warnings": [] }

400 -> { code, message }：OPTION_NOT_FOUND / TRIM_REQUIRED / OPTION_CONFLICT / MODEL_MISMATCH。

## 门店

GET /stores -> Store[]

## 订单

POST /orders body:

    { "modelSlug": "s7", "trimId": 11, "paintId": 21, "wheelId": 31,
      "interiorId": 41, "packageIds": [], "customerName": "张三",
      "phone": "13800138000", "storeId": 1 }

201 -> Order（status=pending_payment）。服务端重算价格并写配置快照。

GET /orders/:orderNo -> Order

POST /orders/:orderNo/pay -> Order（幂等；已支付直接返回当前状态）

## 订单状态

pending_payment -> paid -> confirmed -> delivered
pending_payment -> cancelled（用户可取消，幂等）；paid/confirmed -> cancelled（后台）

---

# v0.2 / v0.3 新增接口（2026-11-12）

## 认证

POST /auth/register body `{ email, password, name }` -> 201 `{ user }`，设置 httpOnly cookie。
POST /auth/login body `{ email, password }` -> 200 `{ user }`。
POST /auth/logout -> `{ ok: true }`。
GET /me -> `{ user }`；未登录 401。

## 试驾

POST /test-drives body `{ name, phone, modelSlug, storeId, slot }` -> 201
`{ id, leadId, storeId, slot, status, createdAt }`；写 leads + appointments。

## 订单补充

GET /orders（需登录）-> 当前用户订单数组。
POST /orders/:orderNo/cancel -> Order（当前用户/凭 orderNo；只允许 pending_payment）。

## 新闻

GET /news -> 已发布 NewsArticle[]
GET /news/:slug -> NewsArticle；草稿/不存在 404

## 后台（均需 role=admin）

- GET /admin/summary -> `{ models, orders, leads, appointments, revenuePaid, byStatus }`
- GET /admin/orders -> 全部订单
- PATCH /admin/orders/:orderNo/status body `{ status: confirmed|delivered|cancelled }`
- GET /admin/leads
- GET /admin/models；PATCH /admin/trims/:id body `{ price }`（分）
- GET /admin/stores；PATCH /admin/stores/:id body `{ address?, phone?, hours? }`
- GET /admin/news；POST /admin/news；PATCH /admin/news/:id；DELETE /admin/news/:id
