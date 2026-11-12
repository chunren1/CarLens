import { pathToFileURL } from "node:url";
import { DEFAULT_SETTINGS } from "@wangshu/shared";
import { createDb, closeDb, type AppDb } from "./client";
import {
  appointments,
  configs,
  interiors,
  leads,
  modelOptions,
  models,
  news,
  optionRules,
  orders,
  packages,
  paints,
  payments,
  sessions,
  settings,
  stores,
  trims,
  users,
  wheels,
} from "./schema";
import { loadEnv } from "../env";
import { seedNews } from "./news-seed";
import { hashPassword } from "../auth/password";

interface TrimSeed {
  name: string;
  price: number;
  rangeKm: number;
  zero100: number;
  powerKw: number;
  rank: number;
}

interface ModelSeed {
  slug: string;
  name: string;
  enName: string;
  body: string;
  segment: string;
  priceFrom: number;
  seats: number;
  tagline: string;
  heroImage: string;
  trims: TrimSeed[];
}

/** BYD 演示车型：海豹（运动轿跑）、汉 EV（旗舰轿车），各 3 个版本。 */
export const MODEL_SEED: ModelSeed[] = [
  {
    slug: "r1",
    name: "比亚迪 海豹",
    enName: "BYD SEAL",
    body: "四门轿跑",
    segment: "中型车",
    priceFrom: 17_580_000,
    seats: 5,
    tagline: "海洋美学，后驱驾趣",
    heroImage: "/images/seal-hero.webp",
    trims: [
      { name: "510km 精英型", price: 17_580_000, rangeKm: 510, zero100: 6.5, powerKw: 150, rank: 1 },
      { name: "650km 尊贵型", price: 20_980_000, rangeKm: 650, zero100: 5.9, powerKw: 230, rank: 2 },
      { name: "650km 四驱性能版", price: 23_980_000, rangeKm: 650, zero100: 3.8, powerKw: 390, rank: 3 },
    ],
  },
  {
    slug: "s7",
    name: "比亚迪 汉 EV",
    enName: "BYD HAN EV",
    body: "四门轿车",
    segment: "中大型车",
    priceFrom: 17_980_000,
    seats: 5,
    tagline: "龙颜美学，旗舰轿车",
    heroImage: "/images/han-hero.webp",
    trims: [
      { name: "506km 尊贵型", price: 17_980_000, rangeKm: 506, zero100: 7.9, powerKw: 150, rank: 1 },
      { name: "605km 尊享型", price: 20_980_000, rangeKm: 605, zero100: 7.9, powerKw: 168, rank: 2 },
      { name: "701km 旗舰型", price: 23_980_000, rangeKm: 701, zero100: 7.9, powerKw: 180, rank: 3 },
    ],
  },
];

const PAINT_SEED = [
  { name: "玄空黑", hex: "#0B0D10", price: 0 },
  { name: "雪域白", hex: "#E8E6E1", price: 0 },
  { name: "时光灰", hex: "#7A828C", price: 800_000 },
  { name: "亚特兰蒂斯灰", hex: "#3B4A5A", price: 1_200_000 },
  { name: "极光蓝", hex: "#1B4F8A", price: 1_500_000 },
];

const WHEEL_SEED = [
  { name: "19 英寸轮毂", sizeInch: 19, price: 0, rangeDelta: 0 },
  { name: "20 英寸轮毂", sizeInch: 20, price: 600_000, rangeDelta: -20 },
  { name: "21 英寸锻造轮毂", sizeInch: 21, price: 1_200_000, rangeDelta: -35 },
];

const INTERIOR_SEED = [
  { name: "曜石黑", hex: "#0B0D10", price: 0 },
  { name: "月白", hex: "#E8E6E1", price: 300_000 },
];

const PACKAGE_SEED = [
  { name: "DiPilot 智驾包", price: 1_200_000, description: "高速 NOA、自动泊车与记忆泊车" },
  { name: "舒享包", price: 800_000, description: "前排通风/按摩、方向盘加热、香氛" },
  { name: "云辇-C 底盘包", price: 6_800_000, description: "智能阻尼车身控制系统" },
];

const STORE_SEED = [
  {
    name: "车鉴·广州天河",
    city: "广州",
    address: "天河区珠江新城华夏路 10 号",
    phone: "020-8888 0001",
    hours: "10:00-21:00",
  },
  {
    name: "车鉴·广州白云",
    city: "广州",
    address: "白云区云城东路 8 号",
    phone: "020-8888 0002",
    hours: "10:00-21:00",
  },
  {
    name: "车鉴·深圳南山",
    city: "深圳",
    address: "南山区深南大道 9668 号",
    phone: "0755-8888 0003",
    hours: "10:00-21:00",
  },
  {
    name: "车鉴·上海静安",
    city: "上海",
    address: "静安区南京西路 1266 号",
    phone: "021-8888 0004",
    hours: "10:00-21:00",
  },
];

const WHEEL_RULE_MESSAGE: Record<string, string> = {
  r1: "21 英寸轮毂需搭配四驱性能版",
  s7: "21 英寸轮毂需搭配旗舰型",
};

function resetTables(db: AppDb): void {
  // 按外键依赖逆序清空，保证 seed 可重复执行。
  db.transaction((tx) => {
    tx.delete(payments).run();
    tx.delete(appointments).run();
    tx.delete(leads).run();
    tx.delete(orders).run();
    tx.delete(configs).run();
    tx.delete(optionRules).run();
    tx.delete(modelOptions).run();
    tx.delete(trims).run();
    tx.delete(models).run();
    tx.delete(stores).run();
    tx.delete(packages).run();
    tx.delete(interiors).run();
    tx.delete(wheels).run();
    tx.delete(paints).run();
    tx.delete(sessions).run();
    tx.delete(users).run();
    tx.delete(settings).run();
    tx.delete(news).run();
  });
  // 让自增 id 从 1 重新开始，重复 seed 后数据完全一致。
  db.$client.exec("DELETE FROM sqlite_sequence");
}

/**
 * 写入 Demo v0.1 种子数据，可重复执行（先清空再插入）。
 * 价格单位：分。
 */
export async function seed(db: AppDb): Promise<void> {
  // 生产环境默认拒绝清库；首次初始化或明确重置时必须显式确认。
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DB_RESET !== "1") {
    throw new Error(
      "生产环境禁止直接 seed（会清空订单/线索/用户）。如确需初始化，设置 ALLOW_DB_RESET=1 并先备份。",
    );
  }
  const createdAt = new Date().toISOString();

  resetTables(db);

  // 不再提供固定默认口令；本地/测试/生产都必须显式提供。
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "seed 必须设置 ADMIN_PASSWORD（例如 ADMIN_PASSWORD='...' pnpm --filter @wangshu/api db:seed）",
    );
  }
  const adminPasswordHash = await hashPassword(adminPassword);

  db.transaction((tx) => {
    tx.insert(users)
      .values({
        email: "admin@wangshu.test",
        name: "运营管理员",
        passwordHash: adminPasswordHash,
        role: "admin",
        createdAt,
      })
      .run();

    const modelRows = tx
      .insert(models)
      .values(
        MODEL_SEED.map((model) => ({
          slug: model.slug,
          name: model.name,
          enName: model.enName,
          body: model.body,
          segment: model.segment,
          priceFrom: model.priceFrom,
          seats: model.seats,
          tagline: model.tagline,
          heroImage: model.heroImage,
          createdAt,
        })),
      )
      .returning()
      .all();

    const modelIdBySlug = new Map(modelRows.map((row) => [row.slug, row.id]));
    const trimRows = MODEL_SEED.flatMap((model) => {
      const modelId = modelIdBySlug.get(model.slug);
      if (modelId === undefined) throw new Error(`缺少车型：${model.slug}`);
      return model.trims.map((trim) => ({ modelId, ...trim }));
    });
    tx.insert(trims).values(trimRows).run();

    const paintRows = tx.insert(paints).values(PAINT_SEED).returning().all();
    const wheelRows = tx.insert(wheels).values(WHEEL_SEED).returning().all();
    const interiorRows = tx
      .insert(interiors)
      .values(INTERIOR_SEED)
      .returning()
      .all();
    const packageRows = tx
      .insert(packages)
      .values(PACKAGE_SEED)
      .returning()
      .all();

    const optionRows: Array<{
      modelId: number;
      kind: string;
      optionId: number;
      price: number;
      available: number;
    }> = [];
    for (const modelRow of modelRows) {
      for (const paint of paintRows) {
        optionRows.push({
          modelId: modelRow.id,
          kind: "paint",
          optionId: paint.id,
          price: paint.price,
          available: 1,
        });
      }
      for (const wheel of wheelRows) {
        optionRows.push({
          modelId: modelRow.id,
          kind: "wheel",
          optionId: wheel.id,
          price: wheel.price,
          available: 1,
        });
      }
      for (const interior of interiorRows) {
        optionRows.push({
          modelId: modelRow.id,
          kind: "interior",
          optionId: interior.id,
          price: interior.price,
          available: 1,
        });
      }
      for (const optionPackage of packageRows) {
        optionRows.push({
          modelId: modelRow.id,
          kind: "package",
          optionId: optionPackage.id,
          price: optionPackage.price,
          available: 1,
        });
      }
    }
    tx.insert(modelOptions).values(optionRows).run();

    const wheel21 = wheelRows.find((wheel) => wheel.sizeInch === 21);
    if (!wheel21) throw new Error("种子数据缺少 21 英寸轮毂");
    tx.insert(optionRules)
      .values(
        modelRows.map((modelRow) => ({
          modelId: modelRow.id,
          ifOption: `wheel:${wheel21.id}`,
          requiresOption: null,
          excludesOption: null,
          minTrimRank: 3,
          message:
            WHEEL_RULE_MESSAGE[modelRow.slug] ??
            "21 英寸轮毂需搭配高性能版本",
        })),
      )
      .run();

    tx.insert(stores).values(STORE_SEED).run();
    tx.insert(settings)
      .values(
        Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      )
      .run();
  });

  seedNews(db);
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const env = loadEnv();
  const db = createDb(env.DATABASE_URL);
  try {
    await seed(db);
    const counts = {
      models: db.select().from(models).all().length,
      trims: db.select().from(trims).all().length,
      paints: db.select().from(paints).all().length,
      wheels: db.select().from(wheels).all().length,
      interiors: db.select().from(interiors).all().length,
      packages: db.select().from(packages).all().length,
      stores: db.select().from(stores).all().length,
      rules: db.select().from(optionRules).all().length,
    };
    console.log(`seed 完成：${env.DATABASE_URL}`);
    console.log(JSON.stringify(counts));
  } finally {
    closeDb(db);
  }
}