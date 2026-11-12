import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openApiContext, type ApiTestContext } from "./helpers";

let ctx: ApiTestContext;

beforeEach(async () => {
  ctx = await openApiContext();
});

afterEach(async () => {
  await ctx.close();
});

describe("GET /api/health", () => {
  it("returns ok with version and ISO time", async () => {
    const response = await ctx.app.inject({ method: "GET", url: "/api/health" });
    expect(response.statusCode).toBe(200);

    const body = response.json<{
      status: string;
      version: string;
      time: string;
    }>();
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
    expect(Number.isNaN(Date.parse(body.time))).toBe(false);
  });

  it("returns the error envelope for unknown routes", async () => {
    const response = await ctx.app.inject({
      method: "GET",
      url: "/api/nope",
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      code: "NOT_FOUND",
      message: "接口不存在",
    });
  });
});
