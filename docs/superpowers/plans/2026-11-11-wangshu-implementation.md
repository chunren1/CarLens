# 望舒 WANGSHU 实施计划

> 给执行者：先读 docs/design.md（系统设计）与 docs/thesis/选题说明-汽车.md（题目口径）。
> 按任务顺序执行；每个任务以可验证结果收尾（测试通过 / 构建通过 / 截图确认）。

**Goal:** 交付一个可部署、可演示的单品牌汽车在线配置与报价系统：在线配置 → 透明报价 → 下订 → 模拟支付 → 订单跟踪，外加后台管理。

**Architecture:** pnpm monorepo。apps/web 是 Vue 3 + TypeScript 的 SPA（公网 + 后台）；apps/api 是 Fastify + Drizzle + SQLite 的 API；packages/shared 放共享类型。生产环境：nginx 发静态文件，/api 反代到 Docker 里的 API，数据是单个 SQLite 文件。

**Tech Stack:** Node 22（生产）/ Node 24（开发）、pnpm、TypeScript strict、Vue 3、Vite、Pinia、Vue Router、Element Plus（仅后台）、Fastify 5、Drizzle ORM、better-sqlite3、Zod、Vitest、Playwright、Docker、nginx、Cloudflare 隧道。

**Spec:** docs/design.md

## Global Constraints

- 所有价格与合法性由服务端计算；前端只传选项 ID，不传价格。
- 数据库只用 SQLite 单文件；不引入 MySQL / Redis。
- 服务器上不构建；本地构建后 rsync 静态文件、docker save/load 镜像。
- 中文界面，人民币，时间统一 Asia/Shanghai。
- TypeScript strict；禁止 any 与 @ts-ignore 掩盖问题。
- 公网站点不用 UI 组件库，手写设计系统；后台可以用 Element Plus。
- 密码用 Node 内置 scrypt；会话用 httpOnly Cookie + sessions 表；写操作校验 Origin。
- 每个任务一个 commit；提交前 typecheck 与相关测试必须通过。
- 单测覆盖价格引擎、规则、推荐、认证、订单状态机；E2E 覆盖主旅程。
- 支付只做模拟网关：不接商户、不收款，页面与论文都标注「模拟支付」；金额服务端计算，支付幂等。

## Review Focus

- 价格引擎边界：购置税上限、重复选装、缺失选项、非法组合、价格为 0 的边界。
- 会话安全：Cookie 属性、过期、注销、Origin 校验、限流。
- 分享链接：不可猜测、只读、失效与不存在时的提示。
- 空态 / 错误态 / 加载态：每个数据页面都要有，不能只做成功路径。
- 低端机性能：首屏 JS 预算、3D 懒加载、prefers-reduced-motion 降级。
- 订单与支付：状态机非法流转、重复支付、他人订单越权、金额被前端篡改。
- 模拟支付标注：任何支付页面都必须有「演示环境 · 模拟支付」字样。

## File Structure

    wangshu/
      package.json                 根脚本与 workspace
      pnpm-workspace.yaml
      tsconfig.base.json
      .github/workflows/ci.yml
      apps/
        web/
          index.html
          vite.config.ts
          src/main.ts
          src/App.vue
          src/router.ts
          src/styles/tokens.css
          src/styles/base.css
          src/lib/api.ts
          src/stores/auth.ts
          src/stores/compare.ts
          src/stores/configurator.ts
          src/components/...
          src/pages/...
          src/pages/OrderCreatePage.vue
          src/pages/PayPage.vue
          src/pages/OrderPage.vue
          src/pages/FinancePage.vue
          src/pages/StoresPage.vue
          src/pages/ServicePage.vue
          src/pages/BrandPage.vue
          src/pages/NewsPage.vue
          src/admin/...
        api/
          Dockerfile
          drizzle.config.ts
          src/server.ts
          src/app.ts
          src/env.ts
          src/db/schema.ts
          src/db/client.ts
          src/db/seed.ts
          src/auth/password.ts
          src/auth/session.ts
          src/domain/quote.ts
          src/domain/rules.ts
          src/domain/recommend.ts
          src/routes/orders.ts
          src/routes/payments.ts
          src/routes/...
          src/repositories/...
          test/...
      packages/shared/
        src/types.ts
        src/index.ts
      scripts/
        backup.sh
        deploy.sh
      docs/
        design.md
        thesis/...
        superpowers/plans/...

## Milestones

- M0 视觉定稿：2026-11-12 至 11-20（spike，选定车身呈现方案）
- M1 地基：11-21 至 12-05（仓库、数据库、认证、车型接口、站点骨架）
- M2 公网站：12-06 至 12-25（首页、车型、详情、对比、向导）
- M3 配置器：12-26 至 2027-01-20（规则、价格、保存、报价、试驾）
- M4 购车闭环与后台：01-21 至 02-28（订单、模拟支付、金融、门店、内容、CRUD）
- M5 上线：03-01 至 03-15（容器、nginx、备份、验收）
- M6 打磨与冻结：03-16 至 03-31（性能、安全、测试）
- M7 论文：04-01 至 05-31（初稿、测试报告、演练）

---

## Task 0: M0 车身视觉样张（spike，可丢弃）

**Files:**
- Create: spike/configurator-a.html（2.5D 分层）
- Create: spike/configurator-b.html（离线渲染静帧）
- Create: spike/configurator-c.html（运行时 3D）
- Create: spike/README.md（结论）

**Interfaces:** 三个页面共用同一套右侧选项与底部价格条，只换左侧车身呈现。

- [ ] 步骤 1：搭 1440×900 的配置器布局，右侧放版本/车漆/轮毂/选装，底部放价格条。
- [ ] 步骤 2：方案 A 用 SVG 分层画一辆轿车，车漆用线性渐变 + 高光层，地面做倒影。
- [ ] 步骤 3：方案 B 用一张 3D 模型离线渲染的静帧，CSS 叠加光晕与倒影，切换时换图。
- [ ] 步骤 4：方案 C 用 three.js 加载 GLB，暗场环境光 + 地面反射，切换车漆改材质颜色。
- [ ] 步骤 5：用本机 Chrome headless 各截一张 1440×900 的图，放在 spike/screens/。
- [ ] 步骤 6：把选定方案与理由写进 docs/design.md 第 5 节；spike/ 标记为 throwaway。

验收：三张截图能看出明显差异；用户选定一个方案。

**2026-11-12 进展**：3D 方案已跑通（three.js + Draco + 镜面地板），示例模型质感不足；待 2.5D 对比后定稿。

---

## Task 1: Monorepo 骨架与 CI

**Files:**
- Create: package.json、pnpm-workspace.yaml、tsconfig.base.json、.editorconfig
- Create: apps/web/package.json、apps/api/package.json、packages/shared/package.json
- Create: packages/shared/src/types.ts、src/index.ts
- Create: .github/workflows/ci.yml

**Interfaces:** 根脚本 dev / build / test / typecheck；包名 @wangshu/web、@wangshu/api、@wangshu/shared。

- [ ] 步骤 1：写 pnpm-workspace.yaml，声明 apps/* 与 packages/*。
- [ ] 步骤 2：根 package.json 加脚本：typecheck 用 tsc -b，测试用 pnpm -r test。
- [ ] 步骤 3：三个子包各写 tsconfig.json，extends 根配置，strict 打开；shared 先定义 ModelSummary、QuoteInput、QuoteResult、Recommendation 四个类型。
- [ ] 步骤 4：运行 pnpm install，再运行 pnpm -r typecheck。
- [ ] 步骤 5：期望退出码 0，无 TS 报错。
- [ ] 步骤 6：提交 chore: scaffold pnpm workspace。

## Task 2: API 骨架与健康检查

**Files:**
- Create: apps/api/src/app.ts、src/server.ts、src/env.ts、test/health.test.ts
- Modify: apps/api/package.json（依赖 fastify、zod、vitest）

**Interfaces:**
- createApp(options: { db: Database }): FastifyInstance
- GET /api/health -> { status: "ok", version: string, time: string }

- [ ] 步骤 1：先写 test/health.test.ts，用 createApp 注入请求，断言 200 与 status=ok。
- [ ] 步骤 2：运行 pnpm --filter @wangshu/api test，期望失败（createApp 不存在）。
- [ ] 步骤 3：实现 env.ts：用 Zod 校验 PORT、DATABASE_URL、SESSION_SECRET、NODE_ENV；缺 key 直接退出并打印缺哪个。
- [ ] 步骤 4：实现 app.ts 注册 GET /api/health 与全局错误处理；server.ts 监听 0.0.0.0。
- [ ] 步骤 5：再跑测试，期望 PASS。
- [ ] 步骤 6：提交 feat: api skeleton with health endpoint。

## Task 3: 数据库 schema、迁移与种子数据

**Files:**
- Create: apps/api/src/db/schema.ts、src/db/client.ts、src/db/seed.ts、drizzle.config.ts
- Create: apps/api/migrations/（drizzle-kit 生成）
- Create: apps/api/test/seed.test.ts

**Interfaces:**
- createDb(path: string): BetterSQLite3Database
- seed(db): Promise<void>，可重复执行（先清空再插入或 upsert）

**Tables（17 张）：** users、sessions、models、trims、paints、wheels、interiors、packages、model_options、option_rules、configs、leads、appointments、stores、orders、payments、settings。

- [ ] 步骤 1：写 schema.ts，字段与 docs/design.md 第 9 节一致；金额用 integer（分），避免浮点。
- [ ] 步骤 2：写 test/seed.test.ts：临时库跑 seed，断言 4 个车型、12 个版本、5 种车漆、4 家门店、1 个管理员。
- [ ] 步骤 3：运行测试，期望失败。
- [ ] 步骤 4：实现 client.ts 与 seed.ts；种子数据：望舒 S7 / X5 / C3 / M9，每款 3 个版本。
- [ ] 步骤 5：运行 pnpm --filter @wangshu/api test，期望 PASS。
- [ ] 步骤 6：生成迁移，提交 feat: database schema and seed。

## Task 4: 认证与会话

**Files:**
- Create: apps/api/src/auth/password.ts、src/auth/session.ts、src/routes/auth.ts
- Create: apps/api/test/auth.test.ts

**Interfaces:**
- hashPassword(plain: string): Promise<string>（scrypt + 随机盐）
- verifyPassword(plain: string, stored: string): Promise<boolean>
- createSession(db, userId): { token: string, expiresAt: string }
- getSession(db, token): Session | null
- POST /api/auth/register、POST /api/auth/login、POST /api/auth/logout、GET /api/me

- [ ] 步骤 1：写测试：注册 201；重复邮箱 409；错误密码 401；登录后 Set-Cookie 含 ws_sid 且 HttpOnly；GET /api/me 200；注销后 401。
- [ ] 步骤 2：运行测试，期望失败。
- [ ] 步骤 3：实现 password.ts（scrypt，timingSafeEqual）与 session.ts（token 32 字节随机，DB 存 sha256）。
- [ ] 步骤 4：实现路由；Cookie 设 httpOnly、sameSite=lax、path=/、secure 依 NODE_ENV。
- [ ] 步骤 5：测试通过；提交 feat: session auth。

## Task 5: 车型目录 API

**Files:**
- Create: apps/api/src/routes/models.ts、src/repositories/models.ts
- Create: apps/api/test/models.test.ts

**Interfaces:**
- GET /api/models -> ModelSummary[]
- GET /api/models/:slug -> ModelDetail（含 trims、specs）
- GET /api/models/:slug/options -> OptionCatalog（paints、wheels、interiors、packages、rules）

- [ ] 步骤 1：写测试：列表 4 条；详情含 3 个版本；options 含 5 种车漆与规则；未知 slug 404。
- [ ] 步骤 2：实现 repository 查询与路由；Zod 校验 params。
- [ ] 步骤 3：测试通过；提交 feat: catalog api。

## Task 6: Web 骨架、设计令牌与首页

**Files:**
- Create: apps/web/index.html、vite.config.ts、src/main.ts、src/App.vue、src/router.ts
- Create: src/styles/tokens.css、src/styles/base.css、src/layouts/SiteLayout.vue
- Create: src/pages/HomePage.vue、src/lib/api.ts
- Create: apps/web/test/home.test.ts

**Interfaces:** api.get(path) 统一 fetch 封装，credentials: include，错误抛 ApiError。

- [ ] 步骤 1：写 tokens.css：颜色、字体、间距、圆角、动效变量（值见 docs/design.md 第 5 节）。
- [ ] 步骤 2：搭 SiteLayout：顶栏（品牌、导航、对比计数）+ 页脚（四列）。
- [ ] 步骤 3：首页：Hero 一句话 + 车辆位 + 三个数字；车型矩阵占位卡片。
- [ ] 步骤 4：pnpm --filter @wangshu/web build，期望成功；截图确认无溢出。
- [ ] 步骤 5：提交 feat: web scaffold and home。

---

## Task 7: 车型列表页

**Files:**
- Create: apps/web/src/pages/ModelsPage.vue、src/components/ModelCard.vue
- Create: apps/web/test/models-page.test.ts

**Interfaces:** 读 GET /api/models；按 body（轿车/SUV/轿跑/MPV）筛选。

- [ ] 步骤 1：写组件测试：给定 4 条数据渲染 4 张卡；点击 SUV 只剩 SUV。
- [ ] 步骤 2：实现页面与卡片；加载态用骨架屏，空态给文案与重置按钮。
- [ ] 步骤 3：测试通过；构建通过；提交 feat: models list。

## Task 8: 车型详情页

**Files:**
- Create: apps/web/src/pages/ModelPage.vue、src/components/SpecTable.vue
- Create: apps/web/test/model-page.test.ts

**Interfaces:** 读 GET /api/models/:slug；主 CTA 跳到 /configurator/:slug。

- [ ] 步骤 1：写测试：渲染名称、价格区间、3 个版本、6 项参数。
- [ ] 步骤 2：实现页面；参数表用三线表样式；未知 slug 显示 404 空态。
- [ ] 步骤 3：测试通过；提交 feat: model detail。

## Task 9: 对比

**Files:**
- Create: apps/web/src/stores/compare.ts、src/pages/ComparePage.vue
- Create: apps/web/test/compare.test.ts

**Interfaces:** compare store：add/remove/clear，最多 3 台，持久化到 localStorage。

- [ ] 步骤 1：写 store 测试：加 4 台只保留 3 台；重复添加不重复；刷新后恢复。
- [ ] 步骤 2：实现 store 与对比页；差异项高亮，移动端横向滚动。
- [ ] 步骤 3：测试通过；提交 feat: compare。

## Task 10: 选车向导与推荐

**Files:**
- Create: apps/api/src/domain/recommend.ts、src/routes/recommend.ts、test/recommend.test.ts
- Create: apps/web/src/pages/WizardPage.vue、src/stores/wizard.ts、src/components/RecommendCard.vue

**Interfaces:**
- recommend(input: WizardInput, models: ModelWithTrims): Recommendation[]
- GET /api/recommendations?budgetMin=&budgetMax=&usage=&charging=&seats=&tags=
- Recommendation = { modelSlug, name, score, reasons: string[] }

- [ ] 步骤 1：写后端测试：预算 20-30 万、通勤、有家充，返回 3 条且第一条是 S7；理由含"续航"或"预算"。
- [ ] 步骤 2：实现评分：预算 30%、用途 25%、能源 20%、空间 15%、偏好 10%；理由取最高维度。
- [ ] 步骤 3：实现路由；前端三步向导 + 结果页；空态与"放宽预算"提示。
- [ ] 步骤 4：测试通过；提交 feat: recommendation wizard。

## Task 11: 导航、页脚、响应式与页面元信息

**Files:**
- Create: apps/web/src/components/SiteHeader.vue、SiteFooter.vue
- Modify: src/router.ts（路由懒加载）、index.html（标题/描述）

- [ ] 步骤 1：实现顶栏与移动端底栏；对比计数用 aria-live。
- [ ] 步骤 2：断点 375 / 768 / 1280 / 1536 按设计文档检查；截图确认。
- [ ] 步骤 3：提交 feat: navigation and responsive shell。

---

## Task 12: 价格引擎（纯函数）

**Files:**
- Create: apps/api/src/domain/quote.ts、test/quote.test.ts
- Create: apps/api/src/domain/rules.ts、test/rules.test.ts

**Interfaces:**
- computeQuote(input: QuoteInput, catalog: Catalog, settings: Settings): QuoteResult
- validateRules(input: QuoteInput, rules: Rule[]): Violation[]
- 金额全部用 integer 分；返回 lines / subtotal / tax / insurance / registration / total / specs / violations

- [ ] 步骤 1：写测试：基础价 268000；加智驾包 12000；全额购置税 23717，减免 11858，实缴 11858；保险 6850（按 10 元取整）；落地 286708。
- [ ] 步骤 2：写测试：21 寸轮毂 + 标准版 -> violation；重复 package 去重；未知选项 -> 422。
- [ ] 步骤 3：实现 computeQuote 与 validateRules；纯函数，无 DB 依赖。
- [ ] 步骤 4：测试通过；提交 feat: quote and rule engine。

## Task 13: 报价 API

**Files:**
- Create: apps/api/src/routes/quote.ts、test/quote-api.test.ts

**Interfaces:**
- POST /api/quote -> { valid, violations, lines, subtotal, tax, insurance, registration, total, specs }
- 选项不属于该车型时返回 422；非法组合返回 200 + valid=false + violations。

- [ ] 步骤 1：写测试：正常报价 200；跨车型选项 422；21 寸 + 标准版 valid=false。
- [ ] 步骤 2：实现路由，读 catalog + rules + settings，调用 computeQuote。
- [ ] 步骤 3：测试通过；提交 feat: quote api。

## Task 14: 配置器界面

**Files:**
- Create: apps/web/src/pages/ConfiguratorPage.vue
- Create: src/components/configurator/CarStage.vue、OptionPanel.vue、PriceBar.vue
- Create: src/stores/configurator.ts、test/configurator.test.ts

**Interfaces:** store 保存当前 trim/paint/wheel/interior/packages；每次变化调用 POST /api/quote，300ms 防抖。

- [ ] 步骤 1：写 store 测试：默认选中第一个版本与车漆；切换选项触发一次报价；请求失败保留旧价格并提示。
- [ ] 步骤 2：实现三栏布局：左车、右选项、底价格条；移动端上下堆叠。
- [ ] 步骤 3：接入 M0 选定的车身组件；切换车漆只改变量/材质，不重建场景。
- [ ] 步骤 4：构建通过；截图 1440 与 390 两个宽度；提交 feat: configurator ui。

## Task 15: 保存配置与分享链接

**Files:**
- Create: apps/api/src/routes/configs.ts、test/configs.test.ts
- Create: apps/web/src/pages/QuotePage.vue

**Interfaces:**
- POST /api/configs -> { shareId }（8 字节随机 base64url）
- GET /api/quote/:shareId -> 公开只读报价
- configs 表存 payload_json 与 price_snapshot，shareId 唯一索引

- [ ] 步骤 1：写测试：保存后能用 shareId 读回；shareId 不可猜测（长度 >= 10）；不存在 404。
- [ ] 步骤 2：实现路由与 QuotePage 展示；打印样式 @media print 隐藏导航与按钮。
- [ ] 步骤 3：测试通过；提交 feat: save and share configuration。

## Task 16: 线索与试驾预约

**Files:**
- Create: apps/api/src/routes/leads.ts、appointments.ts、test/leads.test.ts
- Create: apps/web/src/components/LeadForm.vue、AppointmentForm.vue

**Interfaces:**
- POST /api/leads { name, phone, configShareId, storeId? } -> { id, status: "new" }
- POST /api/appointments { leadId, storeId, slot } -> { id, status: "pending" }
- 手机号 Zod 校验；同一 IP 每分钟最多 5 次（限流）

- [ ] 步骤 1：写测试：合法提交 201；手机号非法 400；重复提交限流 429。
- [ ] 步骤 2：实现路由与表单；提交成功后显示门店与时间，不发真实短信。
- [ ] 步骤 3：测试通过；提交 feat: leads and test drive。

## Task 16A: 订单与模拟支付

**Files:**
- Create: apps/api/src/routes/orders.ts、src/routes/payments.ts、test/orders.test.ts
- Create: apps/web/src/pages/OrderCreatePage.vue、PayPage.vue、OrderPage.vue
- Modify: apps/api/src/db/schema.ts（orders、payments）、packages/shared/src/types.ts

**Interfaces:**
- POST /api/orders { configShareId, storeId, buyerName, buyerPhone } -> { orderNo, status: "pending_payment", depositAmount }
- GET /api/orders/:orderNo -> OrderDetail（仅本人或管理员）
- POST /api/orders/:orderNo/pay -> { status: "paid", paidAt }（幂等）
- 状态机：pending_payment -> paid -> confirmed -> delivered / cancelled

- [ ] 步骤 1：写测试：未登录 401；创建订单 pending_payment；支付后 paid；重复支付仍 paid 且 payments 只有 1 条；访问他人订单 403；金额由服务端按配置快照计算。
- [ ] 步骤 2：实现 schema、orderNo（10 字节随机 base64url）、状态流转与幂等支付。
- [ ] 步骤 3：实现前端：下订表单、模拟支付页（显著标注「演示环境 · 模拟支付」）、订单详情时间线。
- [ ] 步骤 4：测试通过；提交 feat: orders and mock payment。

## Task 16B: 金融方案计算器

**Files:**
- Create: packages/shared/src/finance.ts、packages/shared/test/finance.test.ts
- Create: apps/web/src/pages/FinancePage.vue、src/components/FinanceCalculator.vue

**Interfaces:**
- computeFinance(input: { price: number; downRatio: number; months: number; annualRate: number }): { downPayment, loanAmount, monthly, totalInterest, totalPayment }

- [ ] 步骤 1：写测试：价 268000、首付 30%、36 期、年化 3.5% -> 月供约 5497 元（±1）；年化 0 -> 月供 = 贷款额 / 期数；首付 100% -> 月供 0。
- [ ] 步骤 2：实现 PMT 公式；前端首付/期数滑杆，实时显示月供与总利息。
- [ ] 步骤 3：测试通过；提交 feat: finance calculator。

## Task 16C: 门店查询与品牌内容页

**Files:**
- Create: apps/api/src/routes/stores.ts、test/stores.test.ts
- Create: apps/web/src/pages/StoresPage.vue、ServicePage.vue、BrandPage.vue、NewsPage.vue

**Interfaces:**
- GET /api/stores?city= 返回门店列表；静态内容页用本地 TS 常量，不接 CMS。

- [ ] 步骤 1：写测试：门店列表 4 条；city=广州 返回 2 条。
- [ ] 步骤 2：实现接口与页面；门店卡片含地址/电话/营业时间与「预约到店」。
- [ ] 步骤 3：车主服务、品牌故事、新闻三页按设计语言静态实现，补全导航与页脚。
- [ ] 步骤 4：提交 feat: stores and brand pages。

## Task 17: 配置器页的保存/报价/下订串联

**Files:**
- Modify: apps/web/src/pages/ConfiguratorPage.vue、QuotePage.vue

- [ ] 步骤 1：底部按钮：保存配置 -> 生成 shareId -> 跳 /quote/:shareId；「立即下订」-> 登录校验后跳 /order/new。
- [ ] 步骤 2：报价页：打印、复制链接、预约试驾、立即下订；未登录也可保存（匿名 shareId），下订需登录。
- [ ] 步骤 3：E2E 脚本走通：首页 -> 车型 -> 配置 -> 保存 -> 报价 -> 下订 -> 模拟支付 -> 订单。
- [ ] 步骤 4：提交 feat: end-to-end config and order flow。

---

## Task 18: 后台骨架与登录

**Files:**
- Create: apps/web/src/admin/AdminLayout.vue、router.ts、pages/LoginPage.vue、DashboardPage.vue
- Create: apps/api/src/routes/admin/guard.ts、test/admin-auth.test.ts

**Interfaces:** 后台路由 /admin/*；非 admin 角色 403；未登录跳 /admin/login。

- [ ] 步骤 1：写测试：普通用户访问 admin 接口 403；管理员 200。
- [ ] 步骤 2：实现 guard 与后台布局；Element Plus 按需引入。
- [ ] 步骤 3：提交 feat: admin shell and guard。

## Task 19: 车型/版本 CRUD

**Files:**
- Create: apps/api/src/routes/admin/models.ts、test/admin-models.test.ts
- Create: apps/web/src/admin/pages/ModelsAdmin.vue

**Interfaces:** GET/POST/PATCH/DELETE /api/admin/models、/trims；slug 唯一。

- [ ] 步骤 1：写测试：创建 -> 列表可见 -> 修改价格 -> 删除；slug 冲突 409。
- [ ] 步骤 2：实现接口与表格表单；删除前二次确认。
- [ ] 步骤 3：提交 feat: admin models crud。

## Task 20: 选项与规则 CRUD

**Files:**
- Create: apps/api/src/routes/admin/options.ts、test/admin-options.test.ts
- Create: apps/web/src/admin/pages/OptionsAdmin.vue

**Interfaces:** CRUD paints / wheels / interiors / packages / model_options / option_rules；settings 读写（税率、减免比例、减免上限、保险费率、上牌费）。

- [ ] 步骤 1：写测试：给 S7 增加一种车漆并在前台 options 可见；规则 requires 生效。
- [ ] 步骤 2：实现接口与规则编辑器（下拉选 if/requires/minTrim）；settings 页可改税率与保险参数，保存后报价立即生效。
- [ ] 步骤 3：提交 feat: admin options and rules。

## Task 21: 线索、预约、门店与看板

**Files:**
- Create: apps/api/src/routes/admin/leads.ts、appointments.ts、stores.ts、stats.ts
- Create: apps/web/src/admin/pages/LeadsAdmin.vue、AppointmentsAdmin.vue、StoresAdmin.vue

**Interfaces:** 线索状态流转 new -> contacted -> test_driven -> closed；订单管理 GET/PATCH /api/admin/orders；看板统计今日线索/预约/订单/热门配置。

- [ ] 步骤 1：写测试：线索状态流转合法/非法；订单状态流转合法/非法；看板返回 4 个数字。
- [ ] 步骤 2：实现接口与页面；线索与订单列表支持按状态筛选。
- [ ] 步骤 3：提交 feat: admin leads appointments stores dashboard。

---

## Task 22: 容器化

**Files:**
- Create: apps/api/Dockerfile、docker-compose.yml
- Create: scripts/deploy.sh

**Interfaces:** 镜像 wangshu-api:tag；容器名 wangshu-api；端口 127.0.0.1:3000；数据卷 /data。

- [ ] 步骤 1：写多阶段 Dockerfile：构建阶段跑 pnpm build，运行阶段只带 dist 与生产依赖。
- [ ] 步骤 2：本地 docker build；docker run 起容器；curl /api/health 200。
- [ ] 步骤 3：写 deploy.sh：本地 build -> save -> ssh load -> compose up -d -> health 检查。
- [ ] 步骤 4：提交 feat: containerization。

## Task 23: nginx、静态发布与备份

**Files:**
- Modify: 服务器 /etc/nginx/sites-available/ziphare（SPA fallback + /api 反代）
- Create: scripts/backup.sh

**Interfaces:** /var/www/site 放 dist；/api 反代 127.0.0.1:3000；每日 03:00 备份到 /opt/wangshu/backups。

- [ ] 步骤 1：本地构建 dist，rsync 到服务器 /var/www/site。
- [ ] 步骤 2：改 nginx：location / 用 try_files $uri $uri/ /index.html；location /api/ 反代。
- [ ] 步骤 3：nginx -t 通过后 reload；curl 公网 200；curl /api/health 200。
- [ ] 步骤 4：写备份脚本：sqlite3 .backup 或 python3 sqlite3 模块；保留 14 天。
- [ ] 步骤 5：提交 feat: deployment and backup。

## Task 24: 验收与演示脚本

**Files:**
- Create: docs/demo-script.md、docs/test-report.md
- Create: e2e/journey.spec.ts

**Interfaces:** Playwright 主旅程；验收清单 10 项。

- [ ] 步骤 1：写 Playwright：首页 -> 车型 -> 配置 -> 保存 -> 报价 -> 下订 -> 模拟支付 -> 订单；再走预约试驾。
- [ ] 步骤 2：本地跑通；无头模式；失败截图。
- [ ] 步骤 3：写 demo-script：3 分钟点击顺序与讲解词。
- [ ] 步骤 4：写 test-report：单测/接口/E2E 数量与结果。
- [ ] 步骤 5：提交 docs: demo script and test report。

---

## 自检

- 规格覆盖：设计文档第 4–12 节的功能都有任务对应（含订单与模拟支付）；论文材料在 M7 单独做。
- 步骤可执行：每个任务有文件、接口、测试断言或构建命令。
- 类型一致：金额统一 integer 分；QuoteInput/QuoteResult 在 shared 中定义一次。
- 风险优先：M0 先解决车身视觉；价格引擎与订单状态机先写测试；部署在 M5 收口。

## 执行方式

本计划由我（lead）按 native 方式逐任务实现；每个里程碑结束给你看一次可点的版本与截图。
