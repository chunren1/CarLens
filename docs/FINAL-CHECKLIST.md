# 最终验收清单（2026-11-13）

## 工程

- [x] API 测试 45/45
- [x] E2E 2/2（配置→报价→下单→支付、后台换色图审核）
- [x] vue-tsc / tsc 通过
- [x] vite build 通过，3D 已拆包，无构建 warning
- [x] 2D 模式不请求 three.js，3D 模式 canvas 正常
- [x] SQLite WAL + busy_timeout + synchronous/cache 参数
- [x] 后台换色图审核（reviewed=1 才返回 2D）
- [x] 每日 03:30 备份 cron，含 integrity_check / health / 14 天保留

## 页面

- [x] 18 个路由桌面/移动端检查
- [x] 390/360 宽度横向溢出 0
- [x] 图片 broke 0、缺失 alt 0
- [x] 42 条站内链接 200，死链 0
- [x] 控制台 0 错误（访客 /api/me 已改 200 + null）
- [x] skip-link / main focus / 配置器 h1 / reduced-motion 轮播 / 移动菜单 aria

## 线上

- [x] https://ziphare.me/ 可访问
- [x] /api/health 返回 db: ok
- [x] 2026-11-13 备份实测 integrity=ok orders=3
- [x] 部署脚本上传备份脚本，cron 已安装
- [ ] 尚未推送公开仓库（本地 main 领先 9 个提交）

## 仍需人工完成

- [ ] 论文封面：班级 / 学号 / 姓名
- [ ] 论文目录在 Word 中更新域（Ctrl+A → F9）
- [ ] 答辩 PPT 可按最新数据再同步一版
- [ ] 剩余 13 款车换色图（素材工作，不是代码）
- [ ] SU7 官方标题字如需纯净底图，需再找一张或修图

## 已知边界

- 支付为模拟网关，不产生真实扣款
- 3D 全系共用 s7.glb，仅选装示意
- SQLite 单机，面向毕业设计演示规模
