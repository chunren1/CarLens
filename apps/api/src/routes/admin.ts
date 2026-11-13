import type { FastifyInstance, FastifyRequest } from "fastify";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getUserByToken, SESSION_COOKIE } from "../auth/session";
import { appointments, leads, modelPaintImages, models, news, orders, paints, payments, stores, trims } from "../db/schema";
import { ApiError } from "../errors";
import { findOrderRow, toOrderDto } from "../repositories/orders";

const statusSchema = z.object({
  status: z.enum(["confirmed", "delivered", "cancelled"]),
});

const allowedTransitions: Record<string, string[]> = {
  pending_payment: ["cancelled"],
  paid: ["confirmed", "cancelled"],
  confirmed: ["delivered"],
  delivered: [],
  cancelled: [],
};

function requireAdmin(app: FastifyInstance, request: FastifyRequest) {
  const user = getUserByToken(app.db, request.cookies[SESSION_COOKIE]);
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "请先登录", 401);
  }
  if (user.role !== "admin") {
    throw new ApiError("FORBIDDEN", "没有后台权限", 403);
  }
  return user;
}

function paintImageRows(app: FastifyInstance) {
  const modelRows = app.db.select().from(models).all();
  const paintRows = app.db.select().from(paints).all();
  const modelById = new Map(modelRows.map((row) => [row.id, row]));
  const paintById = new Map(paintRows.map((row) => [row.id, row]));
  return app.db
    .select()
    .from(modelPaintImages)
    .all()
    .map((row) => {
      const model = modelById.get(row.modelId);
      const paint = paintById.get(row.paintId);
      return {
        id: row.id,
        modelId: row.modelId,
        modelSlug: model?.slug ?? "?",
        modelName: model?.name ?? "?",
        paintId: row.paintId,
        paintName: paint?.name ?? "?",
        imagePath: row.imagePath,
        source: row.source,
        reviewed: row.reviewed,
        createdAt: row.createdAt,
      };
    });
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get("/admin/summary", async (request) => {
    requireAdmin(app, request);
    const orderRows = app.db.select().from(orders).all();
    const byStatus: Record<string, number> = {};
    for (const row of orderRows) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    }
    // 实收口径：只统计 payments 中成功的支付记录（当前为定金），
    // 不能把整车订单总额当收入。
    const revenuePaid = app.db
      .select()
      .from(payments)
      .all()
      .filter((row) => row.status === "succeeded")
      .reduce((sum, row) => sum + row.amount, 0);
    return {
      models: app.db.select().from(models).all().length,
      orders: orderRows.length,
      leads: app.db.select().from(leads).all().length,
      appointments: app.db.select().from(appointments).all().length,
      revenuePaid,
      byStatus,
    };
  });

  app.get("/admin/orders", async (request) => {
    requireAdmin(app, request);
    return app.db
      .select()
      .from(orders)
      .all()
      .reverse()
      .map((row) => toOrderDto(app.db, row));
  });

  app.patch("/admin/orders/:orderNo/status", async (request) => {
    requireAdmin(app, request);
    const { orderNo } = z.object({ orderNo: z.string().min(3).max(40) }).parse(request.params);
    const { status } = statusSchema.parse(request.body ?? {});
    const row = findOrderRow(app.db, orderNo);
    if (!row) {
      throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
    }
    const allowed = allowedTransitions[row.status] ?? [];
    if (!allowed.includes(status)) {
      throw new ApiError("INVALID_TRANSITION", "当前状态不允许该操作", 409);
    }
    app.db.update(orders).set({ status }).where(eq(orders.id, row.id)).run();
    const updated = findOrderRow(app.db, orderNo);
    if (!updated) throw new ApiError("ORDER_NOT_FOUND", "订单不存在", 404);
    return toOrderDto(app.db, updated);
  });

  app.get("/admin/models", async (request) => {
    requireAdmin(app, request);
    const modelRows = app.db.select().from(models).all();
    const trimRows = app.db.select().from(trims).all();
    return modelRows.map((model) => ({
      ...model,
      trims: trimRows.filter((trim) => trim.modelId === model.id),
    }));
  });

  app.patch("/admin/trims/:id", async (request) => {
    requireAdmin(app, request);
    const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const body = z.object({
      price: z.number().int().min(1_000_000).max(500_000_000),
    }).parse(request.body ?? {});
    const trim = app.db.select().from(trims).where(eq(trims.id, id)).get();
    if (!trim) throw new ApiError("TRIM_NOT_FOUND", "版本不存在", 404);
    app.db.update(trims).set({ price: body.price }).where(eq(trims.id, id)).run();
    const nextPrice = Math.min(
      ...app.db.select().from(trims).where(eq(trims.modelId, trim.modelId)).all().map((row) => row.price),
    );
    app.db.update(models).set({ priceFrom: nextPrice }).where(eq(models.id, trim.modelId)).run();
    return app.db.select().from(trims).where(eq(trims.id, id)).get();
  });

  app.get("/admin/stores", async (request) => {
    requireAdmin(app, request);
    return app.db.select().from(stores).all();
  });

  app.patch("/admin/stores/:id", async (request) => {
    requireAdmin(app, request);
    const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const body = z.object({
      address: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().min(5).max(30).optional(),
      hours: z.string().trim().min(2).max(40).optional(),
    }).parse(request.body ?? {});
    const store = app.db.select().from(stores).where(eq(stores.id, id)).get();
    if (!store) throw new ApiError("STORE_NOT_FOUND", "门店不存在", 404);
    if (Object.keys(body).length === 0) {
      throw new ApiError("EMPTY_UPDATE", "没有需要更新的字段", 400);
    }
    app.db.update(stores).set(body).where(eq(stores.id, id)).run();
    return app.db.select().from(stores).where(eq(stores.id, id)).get();
  });

  app.get("/admin/news", async (request) => {
    requireAdmin(app, request);
    return app.db.select().from(news).orderBy(desc(news.publishedAt)).all();
  });

  const newsFields = {
    title: z.string().trim().min(4).max(120),
    tag: z.string().trim().min(1).max(20),
    summary: z.string().trim().min(8).max(300),
    body: z.string().trim().min(10).max(10_000),
    status: z.enum(["published", "draft"]),
    publishedAt: z.string().trim().min(4).max(30),
    slug: z.string().trim().min(3).max(80).optional(),
  };
  const newsSchema = z.object({
    ...newsFields,
    status: newsFields.status.default("published"),
    publishedAt: newsFields.publishedAt.default(new Date().toISOString().slice(0, 10)),
  });
  const newsPatchSchema = z.object(newsFields).partial();

  app.post("/admin/news", async (request, reply) => {
    requireAdmin(app, request);
    const input = newsSchema.parse(request.body ?? {});
    const now = new Date().toISOString();
    const slug = input.slug ?? "news-" + Date.now().toString(36);
    const existing = app.db.select().from(news).where(eq(news.slug, slug)).get();
    if (existing) throw new ApiError("NEWS_SLUG_TAKEN", "文章 slug 已存在", 409);
    const article = app.db
      .insert(news)
      .values({
        slug,
        title: input.title,
        tag: input.tag,
        summary: input.summary,
        body: input.body,
        status: input.status,
        publishedAt: input.publishedAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
    return reply.code(201).send(article);
  });

  app.patch("/admin/news/:id", async (request) => {
    requireAdmin(app, request);
    const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const input = newsPatchSchema.parse(request.body ?? {});
    const article = app.db.select().from(news).where(eq(news.id, id)).get();
    if (!article) throw new ApiError("NEWS_NOT_FOUND", "文章不存在", 404);
    if (Object.keys(input).length === 0) throw new ApiError("EMPTY_UPDATE", "没有需要更新的字段", 400);
    app.db
      .update(news)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(eq(news.id, id))
      .run();
    return app.db.select().from(news).where(eq(news.id, id)).get();
  });

  app.delete("/admin/news/:id", async (request) => {
    requireAdmin(app, request);
    const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const article = app.db.select().from(news).where(eq(news.id, id)).get();
    if (!article) throw new ApiError("NEWS_NOT_FOUND", "文章不存在", 404);
    app.db.delete(news).where(eq(news.id, id)).run();
    return { ok: true };
  });

  app.get("/admin/paint-images", async (request) => {
    requireAdmin(app, request);
    return paintImageRows(app);
  });

  app.patch("/admin/paint-images/:id", async (request) => {
    requireAdmin(app, request);
    const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
    const body = z.object({
      reviewed: z.boolean().optional(),
      imagePath: z.string().startsWith("/images/paints/").max(200).optional(),
    }).parse(request.body ?? {});
    const row = app.db.select().from(modelPaintImages).where(eq(modelPaintImages.id, id)).get();
    if (!row) throw new ApiError("PAINT_IMAGE_NOT_FOUND", "换色图不存在", 404);
    app.db.update(modelPaintImages).set({
      reviewed: body.reviewed === undefined ? row.reviewed : (body.reviewed ? 1 : 0),
      imagePath: body.imagePath ?? row.imagePath,
    }).where(eq(modelPaintImages.id, id)).run();
    return paintImageRows(app).find((item) => item.id === id);
  });

  app.get("/admin/leads", async (request) => {
    requireAdmin(app, request);
    const leadRows = app.db.select().from(leads).all();
    const appointmentRows = app.db.select().from(appointments).all();
    const storeRows = app.db.select().from(stores).all();
    return leadRows
      .map((lead) => {
        const appointment = appointmentRows.find((row) => row.leadId === lead.id);
        const store = storeRows.find((row) => row.id === lead.storeId);
        return {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          city: lead.city,
          storeName: store?.name ?? "—",
          status: lead.status,
          createdAt: lead.createdAt,
          appointment: appointment
            ? { slot: appointment.slot, status: appointment.status }
            : null,
        };
      })
      .reverse();
  });
}