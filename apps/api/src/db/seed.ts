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
  brand: string;
  body: string;
  segment: string;
  priceFrom: number;
  seats: number;
  tagline: string;
  heroImage: string;
  rangeKm: number;
  zero100: number;
  wheelInch: number;
  trims: TrimSeed[];
}

/** 多品牌演示车型；价格单位：分。 */
export const MODEL_SEED: ModelSeed[] = [
  {
    slug: "r1",
    name: "比亚迪 海豹",
    enName: "BYD SEAL",
    brand: "比亚迪",
    body: "四门轿跑",
    segment: "中型车",
    priceFrom: 17_580_000,
    seats: 5,
    tagline: "海洋美学，后驱驾趣",
    heroImage: "/images/seal-hero.webp",
    rangeKm: 650,
    zero100: 3.8,
    wheelInch: 19,
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
    brand: "比亚迪",
    body: "四门轿车",
    segment: "中大型车",
    priceFrom: 17_980_000,
    seats: 5,
    tagline: "龙颜美学，旗舰轿车",
    heroImage: "/images/han-hero.webp",
    rangeKm: 701,
    zero100: 7.9,
    wheelInch: 19,
    trims: [
      { name: "506km 尊贵型", price: 17_980_000, rangeKm: 506, zero100: 7.9, powerKw: 150, rank: 1 },
      { name: "605km 尊享型", price: 20_980_000, rangeKm: 605, zero100: 7.9, powerKw: 168, rank: 2 },
      { name: "701km 旗舰型", price: 23_980_000, rangeKm: 701, zero100: 7.9, powerKw: 180, rank: 3 },
    ],
  },
  {
    slug: "tesla-model3",
    name: "特斯拉 Model 3",
    enName: "TESLA MODEL 3",
    brand: "特斯拉",
    body: "四门轿车",
    segment: "中型车",
    priceFrom: 23_550_000,
    seats: 5,
    tagline: "极简设计，纯电驾驶",
    heroImage: "/images/brands/tesla-model3.webp",
    rangeKm: 753,
    zero100: 3.8,
    wheelInch: 18,
    trims: [
      { name: "后轮驱动版", price: 23_550_000, rangeKm: 753, zero100: 6.1, powerKw: 194, rank: 1 },
      { name: "长续航全轮驱动版", price: 27_550_000, rangeKm: 713, zero100: 4.4, powerKw: 331, rank: 2 },
      { name: "高性能全轮驱动版", price: 33_950_000, rangeKm: 623, zero100: 3.1, powerKw: 460, rank: 3 },
    ],
  },
  {
    slug: "tesla-modely",
    name: "特斯拉 Model Y",
    enName: "TESLA MODEL Y",
    brand: "特斯拉",
    body: "五座 SUV",
    segment: "中型 SUV",
    priceFrom: 26_350_000,
    seats: 5,
    tagline: "空间与效率，日常纯电",
    heroImage: "/images/brands/tesla-modely.webp",
    rangeKm: 719,
    zero100: 4.3,
    wheelInch: 19,
    trims: [
      { name: "后轮驱动版", price: 26_350_000, rangeKm: 593, zero100: 5.9, powerKw: 220, rank: 1 },
      { name: "长续航全轮驱动版", price: 31_350_000, rangeKm: 719, zero100: 4.3, powerKw: 331, rank: 2 },
    ],
  },
  {
    slug: "xpeng-p7",
    name: "小鹏 P7+",
    enName: "XPENG P7+",
    brand: "小鹏",
    body: "四门轿跑",
    segment: "中大型车",
    priceFrom: 18_680_000,
    seats: 5,
    tagline: "智能轿跑，空间越级",
    heroImage: "/images/brands/xpeng-p7.webp",
    rangeKm: 725,
    zero100: 5.9,
    wheelInch: 20,
    trims: [
      { name: "615 Max 旗舰版", price: 18_680_000, rangeKm: 615, zero100: 5.9, powerKw: 180, rank: 1 },
      { name: "725 Max 旗舰版", price: 19_880_000, rangeKm: 725, zero100: 5.9, powerKw: 230, rank: 2 },
    ],
  },
  {
    slug: "zeekr-001",
    name: "极氪 001",
    enName: "ZEEKR 001",
    brand: "极氪",
    body: "猎装轿跑",
    segment: "中大型车",
    priceFrom: 26_900_000,
    seats: 5,
    tagline: "猎装姿态，性能旗舰",
    heroImage: "/images/brands/zeekr-001.webp",
    rangeKm: 750,
    zero100: 3.3,
    wheelInch: 21,
    trims: [
      { name: "WE 版", price: 26_900_000, rangeKm: 722, zero100: 6.3, powerKw: 310, rank: 1 },
      { name: "ME 版", price: 29_900_000, rangeKm: 750, zero100: 4.5, powerKw: 400, rank: 2 },
      { name: "YOU 版", price: 32_900_000, rangeKm: 705, zero100: 3.3, powerKw: 580, rank: 3 },
    ],
  },
  {
    slug: "xiaomi-su7",
    name: "小米 SU7",
    enName: "XIAOMI SU7",
    brand: "小米",
    body: "四门轿跑",
    segment: "中大型车",
    priceFrom: 21_590_000,
    seats: 5,
    tagline: "人车家全生态",
    heroImage: "/images/brands/xiaomi-su7.webp",
    rangeKm: 800,
    zero100: 2.78,
    wheelInch: 20,
    trims: [
      { name: "标准版", price: 21_590_000, rangeKm: 700, zero100: 5.28, powerKw: 220, rank: 1 },
      { name: "Pro 版", price: 24_590_000, rangeKm: 830, zero100: 5.7, powerKw: 220, rank: 2 },
      { name: "Max 版", price: 29_990_000, rangeKm: 800, zero100: 2.78, powerKw: 495, rank: 3 },
    ],
  },
  {
    slug: "nio-et5",
    name: "蔚来 ET5",
    enName: "NIO ET5",
    brand: "蔚来",
    body: "四门轿跑",
    segment: "中型车",
    priceFrom: 29_800_000,
    seats: 5,
    tagline: "设计驱动，智能座舱",
    heroImage: "/images/brands/nio-et5.webp",
    rangeKm: 710,
    zero100: 4.0,
    wheelInch: 20,
    trims: [
      { name: "75kWh", price: 29_800_000, rangeKm: 560, zero100: 4.0, powerKw: 360, rank: 1 },
      { name: "100kWh", price: 35_600_000, rangeKm: 710, zero100: 4.0, powerKw: 360, rank: 2 },
    ],
  },
  {
    slug: "li-l6",
    name: "理想 L6",
    enName: "LI L6",
    brand: "理想",
    body: "五座 SUV",
    segment: "中大型 SUV",
    priceFrom: 24_980_000,
    seats: 5,
    tagline: "家庭五座，增程无忧",
    heroImage: "/images/brands/li-l6.webp",
    rangeKm: 1390,
    zero100: 5.4,
    wheelInch: 20,
    trims: [
      { name: "Pro", price: 24_980_000, rangeKm: 1390, zero100: 5.4, powerKw: 330, rank: 1 },
      { name: "Max", price: 27_980_000, rangeKm: 1390, zero100: 5.4, powerKw: 330, rank: 2 },
    ],
  },
  {
    slug: "aito-m7",
    name: "问界 M7",
    enName: "AITO M7",
    brand: "问界",
    body: "六座 SUV",
    segment: "中大型 SUV",
    priceFrom: 31_980_000,
    seats: 6,
    tagline: "华为智驾，六座舒适",
    heroImage: "/images/brands/aito-m7.webp",
    rangeKm: 1300,
    zero100: 4.8,
    wheelInch: 20,
    trims: [
      { name: "增程 Max", price: 31_980_000, rangeKm: 1300, zero100: 4.8, powerKw: 330, rank: 1 },
      { name: "纯电 Max", price: 29_980_000, rangeKm: 700, zero100: 4.8, powerKw: 365, rank: 2 },
    ],
  },
  {
    slug: "leapmotor-c10",
    name: "零跑 C10",
    enName: "LEAPMOTOR C10",
    brand: "零跑",
    body: "五座 SUV",
    segment: "中型 SUV",
    priceFrom: 13_980_000,
    seats: 5,
    tagline: "年轻家庭，越级空间",
    heroImage: "/images/brands/leapmotor-c10.webp",
    rangeKm: 605,
    zero100: 7.5,
    wheelInch: 19,
    trims: [
      { name: "纯电 605", price: 13_980_000, rangeKm: 605, zero100: 7.5, powerKw: 170, rank: 1 },
      { name: "增程 210", price: 12_980_000, rangeKm: 1190, zero100: 7.8, powerKw: 170, rank: 2 },
    ],
  },
  {
    slug: "aion-i60",
    name: "埃安 AION i60",
    enName: "AION i60",
    brand: "埃安",
    body: "五座 SUV",
    segment: "紧凑型 SUV",
    priceFrom: 12_980_000,
    seats: 5,
    tagline: "国民刚需，大五座",
    heroImage: "/images/brands/aion-i60.webp",
    rangeKm: 650,
    zero100: 7.9,
    wheelInch: 19,
    trims: [
      { name: "530 版", price: 12_980_000, rangeKm: 530, zero100: 8.0, powerKw: 150, rank: 1 },
      { name: "650 版", price: 14_980_000, rangeKm: 650, zero100: 7.9, powerKw: 165, rank: 2 },
    ],
  },
  {
    slug: "xpeng-g6",
    name: "小鹏 G6",
    enName: "XPENG G6",
    brand: "小鹏",
    body: "五座 SUV",
    segment: "中型 SUV",
    priceFrom: 17_680_000,
    seats: 5,
    tagline: "800V 快充，智能家用",
    heroImage: "/images/brands/xpeng-g6.webp",
    rangeKm: 725,
    zero100: 6.4,
    wheelInch: 20,
    trims: [
      { name: "625 Max", price: 17_680_000, rangeKm: 625, zero100: 6.4, powerKw: 218, rank: 1 },
      { name: "725 Max", price: 19_880_000, rangeKm: 725, zero100: 6.4, powerKw: 218, rank: 2 },
    ],
  },
  {
    slug: "xpeng-g9",
    name: "小鹏 G9",
    enName: "XPENG G9",
    brand: "小鹏",
    body: "五座 SUV",
    segment: "中大型 SUV",
    priceFrom: 24_880_000,
    seats: 5,
    tagline: "旗舰智能，长途从容",
    heroImage: "/images/brands/xpeng-g9.webp",
    rangeKm: 725,
    zero100: 4.2,
    wheelInch: 21,
    trims: [
      { name: "702 Max", price: 24_880_000, rangeKm: 702, zero100: 6.4, powerKw: 230, rank: 1 },
      { name: "725 Max", price: 27_880_000, rangeKm: 725, zero100: 4.2, powerKw: 405, rank: 2 },
    ],
  },
  {
    slug: "nio-es6",
    name: "蔚来 ES6",
    enName: "NIO ES6",
    brand: "蔚来",
    body: "五座 SUV",
    segment: "中型 SUV",
    priceFrom: 33_800_000,
    seats: 5,
    tagline: "可换电的家庭 SUV",
    heroImage: "/images/brands/nio-es6.webp",
    rangeKm: 625,
    zero100: 4.5,
    wheelInch: 20,
    trims: [
      { name: "75kWh", price: 33_800_000, rangeKm: 490, zero100: 5.9, powerKw: 360, rank: 1 },
      { name: "100kWh", price: 39_600_000, rangeKm: 625, zero100: 4.5, powerKw: 360, rank: 2 },
    ],
  },
  {
    slug: "li-l7",
    name: "理想 L7",
    enName: "LI L7",
    brand: "理想",
    body: "五座 SUV",
    segment: "中大型 SUV",
    priceFrom: 30_180_000,
    seats: 5,
    tagline: "五座旗舰，家庭影院",
    heroImage: "/images/brands/li-l7.webp",
    rangeKm: 1420,
    zero100: 5.3,
    wheelInch: 20,
    trims: [
      { name: "Pro", price: 30_180_000, rangeKm: 1420, zero100: 5.3, powerKw: 330, rank: 1 },
      { name: "Max", price: 34_980_000, rangeKm: 1420, zero100: 5.3, powerKw: 330, rank: 2 },
    ],
  },
  {
    slug: "aito-m5",
    name: "问界 M5",
    enName: "AITO M5",
    brand: "问界",
    body: "五座 SUV",
    segment: "中型 SUV",
    priceFrom: 24_980_000,
    seats: 5,
    tagline: "增程与纯电，双选择",
    heroImage: "/images/brands/aito-m5.webp",
    rangeKm: 1440,
    zero100: 4.5,
    wheelInch: 20,
    trims: [
      { name: "增程 Max", price: 24_980_000, rangeKm: 1440, zero100: 4.5, powerKw: 330, rank: 1 },
      { name: "纯电 Max", price: 26_980_000, rangeKm: 700, zero100: 4.5, powerKw: 365, rank: 2 },
    ],
  },
  {
    slug: "leapmotor-c11",
    name: "零跑 C11",
    enName: "LEAPMOTOR C11",
    brand: "零跑",
    body: "五座 SUV",
    segment: "中型 SUV",
    priceFrom: 14_880_000,
    seats: 5,
    tagline: "越级尺寸，务实家用",
    heroImage: "/images/brands/leapmotor-c11.webp",
    rangeKm: 640,
    zero100: 7.5,
    wheelInch: 19,
    trims: [
      { name: "纯电 640", price: 14_880_000, rangeKm: 640, zero100: 7.5, powerKw: 170, rank: 1 },
      { name: "增程 300", price: 13_880_000, rangeKm: 1210, zero100: 7.8, powerKw: 170, rank: 2 },
    ],
  },
  {
    slug: "xiaomi-yu7",
    name: "小米 YU7",
    enName: "XIAOMI YU7",
    brand: "小米",
    body: "五座 SUV",
    segment: "中大型 SUV",
    priceFrom: 25_350_000,
    seats: 5,
    tagline: "豪华高性能 SUV",
    heroImage: "/images/brands/xiaomi-yu7.webp",
    rangeKm: 835,
    zero100: 3.23,
    wheelInch: 21,
    trims: [
      { name: "后驱版", price: 25_350_000, rangeKm: 835, zero100: 5.88, powerKw: 235, rank: 1 },
      { name: "Max 版", price: 32_990_000, rangeKm: 760, zero100: 3.23, powerKw: 508, rank: 2 },
    ],
  },
  {
    slug: "zeekr-7x",
    name: "极氪 7X",
    enName: "ZEEKR 7X",
    brand: "极氪",
    body: "五座 SUV",
    segment: "中型 SUV",
    priceFrom: 22_990_000,
    seats: 5,
    tagline: "豪华大五座，纯电 SUV",
    heroImage: "/images/brands/zeekr-7x.webp",
    rangeKm: 780,
    zero100: 3.8,
    wheelInch: 20,
    trims: [
      { name: "后驱版", price: 22_990_000, rangeKm: 780, zero100: 5.8, powerKw: 310, rank: 1 },
      { name: "四驱版", price: 26_990_000, rangeKm: 705, zero100: 3.8, powerKw: 475, rank: 2 },
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
  { name: "智驾增强包", price: 1_200_000, description: "高速 NOA、自动泊车与记忆泊车" },
  { name: "舒享套装", price: 800_000, description: "前排通风/按摩、方向盘加热、香氛" },
  { name: "底盘升级包", price: 6_800_000, description: "智能阻尼车身控制系统" },
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
          brand: model.brand,
          body: model.body,
          segment: model.segment,
          priceFrom: model.priceFrom,
          seats: model.seats,
          tagline: model.tagline,
          heroImage: model.heroImage,
          rangeKm: model.rangeKm,
          zero100: model.zero100,
          wheelInch: model.wheelInch,
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