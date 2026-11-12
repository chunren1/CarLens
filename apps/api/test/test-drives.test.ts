import { describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { openApiContext } from "./helpers";

async function firstStoreId(app: FastifyInstance): Promise<number> {
  const response = await app.inject({ method: "GET", url: "/api/stores" });
  const stores = response.json<{ id: number }[]>();
  const store = stores[0];
  if (!store) throw new Error("种子数据没有门店");
  return store.id;
}

describe("test drive appointments", () => {
  it("creates a lead and a pending appointment", async () => {
    const ctx = await openApiContext();
    try {
      const storeId = await firstStoreId(ctx.app);
      const response = await ctx.app.inject({
        method: "POST",
        url: "/api/test-drives",
        payload: {
          name: "张三",
          phone: "13800138000",
          modelSlug: "s7",
          storeId,
          slot: "2026-11-15 10:00",
        },
      });
      expect(response.statusCode).toBe(201);
      const body = response.json<{ id: number; leadId: number; status: string }>();
      expect(body.status).toBe("pending");

      const leadCount = ctx.db.$client
        .prepare("select count(*) as n from leads")
        .get() as { n: number };
      const appointmentCount = ctx.db.$client
        .prepare("select count(*) as n from appointments")
        .get() as { n: number };
      expect(leadCount.n).toBe(1);
      expect(appointmentCount.n).toBe(1);
    } finally {
      await ctx.close();
    }
  });

  it("rejects an invalid phone number", async () => {
    const ctx = await openApiContext();
    try {
      const storeId = await firstStoreId(ctx.app);
      const response = await ctx.app.inject({
        method: "POST",
        url: "/api/test-drives",
        payload: {
          name: "张三",
          phone: "123",
          modelSlug: "s7",
          storeId,
          slot: "2026-11-15 10:00",
        },
      });
      expect(response.statusCode).toBe(400);
    } finally {
      await ctx.close();
    }
  });

  it("rejects an unknown store", async () => {
    const ctx = await openApiContext();
    try {
      const response = await ctx.app.inject({
        method: "POST",
        url: "/api/test-drives",
        payload: {
          name: "张三",
          phone: "13800138000",
          modelSlug: "s7",
          storeId: 99999,
          slot: "2026-11-15 10:00",
        },
      });
      expect(response.statusCode).toBe(404);
    } finally {
      await ctx.close();
    }
  });

  it("rejects an unknown model", async () => {
    const ctx = await openApiContext();
    try {
      const storeId = await firstStoreId(ctx.app);
      const response = await ctx.app.inject({
        method: "POST",
        url: "/api/test-drives",
        payload: {
          name: "张三",
          phone: "13800138000",
          modelSlug: "nope",
          storeId,
          slot: "2026-11-15 10:00",
        },
      });
      expect(response.statusCode).toBe(404);
    } finally {
      await ctx.close();
    }
  });
});