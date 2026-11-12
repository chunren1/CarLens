import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Order, OptionCatalog, Store } from "@wangshu/shared";
import { orders as ordersTable, payments as paymentsTable } from "../src/db/schema";
import {
  buildOrderPayload,
  fetchCatalog,
  openApiContext,
  type ApiTestContext,
} from "./helpers";

let ctx: ApiTestContext;
let catalog: OptionCatalog;
let storeId: number;

beforeEach(async () => {
  ctx = await openApiContext();
  catalog = await fetchCatalog(ctx.app, "s7");
  const storesResponse = await ctx.app.inject({
    method: "GET",
    url: "/api/stores",
  });
  const stores = storesResponse.json<Store[]>();
  expect(stores.length).toBeGreaterThan(0);
  storeId = stores[0]!.id;
});

afterEach(async () => {
  await ctx.close();
});

async function createOrder(idempotencyKey?: string) {
  const response = await ctx.app.inject({
    method: "POST",
    url: "/api/orders",
    headers: idempotencyKey
      ? { "idempotency-key": idempotencyKey }
      : undefined,
    payload: buildOrderPayload(catalog, storeId),
  });
  return response;
}

describe("订单与模拟支付", () => {
  it("creates an unguessable pending_payment order with a server-side snapshot", async () => {
    const response = await createOrder();
    expect(response.statusCode).toBe(201);

    const order = response.json<Order>();
    expect(order.orderNo).toMatch(/^WS\d{8}[0-9A-F]{8}$/);
    expect(order.status).toBe("pending_payment");
    expect(order.deposit).toBe(500_000);
    expect(order.total).toBe(19_316_575);
    expect(order.config.total).toBe(19_316_575);
    expect(order.config.trim.name).toBe("506km 尊贵型");
    expect(order.customerName).toBe("张三");
    expect(order.phone).toBe("13800138000");
    expect(order.store.id).toBe(storeId);
    expect(order.paidAt).toBeNull();
    expect(Number.isNaN(Date.parse(order.createdAt))).toBe(false);

    const rows = ctx.db.select().from(ordersTable).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("pending_payment");
    expect(rows[0]?.totalAmount).toBe(19_316_575);

    const second = await createOrder();
    expect(second.statusCode).toBe(201);
    expect(second.json<Order>().orderNo).not.toBe(order.orderNo);
  });

  it("replays the same idempotency key without creating a second order", async () => {
    const key = "demo-idem-key-20261113";
    const first = await createOrder(key);
    expect(first.statusCode).toBe(201);
    const second = await createOrder(key);
    expect(second.statusCode).toBe(200);
    expect(second.json<Order>().orderNo).toBe(first.json<Order>().orderNo);
    const rows = ctx.db.select().from(ordersTable).all();
    expect(rows).toHaveLength(1);
  });

  it("rejects an idempotency key reused by another phone", async () => {
    const key = "demo-idem-key-conflict";
    const first = await createOrder(key);
    expect(first.statusCode).toBe(201);
    const second = await ctx.app.inject({
      method: "POST",
      url: "/api/orders",
      headers: { "idempotency-key": key },
      payload: { ...buildOrderPayload(catalog, storeId), phone: "13900139000" },
    });
    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });

  it("reads the order by orderNo", async () => {
    const created = (await createOrder()).json<Order>();

    const response = await ctx.app.inject({
      method: "GET",
      url: `/api/orders/${created.orderNo}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<Order>()).toMatchObject({
      id: created.id,
      orderNo: created.orderNo,
      status: "pending_payment",
      total: 19_316_575,
    });
  });

  it("pays once and stays idempotent on repeated pay calls", async () => {
    const created = (await createOrder()).json<Order>();

    const first = await ctx.app.inject({
      method: "POST",
      url: `/api/orders/${created.orderNo}/pay`,
    });
    expect(first.statusCode).toBe(200);
    const paid = first.json<Order>();
    expect(paid.status).toBe("paid");
    expect(paid.paidAt).not.toBeNull();
    expect(Number.isNaN(Date.parse(paid.paidAt ?? ""))).toBe(false);

    const second = await ctx.app.inject({
      method: "POST",
      url: `/api/orders/${created.orderNo}/pay`,
    });
    expect(second.statusCode).toBe(200);
    const repeated = second.json<Order>();
    expect(repeated.status).toBe("paid");
    expect(repeated.paidAt).toBe(paid.paidAt);

    const paymentRows = ctx.db.select().from(paymentsTable).all();
    expect(paymentRows).toHaveLength(1);
    expect(paymentRows[0]).toMatchObject({
      orderId: created.id,
      provider: "mock",
      amount: 500_000,
      status: "succeeded",
    });

    const refreshed = await ctx.app.inject({
      method: "GET",
      url: `/api/orders/${created.orderNo}`,
    });
    expect(refreshed.json<Order>().status).toBe("paid");
  });

  it("rejects an illegal configuration before writing an order", async () => {
    const wheel21 = catalog.wheels.find((wheel) => wheel.sizeInch === 21);
    expect(wheel21).toBeDefined();

    const response = await ctx.app.inject({
      method: "POST",
      url: "/api/orders",
      payload: {
        ...buildOrderPayload(catalog, storeId),
        wheelId: wheel21!.id,
      },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "TRIM_REQUIRED" });
    expect(ctx.db.select().from(ordersTable).all()).toHaveLength(0);
  });

  it("validates phone and store", async () => {
    const badPhone = await ctx.app.inject({
      method: "POST",
      url: "/api/orders",
      payload: {
        ...buildOrderPayload(catalog, storeId),
        phone: "12345",
      },
    });
    expect(badPhone.statusCode).toBe(400);
    expect(badPhone.json()).toMatchObject({ code: "VALIDATION_ERROR" });

    const badStore = await ctx.app.inject({
      method: "POST",
      url: "/api/orders",
      payload: buildOrderPayload(catalog, 999),
    });
    expect(badStore.statusCode).toBe(404);
    expect(badStore.json()).toMatchObject({ code: "STORE_NOT_FOUND" });
    expect(ctx.db.select().from(ordersTable).all()).toHaveLength(0);
  });

  it("returns 404 for unknown orders and 400 for malformed order numbers", async () => {
    const missing = await ctx.app.inject({
      method: "GET",
      url: "/api/orders/WS20260101ABCDEF12",
    });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toMatchObject({ code: "ORDER_NOT_FOUND" });

    const malformed = await ctx.app.inject({
      method: "GET",
      url: "/api/orders/WS123",
    });
    expect(malformed.statusCode).toBe(400);
    expect(malformed.json()).toMatchObject({ code: "VALIDATION_ERROR" });

    const payMissing = await ctx.app.inject({
      method: "POST",
      url: "/api/orders/WS20260101ABCDEF12/pay",
    });
    expect(payMissing.statusCode).toBe(404);
    expect(payMissing.json()).toMatchObject({ code: "ORDER_NOT_FOUND" });
  });

  it("links orders to the logged-in user and lists only their orders", async () => {
    const register = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "order-owner@example.com", password: "password123", name: "下单人" },
    });
    expect(register.statusCode).toBe(201);
    const rawCookie = register.headers["set-cookie"];
    const cookieValue = Array.isArray(rawCookie) ? rawCookie[0] : rawCookie;
    const token = String(cookieValue ?? "").split(";")[0]?.split("=")[1] ?? "";
    expect(token.length).toBeGreaterThan(20);

    const created = await ctx.app.inject({
      method: "POST",
      url: "/api/orders",
      cookies: { ws_sid: token },
      payload: buildOrderPayload(catalog, storeId),
    });
    expect(created.statusCode).toBe(201);

    const mine = await ctx.app.inject({
      method: "GET",
      url: "/api/orders",
      cookies: { ws_sid: token },
    });
    expect(mine.statusCode).toBe(200);
    expect(mine.json<Order[]>()).toHaveLength(1);

    const guest = await ctx.app.inject({ method: "GET", url: "/api/orders" });
    expect(guest.statusCode).toBe(401);
  });

  it("cancels a pending order, is idempotent, and blocks payment", async () => {
    const created = (await createOrder()).json<Order>();
    const cancel = await ctx.app.inject({
      method: "POST",
      url: "/api/orders/" + created.orderNo + "/cancel",
    });
    expect(cancel.statusCode).toBe(200);
    expect(cancel.json<Order>().status).toBe("cancelled");

    const again = await ctx.app.inject({
      method: "POST",
      url: "/api/orders/" + created.orderNo + "/cancel",
    });
    expect(again.statusCode).toBe(200);
    expect(again.json<Order>().status).toBe("cancelled");

    const pay = await ctx.app.inject({
      method: "POST",
      url: "/api/orders/" + created.orderNo + "/pay",
    });
    expect(pay.statusCode).toBe(409);
  });

  it("refuses to cancel a paid order", async () => {
    const created = (await createOrder()).json<Order>();
    await ctx.app.inject({
      method: "POST",
      url: "/api/orders/" + created.orderNo + "/pay",
    });
    const cancel = await ctx.app.inject({
      method: "POST",
      url: "/api/orders/" + created.orderNo + "/cancel",
    });
    expect(cancel.statusCode).toBe(409);
  });
});