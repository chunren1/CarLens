import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { appointments, leads, models, stores } from "../db/schema";
import { ApiError } from "../errors";

const phonePattern = /^1[3-9]\d{9}$/;

const testDriveSchema = z.object({
  name: z.string().trim().min(2, "姓名至少 2 个字符").max(30),
  phone: z.string().trim().regex(phonePattern, "手机号格式不正确"),
  modelSlug: z.string().trim().min(1).max(40),
  storeId: z.number().int().positive(),
  slot: z.string().trim().min(5).max(40),
});

export async function testDriveRoutes(app: FastifyInstance): Promise<void> {
  app.post("/test-drives", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = testDriveSchema.parse(request.body ?? {});

    const store = app.db
      .select()
      .from(stores)
      .where(eq(stores.id, body.storeId))
      .get();
    if (!store) {
      throw new ApiError("STORE_NOT_FOUND", "门店不存在", 404);
    }

    const model = app.db
      .select()
      .from(models)
      .where(eq(models.slug, body.modelSlug))
      .get();
    if (!model) {
      throw new ApiError("MODEL_NOT_FOUND", "车型不存在", 404);
    }

    const createdAt = new Date().toISOString();
    const result = app.db.transaction((tx) => {
      const lead = tx
        .insert(leads)
        .values({
          name: body.name,
          phone: body.phone,
          city: store.city,
          storeId: body.storeId,
          status: "new",
          createdAt,
        })
        .returning()
        .get();

      const appointment = tx
        .insert(appointments)
        .values({
          leadId: lead.id,
          storeId: body.storeId,
          slot: body.slot,
          status: "pending",
          createdAt,
        })
        .returning()
        .get();

      return {
        id: appointment.id,
        leadId: lead.id,
        storeId: appointment.storeId,
        slot: appointment.slot,
        status: appointment.status,
        createdAt,
      };
    });

    return reply.code(201).send(result);
  });
}