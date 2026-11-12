import { and, asc, eq } from "drizzle-orm";
import type {
  Interior,
  ModelSummary,
  OptionCatalog,
  OptionRule,
  PackageOption,
  Paint,
  Trim,
  Wheel,
} from "@wangshu/shared";
import type { AppDb } from "../db/client";
import {
  interiors,
  modelOptions,
  models,
  optionRules,
  packages,
  paints,
  trims,
  wheels,
} from "../db/schema";

type ModelRow = typeof models.$inferSelect;
type TrimRow = typeof trims.$inferSelect;
type PaintRow = typeof paints.$inferSelect;
type WheelRow = typeof wheels.$inferSelect;
type InteriorRow = typeof interiors.$inferSelect;
type PackageRow = typeof packages.$inferSelect;
type RuleRow = typeof optionRules.$inferSelect;
type ModelOptionRow = typeof modelOptions.$inferSelect;

export interface ModelDetail extends ModelSummary {
  trims: Trim[];
}

function toModelSummary(row: ModelRow): ModelSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    enName: row.enName,
    body: row.body,
    segment: row.segment,
    priceFrom: row.priceFrom,
    seats: row.seats,
    tagline: row.tagline,
    heroImage: row.heroImage,
  };
}

function toTrim(row: TrimRow): Trim {
  return {
    id: row.id,
    modelId: row.modelId,
    name: row.name,
    price: row.price,
    rangeKm: row.rangeKm,
    zero100: row.zero100,
    powerKw: row.powerKw,
    rank: row.rank,
  };
}

function toOptionRule(row: RuleRow): OptionRule {
  return {
    id: row.id,
    modelId: row.modelId,
    ifOption: row.ifOption,
    requiresOption: row.requiresOption,
    excludesOption: row.excludesOption,
    minTrimRank: row.minTrimRank,
    message: row.message,
  };
}

/** 统计每个 kind 下当前车型可选项，价格以 model_options.price 为准。 */
function pickPaints(
  options: ModelOptionRow[],
  baseById: Map<number, PaintRow>,
): Paint[] {
  return options.flatMap((option) => {
    if (option.kind !== "paint") return [];
    const base = baseById.get(option.optionId);
    return base
      ? [{ id: base.id, name: base.name, hex: base.hex, price: option.price }]
      : [];
  });
}

function pickWheels(
  options: ModelOptionRow[],
  baseById: Map<number, WheelRow>,
): Wheel[] {
  return options.flatMap((option) => {
    if (option.kind !== "wheel") return [];
    const base = baseById.get(option.optionId);
    return base
      ? [
          {
            id: base.id,
            name: base.name,
            sizeInch: base.sizeInch,
            price: option.price,
            rangeDelta: base.rangeDelta,
          },
        ]
      : [];
  });
}

function pickInteriors(
  options: ModelOptionRow[],
  baseById: Map<number, InteriorRow>,
): Interior[] {
  return options.flatMap((option) => {
    if (option.kind !== "interior") return [];
    const base = baseById.get(option.optionId);
    return base
      ? [{ id: base.id, name: base.name, hex: base.hex, price: option.price }]
      : [];
  });
}

function pickPackages(
  options: ModelOptionRow[],
  baseById: Map<number, PackageRow>,
): PackageOption[] {
  return options.flatMap((option) => {
    if (option.kind !== "package") return [];
    const base = baseById.get(option.optionId);
    return base
      ? [
          {
            id: base.id,
            name: base.name,
            price: option.price,
            description: base.description,
          },
        ]
      : [];
  });
}

export function listModels(db: AppDb): ModelSummary[] {
  return db
    .select()
    .from(models)
    .orderBy(asc(models.id))
    .all()
    .map(toModelSummary);
}

export function findModelDetail(
  db: AppDb,
  slug: string,
): ModelDetail | null {
  const modelRow = db
    .select()
    .from(models)
    .where(eq(models.slug, slug))
    .get();
  if (!modelRow) return null;
  const trimRows = db
    .select()
    .from(trims)
    .where(eq(trims.modelId, modelRow.id))
    .orderBy(asc(trims.rank))
    .all();
  return { ...toModelSummary(modelRow), trims: trimRows.map(toTrim) };
}

export function findOptionCatalog(
  db: AppDb,
  slug: string,
): OptionCatalog | null {
  const modelRow = db
    .select()
    .from(models)
    .where(eq(models.slug, slug))
    .get();
  if (!modelRow) return null;

  const trimRows = db
    .select()
    .from(trims)
    .where(eq(trims.modelId, modelRow.id))
    .orderBy(asc(trims.rank))
    .all();
  const optionRows = db
    .select()
    .from(modelOptions)
    .where(
      and(
        eq(modelOptions.modelId, modelRow.id),
        eq(modelOptions.available, 1),
      ),
    )
    .orderBy(asc(modelOptions.id))
    .all();
  const ruleRows = db
    .select()
    .from(optionRules)
    .where(eq(optionRules.modelId, modelRow.id))
    .orderBy(asc(optionRules.id))
    .all();

  const paintsById = new Map(
    db.select().from(paints).all().map((row) => [row.id, row]),
  );
  const wheelsById = new Map(
    db.select().from(wheels).all().map((row) => [row.id, row]),
  );
  const interiorsById = new Map(
    db.select().from(interiors).all().map((row) => [row.id, row]),
  );
  const packagesById = new Map(
    db.select().from(packages).all().map((row) => [row.id, row]),
  );

  return {
    model: toModelSummary(modelRow),
    trims: trimRows.map(toTrim),
    paints: pickPaints(optionRows, paintsById),
    wheels: pickWheels(optionRows, wheelsById),
    interiors: pickInteriors(optionRows, interiorsById),
    packages: pickPackages(optionRows, packagesById),
    rules: ruleRows.map(toOptionRule),
  };
}
