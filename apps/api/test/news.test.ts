import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { NewsArticle } from "@wangshu/shared";
import { openApiContext, TEST_ADMIN_PASSWORD, type ApiTestContext } from "./helpers";

let ctx: ApiTestContext;

function tokenFrom(response: { headers: Record<string, unknown> }): string {
  const raw = response.headers["set-cookie"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const first = String(value ?? "").split(";")[0] ?? "";
  return first.slice(first.indexOf("=") + 1);
}

async function loginAdmin(): Promise<string> {
  const response = await ctx.app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "admin@wangshu.test", password: TEST_ADMIN_PASSWORD },
  });
  expect(response.statusCode).toBe(200);
  return tokenFrom(response);
}

beforeEach(async () => {
  ctx = await openApiContext();
});

afterEach(async () => {
  await ctx.close();
});

describe("news", () => {
  it("lists published articles and hides drafts from the public", async () => {
    const list = await ctx.app.inject({ method: "GET", url: "/api/news" });
    expect(list.statusCode).toBe(200);
    expect(list.json<NewsArticle[]>()).toHaveLength(4);

    const detail = await ctx.app.inject({ method: "GET", url: "/api/news/r1-configurator-launch" });
    expect(detail.statusCode).toBe(200);
    expect(detail.json<NewsArticle>().title).toContain("海豹");

    const token = await loginAdmin();
    const create = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/news",
      cookies: { ws_sid: token },
      payload: {
        title: "一篇尚未发布的草稿",
        tag: "产品",
        summary: "这是一篇草稿，公网不应该看到它。",
        body: "草稿正文，至少十个字符。",
        status: "draft",
        publishedAt: "2026-11-13",
      },
    });
    expect(create.statusCode).toBe(201);

    const publicList = await ctx.app.inject({ method: "GET", url: "/api/news" });
    expect(publicList.json<NewsArticle[]>()).toHaveLength(4);
    const draft = create.json<NewsArticle>();
    const hidden = await ctx.app.inject({ method: "GET", url: "/api/news/" + draft.slug });
    expect(hidden.statusCode).toBe(404);

    const patchDraft = await ctx.app.inject({
      method: "PATCH",
      url: "/api/admin/news/" + draft.id,
      cookies: { ws_sid: token },
      payload: { title: "草稿改标题" },
    });
    expect(patchDraft.statusCode).toBe(200);
    expect(patchDraft.json<NewsArticle>().status).toBe("draft");
  });

  it("creates, updates and deletes news in admin", async () => {
    const token = await loginAdmin();
    const create = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/news",
      cookies: { ws_sid: token },
      payload: {
        title: "后台新建的文章",
        tag: "品牌",
        summary: "后台创建的新闻摘要，至少八个字符。",
        body: "后台创建的新闻正文，至少十个字符。",
        status: "published",
        publishedAt: "2026-11-13",
      },
    });
    expect(create.statusCode).toBe(201);
    const article = create.json<NewsArticle>();
    expect(article.slug.startsWith("news-")).toBe(true);

    const update = await ctx.app.inject({
      method: "PATCH",
      url: "/api/admin/news/" + article.id,
      cookies: { ws_sid: token },
      payload: { title: "改过标题的文章" },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json<NewsArticle>().title).toBe("改过标题的文章");

    const remove = await ctx.app.inject({
      method: "DELETE",
      url: "/api/admin/news/" + article.id,
      cookies: { ws_sid: token },
    });
    expect(remove.statusCode).toBe(200);

    const list = await ctx.app.inject({ method: "GET", url: "/api/news" });
    expect(list.json<NewsArticle[]>()).toHaveLength(4);
  });
});