import type {
  Money,
  OptionCatalog,
  PriceSettings,
  QuoteInput,
  QuoteLine,
  QuoteResult,
} from "./types";

export const DEFAULT_SETTINGS: PriceSettings = {
  taxRate: 0.1,
  taxDivisor: 1.13,
  reliefRate: 0.5,
  reliefCap: 1_500_000,
  insuranceRate: 0.022,
  insuranceBase: 95_000,
  registration: 50_000,
  deposit: 500_000,
};

export class QuoteError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "QuoteError";
    this.code = code;
  }
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function requireById<T extends { id: number }>(
  items: T[],
  id: number,
  label: string,
): T {
  const found = items.find((item) => item.id === id);
  if (!found) {
    throw new QuoteError("OPTION_NOT_FOUND", `${label}不存在或不可选`);
  }
  return found;
}

export function calculateQuote(
  input: QuoteInput,
  catalog: OptionCatalog,
  settings: PriceSettings = DEFAULT_SETTINGS,
): QuoteResult {
  if (catalog.model.slug !== input.modelSlug) {
    throw new QuoteError("MODEL_MISMATCH", "车型与配置不匹配");
  }

  const trim = requireById(catalog.trims, input.trimId, "版本");
  const paint = requireById(catalog.paints, input.paintId, "车漆");
  const wheel = requireById(catalog.wheels, input.wheelId, "轮毂");
  const interior = requireById(catalog.interiors, input.interiorId, "内饰");

  const packageIds = [...new Set(input.packageIds)];
  const packages = packageIds.map((id) =>
    requireById(catalog.packages, id, "选装包"),
  );

  const selected = new Set<string>([
    `paint:${paint.id}`,
    `wheel:${wheel.id}`,
    `interior:${interior.id}`,
    ...packages.map((item) => `package:${item.id}`),
  ]);

  for (const rule of catalog.rules) {
    if (!selected.has(rule.ifOption)) continue;
    if (rule.minTrimRank != null && trim.rank < rule.minTrimRank) {
      throw new QuoteError("TRIM_REQUIRED", rule.message);
    }
    if (rule.requiresOption && !selected.has(rule.requiresOption)) {
      throw new QuoteError("OPTION_REQUIRED", rule.message);
    }
    if (rule.excludesOption && selected.has(rule.excludesOption)) {
      throw new QuoteError("OPTION_CONFLICT", rule.message);
    }
  }

  const lines: QuoteLine[] = [
    { key: "trim", label: trim.name, amount: trim.price },
    { key: "paint", label: paint.name, amount: paint.price },
    { key: "wheel", label: wheel.name, amount: wheel.price },
    { key: "interior", label: interior.name, amount: interior.price },
    ...packages.map((item) => ({
      key: `package:${item.id}`,
      label: item.name,
      amount: item.price,
    })),
  ].filter((line) => line.amount > 0);

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const taxFull = Math.round((subtotal / settings.taxDivisor) * settings.taxRate);
  const taxRelief = Math.min(
    Math.round(taxFull * settings.reliefRate),
    settings.reliefCap,
  );
  const tax = taxFull - taxRelief;
  const insurance = roundTo(
    subtotal * settings.insuranceRate + settings.insuranceBase,
    1_000,
  );
  const registration = settings.registration;
  const total = subtotal + tax + insurance + registration;
  const rangeKm = trim.rangeKm + wheel.rangeDelta;

  return {
    model: catalog.model,
    trim,
    paint,
    wheel,
    interior,
    packages,
    lines,
    subtotal,
    taxFull,
    taxRelief,
    tax,
    insurance,
    registration,
    total,
    rangeKm,
    deposit: settings.deposit,
    warnings: [],
  };
}

export function formatCny(cents: Money): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatWan(cents: Money): string {
  return (cents / 100 / 10_000).toFixed(1);
}
