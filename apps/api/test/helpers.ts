import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import type { OptionCatalog, QuoteInput } from "@wangshu/shared";
import { createApp } from "../src/app";
import { closeDb, createDb, type AppDb } from "../src/db/client";
import { seed } from "../src/db/seed";

export const TEST_ADMIN_PASSWORD = "test-admin-password";

async function withAdminPassword<T>(fn: () => Promise<T>): Promise<T> {
  const previous = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previous;
  }
}

function forceGc(): void {
  const gc = (globalThis as { gc?: () => void }).gc;
  if (gc) gc();
}

export interface TempDatabase {
  db: AppDb;
  close: () => void;
}

/** 每个测试独立临时 SQLite 文件，跑真实迁移，结束删除。 */
export function openTempDatabase(): TempDatabase {
  const directory = mkdtempSync(join(tmpdir(), "wangshu-api-test-"));
  const db = createDb(join(directory, "test.db"));
  return {
    db,
    close: () => {
      closeDb(db);
      rmSync(directory, { recursive: true, force: true });
      forceGc();
    },
  };
}

export interface ApiTestContext {
  app: FastifyInstance;
  db: AppDb;
  close: () => Promise<void>;
}

export async function openApiContext(): Promise<ApiTestContext> {
  const temp = openTempDatabase();
  await withAdminPassword(() => seed(temp.db));
  const app = createApp({ db: temp.db });
  await app.ready();
  return {
    app,
    db: temp.db,
    close: async () => {
      await app.close();
      temp.close();
    },
  };
}

export async function fetchCatalog(
  app: FastifyInstance,
  slug: string,
): Promise<OptionCatalog> {
  const response = await app.inject({
    method: "GET",
    url: `/api/models/${slug}/options`,
  });
  if (response.statusCode !== 200) {
    throw new Error(`读取 ${slug} 选项失败：${response.statusCode}`);
  }
  return response.json<OptionCatalog>();
}

export function buildQuoteInput(
  catalog: OptionCatalog,
  overrides: Partial<QuoteInput> = {},
): QuoteInput {
  const trim = catalog.trims[0];
  const paint = catalog.paints[0];
  const wheel = catalog.wheels[0];
  const interior = catalog.interiors[0];
  if (!trim || !paint || !wheel || !interior) {
    throw new Error("种子数据缺少默认选项");
  }
  return {
    modelSlug: catalog.model.slug,
    trimId: trim.id,
    paintId: paint.id,
    wheelId: wheel.id,
    interiorId: interior.id,
    packageIds: [],
    ...overrides,
  };
}

export function buildOrderPayload(
  catalog: OptionCatalog,
  storeId: number,
): QuoteInput & {
  customerName: string;
  phone: string;
  storeId: number;
} {
  return {
    ...buildQuoteInput(catalog),
    customerName: "张三",
    phone: "13800138000",
    storeId,
  };
}