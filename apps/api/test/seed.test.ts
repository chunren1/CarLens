import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seed } from "../src/db/seed";
import {
  interiors,
  modelOptions,
  models,
  optionRules,
  packages,
  paints,
  settings,
  stores,
  trims,
  wheels,
} from "../src/db/schema";
import { openTempDatabase, TEST_ADMIN_PASSWORD, type TempDatabase } from "./helpers";

let temp: TempDatabase;

beforeEach(() => {
  process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
  temp = openTempDatabase();
});

afterEach(() => {
  delete process.env.ADMIN_PASSWORD;
  temp.close();
});

function counts(db: TempDatabase["db"]) {
  return {
    models: db.select().from(models).all().length,
    trims: db.select().from(trims).all().length,
    paints: db.select().from(paints).all().length,
    wheels: db.select().from(wheels).all().length,
    interiors: db.select().from(interiors).all().length,
    packages: db.select().from(packages).all().length,
    stores: db.select().from(stores).all().length,
    modelOptions: db.select().from(modelOptions).all().length,
    rules: db.select().from(optionRules).all().length,
    settings: db.select().from(settings).all().length,
  };
}

describe("seed", () => {
  it("writes the Demo v0.1 catalog", async () => {
    await seed(temp.db);
    expect(counts(temp.db)).toEqual({
      models: 12,
      trims: 29,
      paints: 5,
      wheels: 3,
      interiors: 2,
      packages: 3,
      stores: 4,
      modelOptions: 156,
      rules: 12,
      settings: 8,
    });
  });

  it("is repeatable without duplicating rows", async () => {
    await seed(temp.db);
    const first = counts(temp.db);
    await seed(temp.db);
    expect(counts(temp.db)).toEqual(first);

    const slugs = temp.db
      .select()
      .from(models)
      .all()
      .map((row) => row.slug);
    expect(slugs).toEqual([
      "r1",
      "s7",
      "tesla-model3",
      "tesla-modely",
      "xpeng-p7",
      "zeekr-001",
      "xiaomi-su7",
      "nio-et5",
      "li-l6",
      "aito-m7",
      "leapmotor-c10",
      "aion-i60",
    ]);
  });
});