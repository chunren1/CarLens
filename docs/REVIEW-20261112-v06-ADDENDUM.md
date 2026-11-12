# v0.6 审查报告 · 3D 变更附注

> 2026-11-12 20:55。主报告：`docs/REVIEW-20261112-v06.md`（427 行，仍为安全与代码质量的主依据）。

## 变更

按项目讨论方案，配置器重新启用 3D，但**所有车型/版本共用同一个四门轿车模型** `public/models/s7.glb`（4.3 MB）；封面、车型卡、首页轮播、海报馆继续使用高清海报。

- `ConfiguratorPage.vue`：异步加载 `Configurator3D`，加载中显示海报 + 进度，失败自动回退海报；
- `Configurator3D.vue`：s7 四门轿车、车漆/轮毂联动、前 45°/侧面/后 45°、拖动旋转/滚轮缩放；
- 默认视角改为侧面，默认车漆改为浅色（雪域白），便于看清四门比例；
- 右上角可切 **2D 海报** 模式：不渲染 3D、不请求 3D chunk/GLB，偏好写入 localStorage；3D→2D 立即卸载 canvas。
- 构建产物新增 `Configurator3D-*.js` 约 **294.7 KB gzip**；GLB 4.3 MB 按需加载。

## 主报告中因此过时的条目

- §1.2「3D chunk 0」：现在有 3D chunk，见上；
- §5.2 FE-10「3D 代码/资源未使用」：s7 现在被配置器使用；r1.glb 仍未使用；
- §7.1「3D chunk 0」、PERF-1「线上 11 MB glb 零引用」：s7.glb 已引用，r1.glb 仍冗余；
- §10 DOC-1「车身呈现与实现冲突」、DOC-14「setup-assets 下载 3D 无用」：现在 3D 是演示路径，但封面仍以海报为准；
- §13.2 构建基线：3D chunk 新增。

## 安全整改进度（2026-11-12 21:10）

已处理：

- SEC-1：线上管理员口令已轮换为随机值，保存在本机 `.secrets/admin-password`（已 gitignore）；seed 生产环境必须提供 `ADMIN_PASSWORD`；文档/脚本中的明文已移除。
- SEC-2：`POST /orders/:orderNo/pay` 增加订单归属校验；他人订单返回 404；补跨用户测试。
- SEC-3：登录/注册/下单/试驾加 `@fastify/rate-limit`，补 429 测试。
- SEC-4：生产环境 `seed` 默认拒绝执行，必须显式 `ALLOW_DB_RESET=1`。
- FUN-1：后台 `revenuePaid` 改为 `payments` 成功金额汇总，UI 标签改“实收定金”。

仍未处理：

- ARCH-1：应用代码未入 Git；
- 订单幂等键、下订前复核、历史快照版本号；
- 试驾过去时间/容量校验；
- CSP / www 跳转 / 部署 --delete；
- 前端测试与 Playwright；
- 文档大面积 drift（design/AGENTS/architecture 的部分旧章节）。

上述 P0/P1 已从“未修”变为“部分修复”；主报告原文保留，以本节为最新状态。