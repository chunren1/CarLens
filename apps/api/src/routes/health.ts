import type { FastifyInstance } from "fastify";

export const API_VERSION = "0.1.0";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    let db = "ok";
    try {
      app.db.$client.prepare("select 1").get();
    } catch {
      db = "error";
    }
    return {
      status: db === "ok" ? "ok" : "degraded",
      version: API_VERSION,
      db,
      time: new Date().toISOString(),
    };
  });
}
