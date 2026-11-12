import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openApiContext, type ApiTestContext } from "./helpers";

let ctx: ApiTestContext;

beforeEach(async () => {
  ctx = await openApiContext();
});

afterEach(async () => {
  await ctx.close();
});

describe("登录限流", () => {
  it("returns 429 after repeated failed logins", async () => {
    let lastStatus = 0;
    let lastBody: { code?: string } = {};
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await ctx.app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "nobody@example.com", password: "wrong-password" },
      });
      lastStatus = response.statusCode;
      lastBody = response.json<{ code?: string }>();
    }
    expect(lastStatus).toBe(429);
    expect(lastBody.code).toBe("RATE_LIMITED");
  });
});
