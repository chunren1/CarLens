# UI/交互细节审计（2026-11-13）

## 范围

18 个路由 × 桌面 1440 / 移动 390；另做 360 宽度关键页复验。检查项：

- 横向溢出
- 图片缺失、空 alt、broken image
- h1 数量
- 无名称按钮/输入
- 控制台错误、失败请求
- 死链
- 标题、OG 元信息

## 结果

- 390/360 宽度：全部页面横向溢出 0
- 图片：无 broken，无缺失 alt
- 链接：42 条站内链接全部 200，无死链
- 控制台：修复访客 /api/me 的 401 噪声后，页面控制台 0 错误
- h1：配置器补了视觉隐藏 h1；车型页/首页正常
- 表单：登录、试驾、金融输入均有 label 关联（审计脚本对 input 的“无名称”是误报）

## 本轮修复

- 访客 /api/me 改为 200 + user:null；auth store 不变，公开页不再出现 401
- 配置器增加 h1（sr-only）
- Header「开始配置」在车型/配置器页指向当前车型，不再固定 r1
- 移动菜单按钮 aria-label 随开合状态切换
- 轮播尊重 prefers-reduced-motion，并在页面隐藏时暂停自动轮播
- main 增加 tabindex=-1，配合 skip-link
- 增加 OG/Twitter 分享元信息
- 保留极简的细节审计脚本 scripts/ui-detail-audit.mjs

## 自动化

- API 测试 45/45
- vue-tsc + vite build 通过
