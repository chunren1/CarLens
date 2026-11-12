import type { FastifyInstance } from "fastify";
import { ApiError } from "../errors";
import {
  findModelDetail,
  findOptionCatalog,
  listModels,
} from "../repositories/catalog";
import { modelSlugParamsSchema } from "../schemas/quote";

export async function modelRoutes(app: FastifyInstance): Promise<void> {
  app.get("/models", async () => listModels(app.db));

  app.get("/models/:slug", async (request) => {
    const { slug } = modelSlugParamsSchema.parse(request.params);
    const detail = findModelDetail(app.db, slug);
    if (!detail) {
      throw new ApiError("MODEL_NOT_FOUND", "车型不存在", 404);
    }
    return detail;
  });

  app.get("/models/:slug/options", async (request) => {
    const { slug } = modelSlugParamsSchema.parse(request.params);
    const catalog = findOptionCatalog(app.db, slug);
    if (!catalog) {
      throw new ApiError("MODEL_NOT_FOUND", "车型不存在", 404);
    }
    return catalog;
  });
}
