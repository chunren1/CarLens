# 共同开发规范（CarLens）

> 适用对象：两台电脑上的两个开发 agent / 开发者。
> 目标：双方都清楚“谁改了什么、改到哪里、什么时候能合并、谁能部署”。

## 0. 结论

需要，而且建议用“三件套”：

1. 本文：协作规则与边界
2. CHANGELOG.md：每次改动的业务级记录
3. .github/pull_request_template.md：每个 PR 的固定说明

不要只靠聊天记录同步。聊天会丢，Git + CHANGELOG + PR 才是可追溯的。

---

## 1. 角色与权限

默认角色（可按实际调整）：

| 角色 | 人员 | 权限 |
|---|---|---|
| Owner / Release Manager | 原项目所有者 | 合并 main、部署线上、改 .secrets、改 deploy、最终发布 |
| Collaborator | 接手开发 agent | 功能分支、提交 PR、改业务代码、跑测试；不直接推 main、不部署 |

如果双方都开发，也必须指定**唯一一个当次发布的 Release Manager**。部署是串行操作，不能两个人同时按。

规则：

- main 只接受 PR，不直接 push
- 部署只由当次 Release Manager 执行
- .secrets、服务器地址、管理员口令只由 Owner 管理
- 论文/答辩材料归 Owner，Collaborator 不改，除非明确授权

---

## 2. 唯一事实源

按优先级：

1. 代码 + Git 历史（最终事实）
2. CHANGELOG.md（业务级改动）
3. GitHub Issue / PR（任务与讨论）
4. docs/ 下的设计/验收文档

历史文档如果和代码冲突，以代码 + 最新 CHANGELOG 为准。

接手前先读：

- HANDOFF.md
- docs/FINAL-CHECKLIST.md
- docs/E2E-AND-OPS.md
- docs/DATABASE-DECISION.md

---

## 3. 环境隔离

两台电脑各自拥有：

- 自己的 node_modules
- 自己的 apps/api/data/wangshu.db
- 自己的 .secrets（不要通过 Git 同步）
- 自己的浏览器缓存

**不要跨机器同步**：

- node_modules
- pnpm-lock.yaml 以外的手工依赖
- 本地数据库
- .secrets
- dist
- 浏览器缓存

依赖以 pnpm-lock.yaml 为准；新机器执行 pnpm install。

---

## 4. 分支、提交、PR

### 分支命名

    feat/web-configurator-short-name
    fix/api-order-idempotency
    docs/handoff-update
    chore/deploy-backup

建议带开发者缩写/电脑标识：feat/web-xx-...，避免两个 agent 同名分支。

### 开发前

    git fetch origin
    git switch main
    git pull --rebase origin main
    git switch -c feat/...

### 提交前

    pnpm typecheck
    pnpm test
    pnpm test:e2e        # 改动涉及核心链路时
    pnpm --filter @wangshu/web build

### 提交信息

沿用仓库风格：

    feat: 增加车型筛选
    fix: 修复订单幂等冲突
    docs: 更新交接文档
    chore: 清理部署脚本

一条提交只做一件事。不要提交调试代码、console.log、临时截图。

### PR 规则

- 一个 PR 只解决一个 Issue
- 必须填写 PR 模板
- 必须更新 CHANGELOG.md 的 Unreleased
- 改动超过 300 行或涉及 shared/deploy，必须由另一方 review
- 不允许 force push main
- 合并方式：squash merge，保持 main 线性

---

## 5. 文件与目录所有权

| 范围 | 主责 | 说明 |
|---|---|---|
| apps/web/src/pages、components、styles | Collaborator | UI/交互；改前看现有设计 token |
| apps/web/public/images/brands、paints | 素材负责人 | 二进制文件，改前在 Issue 声明，避免同时改同一车型 |
| apps/api/src/routes、repositories | Collaborator/API 负责人 | 接口变更必须同步 packages/shared |
| apps/api/src/db/schema.ts、migrations | 双方都需 review | 迁移序号必须串行，见 §7 |
| packages/shared/src/types.ts、pricing.ts | 双方共同 | 改类型/计价必须通知另一方，跑 shared + api 测试 |
| scripts/deploy-ip.sh、deploy/、.secrets | Owner | Collaborator 不直接改部署 |
| docs/thesis、论文/PPT | Owner | 不覆盖，除非授权 |
| docs/、CHANGELOG.md | 双方 | 文档改动也要进 PR |

### 写入范围声明

开 Issue 时写清楚：

    Write scope:
    - apps/web/src/pages/ModelsPage.vue
    - apps/web/src/components/ModelCard.vue
    - packages/shared/src/types.ts（只读，不改）

如果另一个人已经改了同一文件，先协调，不要硬合并。

---

## 6. CHANGELOG 制度（最重要）

每次 PR 必须更新 CHANGELOG.md 的 Unreleased，格式：

    ### Added
    - [web] 车型矩阵增加价格区间筛选（PR #12）

    ### Changed
    - [api] 订单列表改为按创建时间倒序（PR #13）

    ### Fixed
    - [api] 修复同一幂等键在不同手机号下返回 500（PR #14）

要求：

- 写“用户/业务能感知的变化”，不要逐条抄 commit
- 标注范围 [web] / [api] / [shared] / [assets] / [docs] / [deploy]
- 关联 Issue/PR 编号
- 发布时由 Release Manager 把 Unreleased 移到日期版本

“双方改了什么都明确”就靠这一份，不靠聊天。

---

## 7. 冲突高发区

### 7.1 数据库迁移

- 不要修改已经合并的迁移文件
- 新迁移用 pnpm --filter @wangshu/api db:generate
- 迁移文件名带时间戳；两个分支都要加迁移时，先协调顺序
- 合并前在本地重建临时库，确认 migration 顺序能跑通
- 生产迁移前必须备份

### 7.2 pnpm-lock.yaml

- 不要手工编辑
- 改依赖后重新 pnpm install 生成
- 两个分支都改 lockfile 时，以先合并的一方为准，另一方 rebase 后重新 install

### 7.3 二进制图片

- 同一车型同一颜色只允许一个人改
- 新图必须带 1600×1000、WebP、generation-log（如适用）
- 改图后同步 bump PAINT_IMAGE_VERSION
- 图片文件冲突不要手工合并，直接选最终版本并记录在 CHANGELOG

### 7.4 部署文件

- deploy-ip.sh、nginx、systemd、.secrets 只由 Owner 改
- 另一个 agent 需要部署变更时，开 Issue 说明，由 Owner 执行
- 同一时间只允许一个部署

---

## 8. 同步节奏

每天开始：

    git fetch origin
    git log --oneline origin/main -5
    # 看 CHANGELOG Unreleased
    # 看 GitHub Issues 有没有指派给自己的

每天结束：

- 推送自己的分支
- 在 Issue/PR 写“今天改了什么、明天做什么”
- 不要留未提交的跨天改动（或者明确 stash）

每周：

- 对齐一次下一步优先级
- 清理已合并分支
- 检查 CHANGELOG 是否完整

---

## 9. 验证门（Definition of Done）

任何 PR 合并前：

- [ ] pnpm typecheck
- [ ] pnpm test
- [ ] 涉及核心链路时 pnpm test:e2e
- [ ] pnpm --filter @wangshu/web build
- [ ] 更新 CHANGELOG.md
- [ ] 没有提交 .secrets / 本地数据库 / 构建产物
- [ ] 没有 TODO/FIXME 遗留（或写进 Issue）
- [ ] 另一个 agent review（大改动必须）

涉及 UI：附桌面 + 390 移动截图。
涉及 API：附请求/响应示例。
涉及部署：附 health 检查结果。

---

## 10. 部署与发布

只有 Release Manager 执行：

    DEPLOY_HOST='<私密文件中的值>' ./scripts/deploy-ip.sh
    curl -s https://ziphare.me/api/health

发布后：

1. 更新 docs/DEPLOY-STATE.md（只写受影响部分）
2. 把 CHANGELOG Unreleased 移到发布日期
3. 打 tag（建议）：v1.0.1 / v1.1.0
4. 在 Issue 里写发布结果和回滚点

禁止：

- 生产 db:seed
- rsync --delete
- 在服务器构建
- 把 .secrets / 真实地址提交 Git

---

## 11. 安全与数据

- .secrets 只通过安全渠道传给协作者
- 不在 Issue/PR/聊天里贴管理员口令
- 本地数据库可以重建；生产数据库必须先备份
- 管理员口令轮换后，通知双方并更新各自本地 .secrets
- ZIP/交接包包含敏感信息时，只走私密渠道，不传公开网盘

---

## 12. 出现冲突时

1. 先停手，不要在冲突文件上继续改
2. git fetch；把自己的分支 rebase 到 origin/main
3. 按 §7 判断冲突类型
4. 解决后跑完整验证门
5. 在 PR 里写清楚“冲突原因 + 解决方式”
6. 如果涉及 schema/计价/部署，叫上另一方一起看

不要用 force push 覆盖别人的 main。

---

## 13. 快速开始（接手方）

    git clone git@github.com:chunren1/CarLens.git
    cd CarLens
    # 放入 .secrets / s7.glb / basis（见 HANDOFF.md）
    pnpm install
    ./scripts/setup-assets.sh
    ADMIN_PASSWORD='...' pnpm --filter @wangshu/api db:seed
    git switch -c feat/your-first-task
    pnpm dev

第一次提交前先读 CHANGELOG.md 和本文件。

---

## 14. 最小可执行约定

如果只记住 5 条：

1. main 不直接 push，全部走 PR
2. 每个 PR 必须更新 CHANGELOG
3. 部署只有 Release Manager 能做
4. .secrets / 本地 DB / node_modules 不进 Git
5. 合并前 typecheck + test + build 必须绿
