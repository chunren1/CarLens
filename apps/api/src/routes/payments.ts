import type { FastifyInstance } from "fastify";
import { getUserByToken, SESSION_COOKIE } from "../auth/session";
import { ApiError } from "../errors";
import { findOrderRow, payOrder, toOrderDto } from "../repositories/orders";
import { orderNoParamsSchema } from "../schemas/quote";

export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  // 模拟支付：不接商户、不收款；重复调用幂等，不重复写 payments。
  app.post("/orders/:orderNo/pay", async (request) => {
    const { orderNo } = orderNoParamsSchema.parse(request.params);
    const row = findOrderRow(app.db, orderNo);
    if (!row) {
      throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
    }

    // 登录用户只能支付自己的订单；游客订单以订单号作为 bearer token 访问。
    // 统一返回 404，避免向未授权用户泄露订单是否存在。
    if (row.userId !== null) {
      const user = getUserByToken(app.db, request.cookies[SESSION_COOKIE]);
      if (!user || (user.id !== row.userId && user.role !== "admin")) {
        throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
      }
    }

    const paid = payOrder(app.db, orderNo);
    return toOrderDto(app.db, paid);
  });
}
