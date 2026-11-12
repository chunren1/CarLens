import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Order, OptionCatalog, Store } from "@wangshu/shared";
import { buildOrderPayload, fetchCatalog, openApiContext, type ApiTestContext } from "./helpers";

let ctx: ApiTestContext;
let catalog: OptionCatalog;
let storeId: number;

function sessionCookie(response: { headers: Record<string, unknown> }): string {
  const raw = response.headers["set-cookie"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") throw new Error("缺少 Set-Cookie");
  const first = value.split(";")[0] ?? "";
  const token = first.slice(first.indexOf("=") + 1);
  if (!token) throw new Error("缺少会话 token");
  return token;
}

async function register(email: string): Promise<string> {
  const response = await ctx.app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password: "password123", name: "测试用户" },
  });
  expect(response.statusCode).toBe(201);
  return sessionCookie(response);
}

beforeEach(async () => {
  ctx = await openApiContext();
  catalog = await fetchCatalog(ctx.app, "s7");
  const stores = (await ctx.app.inject({ method: "GET", url: "/api/stores" })).json<Store[]>();
  storeId = stores[0]!.id;
});

afterEach(async () => {
  await ctx.close();
});

describe("订单支付归属", () => {
  it("rejects another logged-in user paying an order (404) and lets the owner pay", async () => {
    const tokenA = await register("owner@example.com");
    const tokenB = await register("intruder@example.com");

    const created = await ctx.app.inject({
      method: "POST",
      url: "/api/orders",
      payload: buildOrderPayload(catalog, storeId),
      cookies: { ws_sid: tokenA },
    });
    expect(created.statusCode).toBe(201);
    const order = created.json<Order>();

    const blocked = await ctx.app.inject({
      method: "POST",
      url: "/api/orders/" + order.orderNo + "/pay",
      cookies: { ws_sid: tokenB },
    });
    expect(blocked.statusCode).toBe(404);
    expect(blocked.json<{ code: string }>().code).toBe("ORDER_NOT_FOUND");

    const paid = await ctx.app.inject({
      method: "POST",
      url: "/api/orders/" + order.orderNo + "/pay",
      cookies: { ws_sid: tokenA },
    });
    expect(paid.statusCode).toBe(200);
    expect(paid.json<Order>().status).toBe("paid");
  });

  it("keeps guest order payment available by orderNo bearer", async () => {
    const created = await ctx.app.inject({
      method: "POST",
      url: "/api/orders",
      payload: buildOrderPayload(catalog, storeId),
    });
    expect(created.statusCode).toBe(201);
    const order = created.json<Order>();

    const paid = await ctx.app.inject({
      method: "POST",
      url: "/api/orders/" + order.orderNo + "/pay",
    });
    expect(paid.statusCode).toBe(200);
    expect(paid.json<Order>().status).toBe("paid");
  });
});
