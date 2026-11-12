import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ModelSummary, OptionCatalog, Trim } from "@wangshu/shared";
import { openApiContext, type ApiTestContext } from "./helpers";

let ctx: ApiTestContext;

beforeEach(async () => {
  ctx = await openApiContext();
});

afterEach(async () => {
  await ctx.close();
});

describe("车型目录 API", () => {
  it("lists the two BYD demo models", async () => {
    const response = await ctx.app.inject({ method: "GET", url: "/api/models" });
    expect(response.statusCode).toBe(200);

    const models = response.json<ModelSummary[]>();
    expect(models).toHaveLength(2);
    expect(models.map((model) => model.slug)).toEqual(["r1", "s7"]);
    expect(models[0]).toMatchObject({
      name: "比亚迪 海豹",
      body: "四门轿跑",
      segment: "中型车",
      priceFrom: 17_580_000,
      seats: 5,
      heroImage: "/images/seal-hero.webp",
    });
    expect(models[1]).toMatchObject({
      name: "比亚迪 汉 EV",
      body: "四门轿车",
      priceFrom: 17_980_000,
      seats: 5,
    });
  });

  it("returns one model with its three trims ordered by rank", async () => {
    const response = await ctx.app.inject({
      method: "GET",
      url: "/api/models/s7",
    });
    expect(response.statusCode).toBe(200);

    const detail = response.json<ModelSummary & { trims: Trim[] }>();
    expect(detail.slug).toBe("s7");
    expect(detail.trims).toHaveLength(3);
    expect(detail.trims.map((trim) => trim.name)).toEqual([
      "506km 尊贵型",
      "605km 尊享型",
      "701km 旗舰型",
    ]);
    expect(detail.trims.map((trim) => trim.price)).toEqual([
      17_980_000, 20_980_000, 23_980_000,
    ]);
    expect(detail.trims.map((trim) => trim.rank)).toEqual([1, 2, 3]);
  });

  it("returns the full option catalog with the 21-inch wheel rule", async () => {
    const response = await ctx.app.inject({
      method: "GET",
      url: "/api/models/s7/options",
    });
    expect(response.statusCode).toBe(200);

    const catalog = response.json<OptionCatalog>();
    expect(catalog.model.slug).toBe("s7");
    expect(catalog.trims).toHaveLength(3);
    expect(catalog.paints).toHaveLength(5);
    expect(catalog.interiors).toHaveLength(2);
    expect(catalog.wheels.map((wheel) => [wheel.sizeInch, wheel.price, wheel.rangeDelta])).toEqual([
      [19, 0, 0],
      [20, 600_000, -20],
      [21, 1_200_000, -35],
    ]);
    expect(catalog.packages.map((item) => [item.name, item.price])).toEqual([
      ["DiPilot 智驾包", 1_200_000],
      ["舒享包", 800_000],
      ["云辇-C 底盘包", 6_800_000],
    ]);

    const wheel21 = catalog.wheels.find((wheel) => wheel.sizeInch === 21);
    expect(wheel21).toBeDefined();
    const rule = catalog.rules.find(
      (candidate) => candidate.ifOption === `wheel:${wheel21?.id}`,
    );
    expect(rule).toMatchObject({
      minTrimRank: 3,
      requiresOption: null,
      excludesOption: null,
    });
    expect(rule?.message).toContain("旗舰型");
  });

  it("returns 404 with the error envelope for an unknown slug", async () => {
    for (const url of ["/api/models/nope", "/api/models/nope/options"]) {
      const response = await ctx.app.inject({ method: "GET", url });
      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        code: "MODEL_NOT_FOUND",
        message: "车型不存在",
      });
    }
  });
});