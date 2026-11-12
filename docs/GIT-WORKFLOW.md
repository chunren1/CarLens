# Git 远程仓库操作手册

> 更新：2026-11-12 22:25 · 面向接手本仓库的 agent，也给你本人看。
> 所有"仓库事实"都用命令实测过，命令原文在文末 §12，可随时复验。
> 本指南、`.gitignore` 的脚本 ignore 规则、`AGENTS.md` 的指南链接已随公开版初始提交入库。

---

## 0. 仓库事实（实测，不是推测）

| 项 | 值 | 怎么验的 |
|---|---|---|
| remote | `git@github.com:chunren1/CarLens.git`（**SSH，不是 HTTPS**） | `git remote -v` |
| 可见性 | **PUBLIC**（2026-11-12 用户要求转公开） | `gh repo view chunren1/CarLens --json visibility` |
| 创建时间 | 2026-11-12（公开版重建） | 同上 |
| 默认分支 | `main` | 同上 |
| 提交数 | 1（公开版初始提交，最新见 `git log -1`） | `git rev-list --count HEAD` |
| 已跟踪文件 | 178 | `git ls-files \| wc -l` |
| 本地 vs 远端 | **完全同步**，`git push --dry-run` → `Everything up-to-date` | 实测 |
| tag / CI | 无 tag、无 `.github/` | `git tag`、`ls -a` |
| 提交身份 | `chunren1 <168334890+chunren1@users.noreply.github.com>` | `git log -1 --format='%an <%ae>'` |
| SSH key | `~/.ssh/id_ed25519`，`ssh -T git@github.com` → `Hi chunren1!` | 实测 |

**这个仓库现在是公开仓库**：里面有生产服务器 IP、部署命令、demo 账号与毕设文档；已按用户要求公开并做过敏感扫描（无 SSH key/token/管理员新口令）。公开后仍要避免再提交任何凭据。

## 1. 三条铁律

1. **未经用户明确说「提交 / 推送 / 发布 / 发 PR」，不要 push。** 写代码、跑测试、改文件都可以，`git commit` 也可以先在本地做，但 push 是公开动作，要等一句话授权。
2. **不要 `git add .` / `git add -A`。** 工作区常驻 66 个未跟踪的一次性脚本（§7），全量 add 会把它们一起卷进提交。
3. **push ≠ 部署。** 推到 GitHub 只是备份/审阅；线上要另走 `scripts/deploy-ip.sh` + 验收（§9）。

## 2. 日常循环（照抄即可）

```bash
# 1) 先看远端有没有别人的新提交（有就 rebase，别直接改）
git fetch origin && git status -sb
#    预期首行：## main...origin/main   ← 没落后就是干净的

# 2) 精确暂存：写清楚每个路径，不用通配符
git add apps/web/src/pages/ConfiguratorPage.vue docs/status.md

# 3) 逐行看要提交什么（这一步不能省）
git diff --cached            # 完整 diff
git diff --cached --stat     # 只看文件与行数

# 4) 一条提交一件事
git commit -m "fix: 配置器切换车漆后报价不刷新"

# 5) 用户授权后再推
git push origin main
```

`git status -sb` 里 `## main...origin/main [ahead 1]` 表示本地多 1 条；`[behind 2]` 表示远端多 2 条，先 `git pull --rebase`。

## 3. 提交信息规范

公开版初始提交 1 条，风格是「**前缀 + 中文描述**」，照这个来：

```
feat: 车鉴 CarLens 多品牌配置平台（3D/2D、跨品牌海报、安全整改）
docs: 标题不改；记录 3D 管线验证结果（M0）
```

| 前缀 | 用于 | 反例 |
|---|---|---|
| `feat:` | 新功能 | ❌ `update`、`新增功能` |
| `fix:` | 修 bug | ❌ `fix bug`、`修复问题` |
| `docs:` | 只动文档 | ❌ `修改文档` |
| `refactor:` | 不改行为的重构 | ❌ `优化代码` |
| `test:` | 只动测试 | |
| `chore:` | 依赖、脚本、配置 | |

- 一条提交只做一件事；两件不相关的事拆两条。
- 禁止 `wip` / `tmp` / `test` / `111` 这类占位信息——历史会长期留着。

## 4. 推送前检查清单（逐条打勾）

```bash
# ① 只有预期文件
git status -sb

# ② 数量和体积对得上
git diff --cached --stat | tail -3

# ③ 敏感文件扫描（输出应为空）
git diff --cached --name-only | grep -iE '\.env|credential|secret|\.pem$|\.key$|\.db$|password'

# ④ 产物扫描（输出应为空；-f 强加会绕过 .gitignore，别干）
git diff --cached --name-only | grep -E 'node_modules|/dist/|\.log$|\.glb$|\.tsbuildinfo$'

# ⑤ 空白错误
git diff --cached --check
```

代码门（**实测可用**；当前环境 PATH 里有 pnpm 11.28.5，如果你的 shell 没有 pnpm，就直接用下面的绝对路径命令）：

```bash
# 全量 API 测试
./apps/api/node_modules/.bin/vitest run --root apps/api

# 单文件（快，4.8s）
./apps/api/node_modules/.bin/vitest run --root apps/api test/admin.test.ts

# Web 类型检查（exit 0 才算过）
./apps/web/node_modules/.bin/vue-tsc --noEmit -p apps/web/tsconfig.json
```

改了部署 / 环境变量 / 端口 / 域名 → 顺手同步 `docs/DEPLOY-STATE.md`，它是生产环境的唯一真相源。

## 5. 分支策略（单人毕设，别搞重）

| 场景 | 做法 |
|---|---|
| 日常小改（≤3 文件） | 直接 `main`，commit + push |
| 大改 / 实验（改架构、换 UI 体系、升级依赖） | `git switch -c feat/xxx`，自测通过后 `git switch main && git merge --no-ff feat/xxx` |
| 答辩前一周 | **冻结 main**，只允许 `fix/*` 分支进热点修复 |
| 临时看旧版本代码 | `git switch --detach <sha>`，看完 `git switch main` |

不要开长期分支（`dev` / `develop`），一个人维护两条线只会制造合并噪声。

## 6. 不该入库的东西（.gitignore 已覆盖）

| 路径 | 体积（实测） | 为什么不入库 |
|---|---|---|
| `node_modules/` | 270 MB | 依赖，`pnpm install` 重建 |
| `spike/` | 147 MB | 视觉实验，一次性 |
| `docs/screens/` | 52 MB | 过程截图 |
| `apps/web/public/models/*.glb` | 11 MB | 二进制车模，服务器上单独放 |
| `docs/REVIEW-20261112.md` 等 | — | 含旧口令与订单 PII，只留本地 |
| `.secrets/` | — | 本机凭据（`admin-password`） |
| `.env` / `.env.*` | — | 只提交 `.env.example` |
| `dist/` / `data/*.db` | — | 构建产物 / 运行数据 |

**永远不要用 `git add -f` 绕过这些规则。** 一旦大文件进了历史，`git rm --cached` 只能让它不再跟踪，仓库体积不会变小（要 `git filter-repo` 重写历史，风险高，需要用户拍板）。

## 7. 那 66 个未跟踪脚本怎么处理

现状（实测）：`git status` 里有 66 个未跟踪文件，全部在 `scripts/` 下——**60 个 `.mjs` + 6 个 `.py`**，都是截图/爬虫/构建摘要类一次性脚本（`shot-*`、`live-*`、`3d-*`、`byd-*`、`scrape-*`、`build-summary-*`）。

**交付物只有这 6 个脚本**（已入库）：`deploy-ip.sh`、`setup-assets.sh`、`e2e-demo.mjs`、`e2e-test-drive.mjs`、`smoke-api.sh`、`watchdog.sh`。

**已处理（2026-11-12）**：在 `.gitignore` 末尾加了 ignore 规则并随公开版提交入库，脚本文件留在磁盘可继续运行，但不再出现在 `git status` 里。实测 `git status -sb` 从 66 行未跟踪变为只剩真正要提交的改动，6 个已跟踪交付脚本不受影响（ignore 不作用于已跟踪文件）。

规则原文（追加在 `.gitignore` 末尾）：

```gitignore
# scripts/ 下的一次性脚本（截图/爬虫/摘要），不入库；交付脚本只有 deploy-ip.sh / setup-assets.sh /
# e2e-demo.mjs / e2e-test-drive.mjs / smoke-api.sh / watchdog.sh（均已入库，ignore 不影响已跟踪文件）
scripts/*-shot*.mjs
scripts/shot-*.mjs
scripts/live-*.mjs
scripts/scrape-*.mjs
scripts/check-*.mjs
scripts/build-summary*.py
scripts/3d-r1-mobile.mjs
scripts/fetch-byd-posters.mjs
scripts/order-cancel-test.mjs
scripts/other-brand-imgs.mjs
scripts/paint-black.mjs
scripts/r1-blue-test.mjs
scripts/ref-imgs.mjs
scripts/wait-live.mjs
```

新增一次性脚本时，如果 `git status` 里看不见它，说明被规则命中——正常，不用管。**要入库的新脚本必须不被上述模式命中**；如果确实需要强加，先让用户明确同意，并在提交信息里说明为什么它属于交付物，不要擅自 `git add -f`。

**禁止 `git add scripts/` 全量入库**：仓库里混进 66 个一次性脚本，以后没人分得清哪个是交付物。

## 8. 回滚与纠错

| 情况 | 命令 | 说明 |
|---|---|---|
| 刚 commit，还没 push，写错了 | `git reset --soft HEAD~1` | 撤销提交，改动回到暂存区 |
| 暂存错了文件 | `git restore --staged <file>` | 不动工作区内容 |
| 改了文件想丢弃 | `git restore <file>` | **不可恢复**，先确认 |
| 已经 push 了，要撤销 | `git revert <sha>` | 生成反向提交，历史保留，安全 |
| 远端有别人的提交 | `git pull --rebase` | 不要用 `git pull`（会产生多余 merge） |
| 出现冲突 | **停手**，把冲突文件列表贴给用户 | 不要 `push -f`，不要猜着改 |
| 误提交大文件 | `git rm --cached <file>` + 加 ignore | 历史里的副本仍在，需用户决定是否重写 |

## 9. push 与部署是两条线

```
git push  →  GitHub（私有备份 / 审阅 / 论文附件）
部署       →  rsync 到 /opt/wangshu + /var/www/wangshu，重启 systemd
```

部署命令与禁止事项**全部在 `docs/DEPLOY-STATE.md`**，这里只重复最容易踩的三条：

1. `scripts/deploy-ip.sh` 用 `rsync -az`，**没有 `--delete`**，线上会堆积历史 chunk（实测曾 379 个文件 vs 本地 58 个）。
2. 它**不安装** nginx 配置和 systemd unit。改这两样必须手动 `install` + `nginx -t` / `daemon-reload` + reload/restart。
3. 部署后必须跑验收：`ssh deploy@203.0.113.10 'bash ~/verify-ziphare.sh'`（8 项，含 GLB md5）。

**2026-11-12 的真实事故**：有人按仓库旧模板重装 unit，把 `COOKIE_SECURE=true` 冲回 `false`，导致 HTTPS 站点 cookie 丢失 `Secure` 位。模板已修，重装后必须 `grep COOKIE_SECURE` 确认。

## 10. 仓库主人（用户本人）怎么操作

| 想做的事 | 怎么做 |
|---|---|
| 网页上看代码 / 提交历史 | <https://github.com/chunren1/CarLens> |
| 在另一台机器上拿代码 | `git clone git@github.com:chunren1/CarLens.git`（需该机有你的 SSH key） |
| 改可见性（private ↔ public） | Settings → 最下 Danger Zone → Change visibility |
| 加协作者 / 让老师看 | Settings → Collaborators → Add people（私有仓库必须邀请，不能直接发链接） |
| 给答辩版本打个标记 | `git tag -a v1.0 -m "答辩版" && git push origin v1.0` |
| 网页上撤销某次提交 | 进 commit → 右上 `Revert` → 生成 PR → Merge |
| 删仓库 | Settings → Danger Zone → Delete（**不可逆**，先 `git clone --mirror` 备份） |

**当前已按用户要求 public**：仓库里的服务器地址已脱敏为 `203.0.113.10`，demo 口令不写入仓库；部署脚本要求 `DEPLOY_HOST`。若答辩前想收紧，可在 Settings 改回 private；公开状态下不要提交任何新凭据。

## 11. 禁止事项

- ❌ `git push --force` / `push -f`（除用户明确要求且确认只覆盖自己的分支）
- ❌ `git add .` / `git add -A` / `git add -f`（后者会绕过 `.gitignore`）
- ❌ 提交 `node_modules/`、`dist/`、`*.glb`、`docs/screens/`、`.secrets/`、`.env`
- ❌ 在 `main` 上 rebase 已推送的历史（会强制所有人重拉）
- ❌ 把 remote 改回 HTTPS 绕过 SSH 失败（先查 key 是否有效）
- ❌ 删除/改写远端已有分支
- ❌ 提交信息写 `wip` / `fix bug` / `update`
- ❌ 把 `docs/REVIEW-20261112*.md` 解除 ignore（含旧口令与订单 PII）

## 12. 复验命令（一条条能跑）

```bash
git remote -v
gh repo view chunren1/CarLens --json name,visibility,defaultBranchRef,pushedAt
git status -sb
git log --oneline -3
git rev-list --count HEAD
git ls-files | wc -l
git tag
ssh -T git@github.com
git push --dry-run origin main
```