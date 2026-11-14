# 共同开发补充文档（直接发给接手 agent）

> 你之前收到的 CarLens 交接 ZIP 是旧版本，里面可能还没有这三份协作文档：
> CONTRIBUTING.md、CHANGELOG.md、.github/pull_request_template.md。
> **不需要重新发 ZIP**。你的交接包里有 .git，只要从公开仓库同步这几份文档即可。

## 1. 先同步文档

在项目根目录执行：

    git fetch origin main
    git checkout origin/main -- \
      CONTRIBUTING.md \
      CHANGELOG.md \
      HANDOFF.md \
      README.md \
      .github/pull_request_template.md

如果你本地没有 .git（例如只解压了源码），直接看公开仓库：

    https://github.com/chunren1/CarLens/blob/main/CONTRIBUTING.md
    https://github.com/chunren1/CarLens/blob/main/CHANGELOG.md

同步后先读：

1. HANDOFF.md
2. CONTRIBUTING.md
3. CHANGELOG.md
4. .github/pull_request_template.md

## 2. 两方共同开发的最小规则

### 角色

- Owner / Release Manager：原项目所有者；合并 main、部署、管理 .secrets
- Collaborator：接手开发 agent；功能分支 + PR，不直接推 main

如果两边都开发，每次发布也必须指定**唯一一个 Release Manager**，部署不能并发。

### 分支

    git fetch origin
    git switch main
    git pull --rebase origin main
    git switch -c feat/你的任务名

分支名带范围：

    feat/web-model-filter
    fix/api-order-idempotency
    docs/handoff-update

### 合并

- main 不直接 push，全部走 PR
- 一个 PR 只解决一件事
- 大改动必须另一个 agent review
- 合并后用 squash merge

## 3. 双方改了什么都明确：CHANGELOG

每个 PR 必须修改 CHANGELOG.md 的 Unreleased：

    ### Added
    - [web] 车型矩阵增加价格筛选（PR #12）

    ### Changed
    - [api] 订单列表改为按创建时间倒序（PR #13）

    ### Fixed
    - [api] 修复幂等键在不同手机号下返回 500（PR #14）

范围标记：

- [web] 页面/组件/样式
- [api] 路由/仓储/数据库
- [shared] 类型/计价
- [assets] 图片/3D
- [deploy] 脚本/nginx/systemd
- [docs] 文档/论文

不要逐条抄 commit；写业务级变化，并关联 PR/Issue。

## 4. PR 必须回答

- 改了什么
- 影响哪些模块
- 关键文件/写入范围
- 验证了什么（typecheck / test / e2e / build / 截图）
- 是否更新 CHANGELOG
- 风险与回滚方式
- 关联 Issue

模板已放在 .github/pull_request_template.md。

## 5. 容易冲突的地方

### 数据库迁移

- 不改已合并迁移
- 新迁移用 pnpm --filter @wangshu/api db:generate
- 两个分支都加迁移时，先协调顺序
- 合并前用临时库跑 migration

### pnpm-lock.yaml

- 不手工编辑
- 改依赖后 pnpm install 重新生成
- 冲突时以先合并方为准，另一方 rebase 后重新 install

### 图片/3D

- 同一车型同一颜色只允许一个人改
- 新图保持 1600×1000 WebP
- 改图后同步 bump PAINT_IMAGE_VERSION
- 二进制冲突不手工合并，选最终版本并记录

### 部署

- scripts/deploy-ip.sh、deploy/、.secrets 由 Owner 改
- 同一时间只允许一个人部署
- 不允许生产 db:seed、rsync --delete、在服务器构建

## 6. 每次合并前

    pnpm typecheck
    pnpm test
    pnpm test:e2e        # 涉及核心链路时
    pnpm --filter @wangshu/web build

UI 改动附桌面 + 390 截图；API 改动附请求/响应；部署改动附 health 检查。

## 7. 每日同步

开始：

    git fetch origin
    git log --oneline origin/main -5

结束：

- 推送自己的分支
- 在 Issue/PR 写今天改了什么、明天做什么
- 不留跨天未提交改动

每周对齐一次优先级，清理已合并分支。

## 8. 红线

- 不把 .secrets、本地 DB、node_modules、dist 提交 Git
- 不在 Issue/PR/聊天里贴管理员口令
- 不 force push main
- 不覆盖别人的 main
- 部署前先备份；部署后 curl /api/health

## 9. 结论

如果只记住 5 条：

1. main 不直接 push，全部 PR
2. 每个 PR 更新 CHANGELOG
3. 部署只有 Release Manager
4. 改前声明写入范围，避免同文件冲突
5. 合并前 typecheck + test + build 必须绿

完整版见仓库里的 CONTRIBUTING.md；本文件用于旧 ZIP 的快速补充。
