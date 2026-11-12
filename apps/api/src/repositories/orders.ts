import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { Order, OrderStatus, QuoteResult } from "@wangshu/shared";
import type { AppDb } from "../db/client";
import { orders, payments } from "../db/schema";
import { ApiError } from "../errors";
import { findStore } from "./stores";

export type OrderRow = typeof orders.$inferSelect;

const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending_payment",
  "paid",
  "confirmed",
  "delivered",
  "cancelled",
];

const SHANGHAI_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function shanghaiDate(date: Date): string {
  const parts = SHANGHAI_DATE.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}${read("month")}${read("day")}`;
}

/**
 * 订单号：WS + Asia/Shanghai 日期（YYYYMMDD）+ 8 位随机十六进制。
 * 4 字节随机数不可由时间或自增 id 猜测；唯一冲突时由 insertOrder 重试。
 */
export function generateOrderNo(now: Date = new Date()): string {
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `WS${shanghaiDate(now)}${suffix}`;
}

export interface NewOrderInput {
  userId?: number | null;
  modelSlug: string;
  storeId: number;
  customerName: string;
  phone: string;
  config: QuoteResult;
  depositAmount: number;
  totalAmount: number;
}

function isOrderNoConflict(error: unknown): boolean {
  if (!(error instanceof Error) || !("code" in error)) return false;
  const code = (error as Error & { code?: unknown }).code;
  return code === "SQLITE_CONSTRAINT_UNIQUE" && error.message.includes("order_no");
}

/** 写入订单；配置以完整报价快照 JSON 落库，金额均为服务端重算结果。 */
export function insertOrder(db: AppDb, input: NewOrderInput): OrderRow {
  const now = new Date();
  const createdAt = now.toISOString();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return db
        .insert(orders)
        .values({
          orderNo: generateOrderNo(now),
          userId: input.userId ?? null,
          modelSlug: input.modelSlug,
          storeId: input.storeId,
          customerName: input.customerName,
          phone: input.phone,
          configJson: JSON.stringify(input.config),
          depositAmount: input.depositAmount,
          totalAmount: input.totalAmount,
          status: "pending_payment",
          createdAt,
          paidAt: null,
        })
        .returning()
        .get();
    } catch (error) {
      if (!isOrderNoConflict(error)) throw error;
    }
  }
  throw new Error("订单号生成冲突，已重试 5 次");
}

export function listOrdersByUser(db: AppDb, userId: number): OrderRow[] {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(orders.createdAt)
    .all()
    .reverse();
}

export function findOrderRow(
  db: AppDb,
  orderNo: string,
): OrderRow | undefined {
  return db.select().from(orders).where(eq(orders.orderNo, orderNo)).get();
}

/**
 * 模拟支付，幂等：
 * - 已支付及之后状态直接返回当前订单，不重复写 payments；
 * - 已取消返回 409；
 * - 只有 pending_payment 会在同一事务内改状态并写一条 payments。
 */
export function payOrder(db: AppDb, orderNo: string): OrderRow {
  const paidAt = new Date().toISOString();
  return db.transaction((tx) => {
    const row = tx
      .select()
      .from(orders)
      .where(eq(orders.orderNo, orderNo))
      .get();
    if (!row) {
      throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
    }
    if (row.status === "cancelled") {
      throw new ApiError("ORDER_NOT_PAYABLE", "订单已取消，无法支付", 409);
    }
    if (row.status !== "pending_payment") {
      return row;
    }

    tx.update(orders)
      .set({ status: "paid", paidAt })
      .where(and(eq(orders.id, row.id), eq(orders.status, "pending_payment")))
      .run();
    tx.insert(payments)
      .values({
        orderId: row.id,
        provider: "mock",
        amount: row.depositAmount,
        status: "succeeded",
        paidAt,
        rawJson: JSON.stringify({ channel: "mock", orderNo: row.orderNo }),
      })
      .run();

    const updated = tx
      .select()
      .from(orders)
      .where(eq(orders.id, row.id))
      .get();
    if (!updated) {
      throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
    }
    return updated;
  });
}

/** 用户取消：只允许待支付；已取消幂等返回。已支付/已确认/已交付需联系门店。 */
export function cancelOrder(db: AppDb, orderNo: string): OrderRow {
  return db.transaction((tx) => {
    const row = tx.select().from(orders).where(eq(orders.orderNo, orderNo)).get();
    if (!row) {
      throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
    }
    if (row.status === "cancelled") return row;
    if (row.status !== "pending_payment") {
      throw new ApiError("ORDER_NOT_CANCELLABLE", "当前状态不可取消，请联系门店", 409);
    }
    tx.update(orders).set({ status: "cancelled" }).where(eq(orders.id, row.id)).run();
    const updated = tx.select().from(orders).where(eq(orders.id, row.id)).get();
    if (!updated) throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
    return updated;
  });
}

function parseOrderStatus(value: string): OrderStatus {
  const status = ORDER_STATUSES.find((candidate) => candidate === value);
  if (!status) throw new Error(`未知订单状态：${value}`);
  return status;
}

/** 把订单行组装成 API 契约里的 Order（含门店与配置快照）。 */
export function toOrderDto(db: AppDb, row: OrderRow): Order {
  const store = findStore(db, row.storeId);
  if (!store) {
    throw new ApiError("STORE_NOT_FOUND", "订单关联的门店不存在", 404);
  }
  return {
    id: row.id,
    orderNo: row.orderNo,
    modelSlug: row.modelSlug,
    customerName: row.customerName,
    phone: row.phone,
    storeId: row.storeId,
    store,
    config: JSON.parse(row.configJson) as QuoteResult,
    deposit: row.depositAmount,
    total: row.totalAmount,
    status: parseOrderStatus(row.status),
    createdAt: row.createdAt,
    paidAt: row.paidAt,
  };
}