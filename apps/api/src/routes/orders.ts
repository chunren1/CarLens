import type { FastifyInstance } from "fastify";
import { calculateQuote } from "@wangshu/shared";
import { getUserByToken, SESSION_COOKIE } from "../auth/session";
import { ApiError } from "../errors";
import { findOptionCatalog } from "../repositories/catalog";
import {
  cancelOrder,
  findOrderRow,
  insertOrder,
  listOrdersByUser,
  toOrderDto,
} from "../repositories/orders";
import { getPriceSettings } from "../repositories/settings";
import { findStore } from "../repositories/stores";
import { createOrderSchema, orderNoParamsSchema } from "../schemas/quote";

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  app.post("/orders", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (request, reply) => {
    const input = createOrderSchema.parse(request.body);
    const catalog = findOptionCatalog(app.db, input.modelSlug);
    if (!catalog) {
      throw new ApiError("MODEL_NOT_FOUND", "车型不存在", 404);
    }
    if (!findStore(app.db, input.storeId)) {
      throw new ApiError("STORE_NOT_FOUND", "门店不存在", 404);
    }

    // 金额与合法性全部服务端重算，不信任前端传值。
    const quote = calculateQuote(
      {
        modelSlug: input.modelSlug,
        trimId: input.trimId,
        paintId: input.paintId,
        wheelId: input.wheelId,
        interiorId: input.interiorId,
        packageIds: input.packageIds,
      },
      catalog,
      getPriceSettings(app.db),
    );

    const user = getUserByToken(app.db, request.cookies[SESSION_COOKIE]);
    const row = insertOrder(app.db, {
      userId: user?.id ?? null,
      modelSlug: input.modelSlug,
      storeId: input.storeId,
      customerName: input.customerName,
      phone: input.phone,
      config: quote,
      depositAmount: quote.deposit,
      totalAmount: quote.total,
    });
    reply.status(201);
    return toOrderDto(app.db, row);
  });

  app.get("/orders", async (request) => {
    const user = getUserByToken(app.db, request.cookies[SESSION_COOKIE]);
    if (!user) {
      throw new ApiError("UNAUTHORIZED", "请先登录", 401);
    }
    return listOrdersByUser(app.db, user.id).map((row) => toOrderDto(app.db, row));
  });

  app.post("/orders/:orderNo/cancel", async (request) => {
    const { orderNo } = orderNoParamsSchema.parse(request.params);
    const row = findOrderRow(app.db, orderNo);
    if (!row) {
      throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
    }
    const user = getUserByToken(app.db, request.cookies[SESSION_COOKIE]);
    if (row.userId !== null && row.userId !== user?.id) {
      throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
    }
    const cancelled = cancelOrder(app.db, orderNo);
    return toOrderDto(app.db, cancelled);
  });

  app.get("/orders/:orderNo", async (request) => {
    const { orderNo } = orderNoParamsSchema.parse(request.params);
    const row = findOrderRow(app.db, orderNo);
    if (!row) {
      throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
    }
    const user = getUserByToken(app.db, request.cookies[SESSION_COOKIE]);
    if (row.userId !== null && row.userId !== user?.id) {
      throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
    }
    return toOrderDto(app.db, row);
  });
}