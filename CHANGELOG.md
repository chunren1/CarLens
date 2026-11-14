# Changelog

本项目采用“按日期 + 范围”的变更记录。每个 PR 必须更新 Unreleased；发布时由 Release Manager 移到日期版本。

## Unreleased

### Added
- [docs] 共同开发规范、PR 模板与交接文档（2026-11-14）

## 2026-11-13

### Added
- [web] 车型矩阵、20 款跨品牌车型、后台换色图审核
- [api] 订单幂等、试驾时段校验、数据库健康检查
- [assets] 第一批 5 款车型 15 张换色图；7 款车共 25 张
- [docs] 论文完整版、答辩 PPT、讲稿、用例图/ER 图/部署图

### Changed
- [web] 3D 依赖拆成 three-core / three-addons，2D 不加载 three
- [api] SQLite WAL + busy_timeout + synchronous/cache 参数
- [ops] 每日 03:30 SQLite 备份 cron，含 integrity_check / health

### Fixed
- [web] 访客 /api/me 不再产生 401 控制台噪声
- [web] 配置器补 h1、轮播 reduced-motion、移动菜单 aria
- [api] 共享定价测试 fixture 补齐 ModelSummary 字段

## 2026-11-12

### Added
- [web] 多品牌车型矩阵/轮播/海报馆、移动端适配
- [api] 多品牌 seed、图片字段、订单幂等
- [deploy] HTTPS + CSP + nginx/systemd 加固

### Fixed
- [web] 对比页移动端卡片、轮播 dots 溢出、后台表格横向滚动
- [deploy] 清理旧静态资源，移除 r1.glb 引用

---

## 模板

    ### Added
    - [范围] 用户能感知的新功能（PR #）

    ### Changed
    - [范围] 行为/接口/性能变化（PR #）

    ### Fixed
    - [范围] 修复的问题（PR #）

    ### Removed
    - [范围] 删除的功能/资源（PR #）
