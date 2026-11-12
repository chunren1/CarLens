import type { FastifyInstance } from "fastify";
import { calculateQuote } from "@wangshu/shared";
import { ApiError } from "../errors";
import { findOptionCatalog } from "../repositories/catalog";
import { getPriceSettings } from "../repositories/settings";
import { quoteInputSchema } from "../schemas/quote";

export async function quoteRoutes(app: FastifyInstance): Promise<void> {
  // 服务端权威：前端只传选项 id，价格与规则全部由 calculateQuote 计算。
  app.post("/quote", async (request) => {
    const input = quoteInputSchema.parse(request.body);
    const catalog = findOptionCatalog(app.db, input.modelSlug);
    if (!catalog) {
      throw new ApiError("MODEL_NOT_FOUND", "车型不存在", 404);
    }
    const settings = getPriceSettings(app.db);
    return calculateQuote(input, catalog, settings);
  });
}
