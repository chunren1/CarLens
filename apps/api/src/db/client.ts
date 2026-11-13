import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import type { Database as DatabaseClient } from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

/** drizzle 实例带 $client（better-sqlite3 连接），用于 PRAGMA / 关闭连接。 */
export type AppDb = BetterSQLite3Database<typeof schema> & {
  $client: DatabaseClient;
};

const migrationsFolder = fileURLToPath(
  new URL("../../migrations/", import.meta.url),
);

/**
 * 打开 SQLite 并跑迁移。传 ":memory:" 得到临时内存库（测试用）。
 * 返回的 db 与 better-sqlite3 连接一一对应，进程退出前调用 closeDb()。
 */
export function createDb(databasePath: string): AppDb {
  if (databasePath !== ":memory:" && !databasePath.startsWith("file:")) {
    mkdirSync(dirname(databasePath), { recursive: true });
  }
  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  // 单机 SQLite 的并发保护：等锁 5s，避免瞬时写冲突直接抛 SQLITE_BUSY；
  // NORMAL 在 WAL 下仍能保证崩溃一致性，比 FULL 少一次同步。
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("cache_size = -20000");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder });
  return db;
}

export function closeDb(db: AppDb): void {
  db.$client.close();
}
