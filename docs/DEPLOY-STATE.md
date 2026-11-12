# 生产环境现状（DEPLOY-STATE）

> 更新：2026-11-12 13:50 · **部署前必读**。这是生产环境的唯一真相源。
> `docs/deploy-ip.md` 写于「IP + HTTP」时期，域名上线后部分内容已过时（差异见 §8），以本文为准。

---

## 1. 入口

| 入口 | 状态 | 用途 |
|---|---|---|
| `https://ziphare.me/` | ✅ **正式** | 演示、后台、登录 —— 一律走这里 |
| `https://www.ziphare.me/` | ✅ 200 | 与根域同一份站点（不跳转，nginx `server_name` 同时包含两者） |
| `http://203.0.113.10/` | ⚠️ 仅兜底 | 只能看页面，**不能登录**（原因见 §4.2） |

域名 `ziphare.me` 在阿里云注册，NS 已切到 `lex.ns.cloudflare.com` / `melissa.ns.cloudflare.com`。

## 2. 请求链路

```
浏览器
 → Cloudflare 边缘（TLS 终止，Let's Encrypt 证书，橙云代理）
 → Cloudflare Tunnel  61c1682b-abf0-49ff-a962-c7c9ef098c34（4 条连接，token 模式）
 → cloudflared（systemd）
 → nginx :80
     ├─ /api/   → 127.0.0.1:3100（wangshu-api / systemd / Node 24 + tsx）
     ├─ /models/*.glb → 静态文件（配置器共用 s7.glb，见 §4.3）
     └─ 其余    → /var/www/wangshu（SPA，try_files → index.html）
```

- 源站 **80 公网 OPEN**（IP 兜底）、**443 CLOSED**（不直接对外提供 TLS）。
- CF API token（`~/.dsh/.cf_api_token_ziphare`）**只有 Zone:Read**，读 DNS 记录 / 改 zone settings 都会返回 `10000`。

## 3. 证书与安全头（均已实测）

| 项 | 值 |
|---|---|
| 证书 | Let's Encrypt `YE2`，`CN=ziphare.me`，SAN `*.ziphare.me` + `ziphare.me` |
| 有效期 | 2026-11-12 ~ 2027-02-10（CF 自动续期） |
| HSTS | `max-age=15552000; includeSubDomains`（Preload 关闭） |
| 其他头 | `X-Content-Type-Options: nosniff`、`X-Frame-Options: SAMEORIGIN`、`Referrer-Policy: strict-origin-when-cross-origin` |
| CSP | 未配置（站点无 `v-html`，风险低） |
| HTTP→HTTPS | 301，由源站 nginx 按 `X-Forwarded-Proto: http` 判断（见 §4.1） |

## 4. 三处关键配置（改动前必读）

### 4.1 nginx：三段不能删、不能改回 prefix

线上 `/etc/nginx/sites-available/wangshu`，仓库 `deploy/nginx-wangshu.conf` 已同步。

| 段 | 作用 | 改错的后果 |
|---|---|---|
| `location ~ ^/models/[\w.-]+\.glb$` | 只匹配车模文件 | 写回 `location /models/` → **`/models`、`/models/:slug` 整页 nginx 404** |
| `location = /models { try_files /index.html =404; }` | 同名目录/路由消歧 | 删掉 → `/models` 与 `/models/` 互相 301 死循环 |
| `if ($http_x_forwarded_proto = "http") { return 301 https://...; }` | 只对经 CF 的 HTTP 跳转 | 删掉 → 域名可走明文；IP 直连不带该头，仍保持 200 |

> 这个坑的背景：`/models` 同时是 SPA 路由和静态目录名，本地 `vite dev` 没有 nginx，**只在生产暴露**。任何 nginx 改动都必须用生产 URL 冒烟。

### 4.2 systemd：`COOKIE_SECURE=true`（不要改回 false）

`/etc/systemd/system/wangshu-api.service`，仓库 `deploy/wangshu-api.service` 已同步。

```ini
Environment=COOKIE_SECURE=true
```

- **为什么必须 true**：HTTPS 站点的会话 cookie 必须带 `Secure`；否则明文 HTTP 请求也可能携带它。
- **副作用**：通过 `http://203.0.113.10/` 登录/注册会失败 —— 浏览器拒绝保存 Secure cookie，表现为「登录成功但立刻回到未登录」。**这是预期行为，不是 bug。**
- 2026-11-12 曾因按旧模板重装 unit 被回滚成 `false`，已修模板。重装 unit 后请确认这一行。

### 4.3 部署脚本：`rsync` 没有 `--delete`

`scripts/deploy-ip.sh` 只做 `rsync -az`，不清理远端旧产物。2026-11-12 实测：

| | 文件数 / 体积 |
|---|---|
| 线上 `/var/www/wangshu/assets` | **379 个文件（12 MB）** |
| 本地 `apps/web/dist/assets` | **58 个文件** |
| 纯残留 | 321 个，其中 `Configurator3D-*.js/css` 共 16 个（7.4 MB） |
| `/var/www/wangshu/models` | 11 MB（`r1.glb` 未引用 / `s7.glb` 全系共用） |

配置器使用 `Configurator3D.vue` 懒加载 `s7.glb`（所有车型/版本共用），封面用 `heroImage` 海报；右上角可切 2D 海报，2D 模式不加载 3D；`r1.glb` 不再引用。建议给部署脚本加 `--delete`，或手动清一次残留。

## 5. 正确的部署流程

```bash
# 1) 构建（服务器 1.7G 内存，不能构建，必须本地构建）
pnpm --filter @wangshu/web build

# 2) 部署静态 + API（不会碰 nginx / systemd）
./scripts/deploy-ip.sh

# 3) 只有改了 nginx 或 unit 时才需要：
scp deploy/nginx-wangshu.conf deploy@203.0.113.10:/tmp/
ssh deploy@203.0.113.10 '
  sudo install -m 644 -o root -g root /tmp/nginx-wangshu.conf /etc/nginx/sites-available/wangshu
  sudo nginx -t && sudo systemctl reload nginx'

# 4) 验收
ssh deploy@203.0.113.10 'bash ~/verify-ziphare.sh'
```

`deploy-ip.sh` **不会**安装 unit / nginx 配置；unit 变更必须手动 `install` + `daemon-reload` + `restart`。

## 6. 禁止事项

- ❌ 不要在 CF 里加 A 记录指向 `203.0.113.10` —— 绕过隧道与防护，且源站 443 关闭，必然不通。
- ❌ 不要删/改 CF 的两条隧道记录（`ziphare.me` / `www.ziphare.me`，橙云）。
- ❌ 不要把 nginx 的 `/models` 段改回 `location /models/`。
- ❌ 不要重新跑 `db:seed` —— 会清空线上订单与线索（脚本只在 DB 文件不存在时 seed）。
- ❌ 不要在 IP（HTTP）上验证登录功能。
- ❌ 不要在答辩当天改 DNS / 证书配置。

## 7. 验收脚本

`~/verify-ziphare.sh`（服务器上），8 项：

1. NS 是否指向 Cloudflare
2. 根域 / www 的 A 记录
3. HTTPS 状态码
4. HTTP → HTTPS 跳转
5. 证书 SAN 与有效期
6. 源站暴露面（80 OPEN / 443 CLOSED，如实报告不判好坏）
7. 本地 systemd 与 nginx / API 健康
8. 经 CF 的业务冒烟（含 `s7.glb` 4,413,104 B + md5 与源站比对）

> 旧版脚本第 6 项会「假绿」（连接成功时不报 refused 就走 else），第 8 项 GLB 因 `-m 25` 超时被截断成 2.3 MB 误报；2026-11-12 已重写。

## 8. 文档同步状态

2026-11-12 14:00 已同步以下入口口径到域名/HTTPS（原文保留历史细节）：

| 文件 | 状态 |
|---|---|
| `README.md` | 已改 https://ziphare.me/ + DEPLOY-STATE 指针 |
| `AGENTS.md` | 已由部署 agent 更新 |
| `docs/architecture.md` | 已改 Cloudflare 隧道 / HTTPS |
| `docs/defense-demo.md` | 已改 ziphare.me、IP 仅兜底 |
| `docs/demo-runbook.md` | 已改域名入口 |
| `docs/deploy-ip.md` | 顶部已加 DEPLOY-STATE 指针，验证命令改 HTTPS |

另：`docs/REVIEW-20261112.md` 的 **§4（3D 配置器）与 §7.4** 属旧阶段；当前配置器已重新启用共用 s7 四门轿车 3D，见 `docs/REVIEW-20261112-v06-ADDENDUM.md`。

## 9. 回滚点

| 对象 | 位置 |
|---|---|
| nginx | `/etc/nginx/sites-available/wangshu.bak-*`（多份，含 `20261112-103802` 修复前版本） |
| systemd unit | `/etc/systemd/system/wangshu-api.service.bak-*` |
| SQLite | `/opt/wangshu/backups/`（cron 每日 04:20，保留 14 天） |
| CF 侧 | zone id `163be6df3f3a0a8f8a3839d707c54ad2`，隧道 `61c1682b-abf0-49ff-a962-c7c9ef098c34` |