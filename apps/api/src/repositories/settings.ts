import { DEFAULT_SETTINGS, type PriceSettings } from "@wangshu/shared";
import type { AppDb } from "../db/client";
import { settings } from "../db/schema";

/**
 * 读取价格参数。settings 表缺失的 key 回退到共享默认值，
 * 值不是数字时直接报错（配置错误不应悄悄按 0 处理）。
 */
export function getPriceSettings(db: AppDb): PriceSettings {
  const rows = db.select().from(settings).all();
  const values = new Map(rows.map((row) => [row.key, row.value]));

  const readNumber = (key: keyof PriceSettings): number => {
    const raw = values.get(key);
    if (raw === undefined) return DEFAULT_SETTINGS[key];
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      throw new Error(`settings.${key} 不是合法数字：${raw}`);
    }
    return parsed;
  };

  return {
    taxRate: readNumber("taxRate"),
    taxDivisor: readNumber("taxDivisor"),
    reliefRate: readNumber("reliefRate"),
    reliefCap: readNumber("reliefCap"),
    insuranceRate: readNumber("insuranceRate"),
    insuranceBase: readNumber("insuranceBase"),
    registration: readNumber("registration"),
    deposit: readNumber("deposit"),
  };
}
