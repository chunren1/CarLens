from pathlib import Path
p=Path('/home/user/projects/wangshu/apps/api/src/db/client.ts'); s=p.read_text()
old='''  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");'''
new='''  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  // 单机 SQLite 的并发保护：等锁 5s，避免瞬时写冲突直接抛 SQLITE_BUSY；
  // NORMAL 在 WAL 下仍能保证崩溃一致性，比 FULL 少一次同步。
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("cache_size = -20000");'''
if old not in s: raise SystemExit('client needle missing')
p.write_text(s.replace(old,new,1))
print('pragmas patched')
