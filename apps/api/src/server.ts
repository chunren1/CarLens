import { createApp } from "./app";
import { closeDb, createDb } from "./db/client";
import { loadEnv } from "./env";

const env = loadEnv();
const db = createDb(env.DATABASE_URL);
const app = createApp({ db, logger: true });

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  app.log.info(`收到 ${signal}，正在关闭 API`);
  try {
    await app.close();
  } finally {
    closeDb(db);
    process.exit(0);
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error(error);
  closeDb(db);
  process.exit(1);
}
