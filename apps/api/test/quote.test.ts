import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { OptionCatalog, QuoteResult } from "@wangshu/shared";
import {
  buildQuoteInput,
  fetchCatalog,
  openApiContext,
  type ApiTestContext,
} from "./helpers";

let ctx: ApiTestContext;
let catalog: OptionCatalog;

beforeEach(async () => {
  ctx = await openApiContext();
  catalog = await fetchCatalog(ctx.app, "s7");
});

afterEach(async () => {
  await ctx.close();
});

describe("POST /api/quote", () => {
  it("computes the base Han EV quote server-side (19316575 cents)", async () => {
    const response = await ctx.app.inject({
      method: "POST",
      url: "/api/quote",
      payload: buildQuoteInput(catalog),
    });
    expect(response.statusCode).toBe(200);

    const quote = response.json<QuoteResult>();
    expect(quote.subtotal).toBe(17_980_000);
    expect(quote.taxFull).toBe(1_591_150);
    expect(quote.taxRelief).toBe(795_575);
    expect(quote.tax).toBe(795_575);
    expect(quote.insurance).toBe(491_000);
    expect(quote.registration).toBe(50_000);
    expect(quote.total).toBe(19_316_575);
    expect(quote.rangeKm).toBe(506);
    expect(quote.deposit).toBe(500_000);
    expect(quote.lines[0]).toEqual({
      key: "trim",
      label: "506km 尊贵型",
      amount: 17_980_000,
    });
  });

  it("adds package price once and dedupes repeated package ids", async () => {
    const packageItem = catalog.packages.find((item) => item.name === "智驾增强包");
    expect(packageItem).toBeDefined();
    const payload = buildQuoteInput(catalog, {
      packageIds: [packageItem!.id, packageItem!.id],
    });

    const response = await ctx.app.inject({
      method: "POST",
      url: "/api/quote",
      payload,
    });
    expect(response.statusCode).toBe(200);

    const quote = response.json<QuoteResult>();
    expect(quote.subtotal).toBe(19_180_000);
    expect(quote.total).toBe(20_595_672);
    expect(quote.packages).toHaveLength(1);
    expect(quote.lines.filter((line) => line.key.startsWith("package:"))).toHaveLength(1);
  });

  it("rejects the 21-inch wheel on a rank-1 trim with 400 TRIM_REQUIRED", async () => {
    const wheel21 = catalog.wheels.find((wheel) => wheel.sizeInch === 21);
    expect(wheel21).toBeDefined();

    const response = await ctx.app.inject({
      method: "POST",
      url: "/api/quote",
      payload: buildQuoteInput(catalog, { wheelId: wheel21!.id }),
    });
    expect(response.statusCode).toBe(400);
    const body = response.json<{ code: string; message: string }>();
    expect(body.code).toBe("TRIM_REQUIRED");
    expect(body.message).toContain("旗舰型");
  });

  it("allows the 21-inch wheel on the performance trim", async () => {
    const wheel21 = catalog.wheels.find((wheel) => wheel.sizeInch === 21);
    const performance = catalog.trims.find((trim) => trim.rank === 3);
    expect(wheel21).toBeDefined();
    expect(performance).toBeDefined();

    const response = await ctx.app.inject({
      method: "POST",
      url: "/api/quote",
      payload: buildQuoteInput(catalog, {
        trimId: performance!.id,
        wheelId: wheel21!.id,
      }),
    });
    expect(response.statusCode).toBe(200);

    const quote = response.json<QuoteResult>();
    expect(quote.subtotal).toBe(25_180_000);
    expect(quote.total).toBe(26_993_159);
    expect(quote.rangeKm).toBe(666);
  });

  it("returns 400 OPTION_NOT_FOUND for an option of another model", async () => {
    const r1 = await fetchCatalog(ctx.app, "r1");
    const r1Only = r1.trims[0];
    expect(r1Only).toBeDefined();

    const response = await ctx.app.inject({
      method: "POST",
      url: "/api/quote",
      payload: buildQuoteInput(catalog, { trimId: r1Only!.id }),
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "OPTION_NOT_FOUND" });
  });

  it("returns 400 VALIDATION_ERROR for an invalid body", async () => {
    const response = await ctx.app.inject({
      method: "POST",
      url: "/api/quote",
      payload: { ...buildQuoteInput(catalog), trimId: -1 },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("returns 404 MODEL_NOT_FOUND for an unknown model", async () => {
    const response = await ctx.app.inject({
      method: "POST",
      url: "/api/quote",
      payload: { ...buildQuoteInput(catalog), modelSlug: "nope" },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "MODEL_NOT_FOUND" });
  });
});