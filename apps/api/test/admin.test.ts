import { beforeEach, afterEach, describe, expect, it } from "vitest";
import type { Order, OptionCatalog, Store } from "@wangshu/shared";
import { buildOrderPayload, fetchCatalog, openApiContext, TEST_ADMIN_PASSWORD, type ApiTestContext } from "./helpers";

let ctx: ApiTestContext;
let catalog: OptionCatalog;
let storeId: number;

function tokenFrom(response: { headers: Record<string, unknown> }): string {
  const raw = response.headers["set-cookie"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const first = String(value ?? "").split(";")[0] ?? "";
  return first.slice(first.indexOf("=") + 1);
}

async function loginAdmin(): Promise<string> {
  const response = await ctx.app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "admin@wangshu.test", password: TEST_ADMIN_PASSWORD },
  });
  expect(response.statusCode).toBe(200);
  return tokenFrom(response);
}

beforeEach(async () => {
  ctx = await openApiContext();
  catalog = await fetchCatalog(ctx.app, "s7");
  const storesResponse = await ctx.app.inject({ method: "GET", url: "/api/stores" });
  storeId = storesResponse.json<Store[]>()[0]!.id;
});

afterEach(async () => {
  await ctx.close();
});

describe("admin", () => {
  it("rejects guests and non-admins", async () => {
    const guest = await ctx.app.inject({ method: "GET", url: "/api/admin/summary" });
    expect(guest.statusCode).toBe(401);

    const register = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "customer@example.com", password: "password123", name: "客户" },
    });
    const token = tokenFrom(register);
    const customer = await ctx.app.inject({
      method: "GET",
      url: "/api/admin/summary",
      cookies: { ws_sid: token },
    });
    expect(customer.statusCode).toBe(403);
  });

  it("returns a summary and all orders", async () => {
    const token = await loginAdmin();
    const created = await ctx.app.inject({
      method: "POST",
      url: "/api/orders",
      payload: buildOrderPayload(catalog, storeId),
    });
    expect(created.statusCode).toBe(201);

    const summary = await ctx.app.inject({
      method: "GET",
      url: "/api/admin/summary",
      cookies: { ws_sid: token },
    });
    expect(summary.statusCode).toBe(200);
    expect(summary.json<{ models: number; orders: number }>().models).toBe(2);
    expect(summary.json<{ orders: number }>().orders).toBe(1);

    const orders = await ctx.app.inject({
      method: "GET",
      url: "/api/admin/orders",
      cookies: { ws_sid: token },
    });
    expect(orders.statusCode).toBe(200);
    expect(orders.json<Order[]>()).toHaveLength(1);
  });

  it("follows the order state machine", async () => {
    const token = await loginAdmin();
    const created = await ctx.app.inject({
      method: "POST",
      url: "/api/orders",
      payload: buildOrderPayload(catalog, storeId),
    });
    const order = created.json<Order>();
    await ctx.app.inject({
      method: "POST",
      url: "/api/orders/" + order.orderNo + "/pay",
    });

    const confirm = await ctx.app.inject({
      method: "PATCH",
      url: "/api/admin/orders/" + order.orderNo + "/status",
      cookies: { ws_sid: token },
      payload: { status: "confirmed" },
    });
    expect(confirm.statusCode).toBe(200);
    expect(confirm.json<Order>().status).toBe("confirmed");

    const deliver = await ctx.app.inject({
      method: "PATCH",
      url: "/api/admin/orders/" + order.orderNo + "/status",
      cookies: { ws_sid: token },
      payload: { status: "delivered" },
    });
    expect(deliver.statusCode).toBe(200);

    const invalid = await ctx.app.inject({
      method: "PATCH",
      url: "/api/admin/orders/" + order.orderNo + "/status",
      cookies: { ws_sid: token },
      payload: { status: "confirmed" },
    });
    expect(invalid.statusCode).toBe(409);
  });

  it("lists test-drive leads", async () => {
    const token = await loginAdmin();
    const create = await ctx.app.inject({
      method: "POST",
      url: "/api/test-drives",
      payload: {
        name: "线索客户",
        phone: "13800138000",
        modelSlug: "s7",
        storeId,
        slot: "2026-11-20 10:00",
      },
    });
    expect(create.statusCode).toBe(201);
    const leads = await ctx.app.inject({
      method: "GET",
      url: "/api/admin/leads",
      cookies: { ws_sid: token },
    });
    expect(leads.statusCode).toBe(200);
    expect(leads.json<unknown[]>()).toHaveLength(1);
  });

  it("updates trim prices and store contact info", async () => {
    const token = await loginAdmin();
    const modelsResponse = await ctx.app.inject({
      method: "GET",
      url: "/api/admin/models",
      cookies: { ws_sid: token },
    });
    expect(modelsResponse.statusCode).toBe(200);
    const adminModels = modelsResponse.json<Array<{ id: number; trims: Array<{ id: number; price: number }> }>>();
    const trim = adminModels[0]?.trims[0];
    expect(trim).toBeTruthy();

    const patchTrim = await ctx.app.inject({
      method: "PATCH",
      url: "/api/admin/trims/" + trim!.id,
      cookies: { ws_sid: token },
      payload: { price: 31_800_000 },
    });
    expect(patchTrim.statusCode).toBe(200);
    expect(patchTrim.json<{ price: number }>().price).toBe(31_800_000);

    const storesResponse = await ctx.app.inject({
      method: "GET",
      url: "/api/admin/stores",
      cookies: { ws_sid: token },
    });
    expect(storesResponse.statusCode).toBe(200);
    const store = storesResponse.json<Array<{ id: number }>>()[0];
    expect(store).toBeTruthy();
    const patchStore = await ctx.app.inject({
      method: "PATCH",
      url: "/api/admin/stores/" + store!.id,
      cookies: { ws_sid: token },
      payload: { phone: "020-9999 0001" },
    });
    expect(patchStore.statusCode).toBe(200);
    expect(patchStore.json<{ phone: string }>().phone).toBe("020-9999 0001");
  });
});