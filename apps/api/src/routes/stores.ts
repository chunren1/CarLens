import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { listStores } from "../repositories/stores";

const storeQuerySchema = z.object({
  city: z.string().trim().min(1).max(20).optional(),
});

export async function storeRoutes(app: FastifyInstance): Promise<void> {
  app.get("/stores", async (request) => {
    const query = storeQuerySchema.parse(request.query ?? {});
    const stores = listStores(app.db);
    return query.city
      ? stores.filter((store) => store.city === query.city)
      : stores;
  });
}
