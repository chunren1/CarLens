import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // better-sqlite3 12.x 在 Node 24.19 下，Statement 若在进程退出后才被 GC
    // 会触发 Node 的 RemoveEnvironmentCleanupHook 断言（WiseLibs/better-sqlite3#1515）。
    // forks + --expose-gc，让测试在关闭连接后主动 GC，退环境前回收原生句柄。
    pool: "forks",
    poolOptions: {
      forks: {
        execArgv: ["--expose-gc"],
      },
    },
  },
});
