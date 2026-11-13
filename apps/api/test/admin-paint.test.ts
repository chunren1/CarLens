import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

describe("admin paint images", () => {
  it("lists paint rows and can unpublish one", async () => {
    const token = await loginAdmin();
    const list = await ctx.app.inject({
      method: "GET",
      url: "/api/admin/paint-images",
      cookies: { ws_sid: token },
    });
    expect(list.statusCode).toBe(200);
    const rows = list.json<Array<{ id: number; reviewed: number; imagePath: string }>>();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.every((row) => row.imagePath.startsWith("/images/paints/"))).toBe(true);
    if (rows.length === 0) return;

    const target = rows[0]!;
    const patch = await ctx.app.inject({
      method: "PATCH",
      url: "/api/admin/paint-images/" + target.id,
      cookies: { ws_sid: token },
      payload: { reviewed: false },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json<{ reviewed: number }>().reviewed).toBe(0);
  });
});
