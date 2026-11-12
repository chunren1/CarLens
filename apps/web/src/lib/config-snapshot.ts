import type { QuoteInput, QuoteResult } from "@wangshu/shared";

const STORAGE_KEY = "wangshu.config.v1";

/** 配置器保存到 sessionStorage 的快照，报价单 / 下订页读取。 */
export interface ConfigSnapshot {
  version: 1;
  savedAt: string;
  input: QuoteInput;
  quote: QuoteResult;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function isQuoteInput(value: unknown): value is QuoteInput {
  if (!isRecord(value)) return false;
  return (
    typeof value.modelSlug === "string" &&
    typeof value.trimId === "number" &&
    typeof value.paintId === "number" &&
    typeof value.wheelId === "number" &&
    typeof value.interiorId === "number" &&
    isNumberArray(value.packageIds)
  );
}

function isQuoteResult(value: unknown): value is QuoteResult {
  if (!isRecord(value)) return false;
  const model = value.model;
  const trim = value.trim;
  if (!isRecord(model) || typeof model.name !== "string") return false;
  if (!isRecord(trim) || typeof trim.name !== "string") return false;
  return (
    Array.isArray(value.lines) &&
    typeof value.subtotal === "number" &&
    typeof value.tax === "number" &&
    typeof value.insurance === "number" &&
    typeof value.total === "number" &&
    typeof value.deposit === "number"
  );
}

function isSnapshot(value: unknown): value is ConfigSnapshot {
  if (!isRecord(value)) return false;
  return (
    value.version === 1 &&
    typeof value.savedAt === "string" &&
    isQuoteInput(value.input) &&
    isQuoteResult(value.quote)
  );
}

export function saveConfigSnapshot(snapshot: ConfigSnapshot): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

/** 读取失败（无快照 / 数据损坏）时返回 null，页面展示空态。 */
export function readConfigSnapshot(): ConfigSnapshot | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearConfigSnapshot(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
