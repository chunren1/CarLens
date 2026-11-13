import { describe, expect, it } from "vitest";
import {
  calculateQuote,
  DEFAULT_SETTINGS,
  formatCny,
  QuoteError,
  type OptionCatalog,
  type QuoteInput,
} from "../src/index";

const catalog: OptionCatalog = {
  model: {
    id: 1,
    slug: "s7",
    name: "望舒 S7",
    enName: "WANGSHU S7",
    brand: "比亚迪",
    body: "四门轿跑",
    segment: "中大型",
    priceFrom: 26_800_000,
    seats: 5,
    tagline: "为日常驾驶而生",
    heroImage: "/images/s7-hero.webp",
    rangeKm: 701,
    zero100: 3.9,
    wheelInch: 19,
  },
  trims: [
    { id: 11, modelId: 1, name: "标准版", price: 26_800_000, rangeKm: 705, zero100: 5.8, powerKw: 200, rank: 1 },
    { id: 12, modelId: 1, name: "长续航版", price: 29_800_000, rangeKm: 760, zero100: 6.2, powerKw: 230, rank: 2 },
    { id: 13, modelId: 1, name: "性能版", price: 32_800_000, rangeKm: 650, zero100: 4.9, powerKw: 390, rank: 3 },
  ],
  paints: [
    { id: 21, name: "星夜黑", hex: "#0B0D10", price: 0 },
    { id: 22, name: "极地白", hex: "#E8E6E1", price: 0 },
  ],
  wheels: [
    { id: 31, name: "19 英寸", sizeInch: 19, price: 0, rangeDelta: 0 },
    { id: 32, name: "21 英寸", sizeInch: 21, price: 1_200_000, rangeDelta: -35 },
  ],
  interiors: [{ id: 41, name: "曜石黑", hex: "#0B0D10", price: 0 }],
  packages: [],
  rules: [
    {
      id: 51,
      modelId: 1,
      ifOption: "wheel:32",
      minTrimRank: 3,
      message: "21 英寸轮毂需搭配性能版本",
    },
  ],
};

function input(overrides: Partial<QuoteInput> = {}): QuoteInput {
  return {
    modelSlug: "s7",
    trimId: 11,
    paintId: 21,
    wheelId: 31,
    interiorId: 41,
    packageIds: [],
    ...overrides,
  };
}

describe("calculateQuote", () => {
  it("calculates the base S7 price from cents", () => {
    const quote = calculateQuote(input(), catalog);
    expect(quote.subtotal).toBe(26_800_000);
    expect(quote.tax).toBe(1_185_840);
    expect(quote.insurance).toBe(685_000);
    expect(quote.registration).toBe(50_000);
    expect(quote.total).toBe(28_720_840);
    expect(quote.rangeKm).toBe(705);
  });

  it("rejects 21-inch wheels on a non-performance trim", () => {
    expect(() => calculateQuote(input({ wheelId: 32 }), catalog)).toThrow(QuoteError);
  });

  it("allows 21-inch wheels on the performance trim", () => {
    const quote = calculateQuote(input({ trimId: 13, wheelId: 32 }), catalog);
    expect(quote.subtotal).toBe(34_000_000);
    expect(quote.rangeKm).toBe(615);
  });

  it("formats yuan without decimals", () => {
    expect(formatCny(26_800_000)).toContain("268,000");
  });

  it("has a 15,000 yuan relief cap", () => {
    expect(DEFAULT_SETTINGS.reliefCap).toBe(1_500_000);
  });
});
