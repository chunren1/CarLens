# 数据库选型决策（2026-11-13）

## 结论

**现阶段保留 SQLite，不迁移到 MySQL/PostgreSQL。**  
迁移不会让当前毕业设计明显更好，反而会引入较高风险；把同样的时间投入到图片、后台和测试更划算。

## 为什么

1. 数据规模小：20 款车型、45 个版本、25 张换色图、少量订单和线索。
2. 访问模式以读为主，写操作只有下单、支付、试驾、后台修改；WAL 足够。
3. 线上资源不是瓶颈：服务器 CPU 约 1.7%、内存约 42%、云盘约 21%。
4. 迁移不是改一个连接串：要重写 Drizzle schema（sqlite-core → pg-core）、repository 的同步 .get()/.all() 调用、迁移文件、测试内存库、部署和备份链路，任何一步都可能破坏已验收的演示。
5. 毕业设计答辩更看重设计取舍和可验证结果，不是“用了更大的数据库”。

## 已经做的低风险加固

- WAL 模式
- foreign_keys = ON
- busy_timeout = 5000，降低瞬时写冲突直接失败
- synchronous = NORMAL，WAL 下兼顾崩溃一致性和写入开销
- cache_size = 20 MB
- /api/health 增加 db 字段
- scripts/backup-db.sh：服务器侧 SQLite backup API + 14 天保留
- 后台换色图审核

## 什么情况下再迁移

满足任一条件再考虑 PostgreSQL：

- 需要多台 API 实例同时写
- 需要行级锁、复杂事务或强一致报表
- 单表数据量到百万级，SQLite 查询和维护明显变慢
- 需要外部 BI/数据团队直连

迁移步骤（未来）：

1. 新建 packages/db 或 drizzle/pg schema，保持字段和索引一一对应
2. repository 改成异步 API，接口契约不变
3. 用 pg_dump 或脚本迁数据，逐表校验行数和金额
4. 测试用 Testcontainers 或独立 PostgreSQL
5. 部署加 PostgreSQL 服务、连接池和备份，保留 SQLite 回滚开关
