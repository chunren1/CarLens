import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { news } from "../db/schema";
import { ApiError } from "../errors";

const slugParams = z.object({ slug: z.string().trim().min(1).max(80) });

export async function newsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/news", async () => {
    return app.db
      .select()
      .from(news)
      .where(eq(news.status, "published"))
      .orderBy(news.publishedAt)
      .all()
      .reverse();
  });

  app.get("/news/:slug", async (request) => {
    const { slug } = slugParams.parse(request.params);
    const article = app.db
      .select()
      .from(news)
      .where(eq(news.slug, slug))
      .get();
    if (!article || article.status !== "published") {
      throw new ApiError("NEWS_NOT_FOUND", "文章不存在", 404);
    }
    return article;
  });
}
