export type WheelFinish = "silver" | "black" | "gold";

const FALLBACK: readonly WheelFinish[] = ["silver", "black", "gold"];

/**
 * 轮毂目录不带涂装字段，按名称关键字推断 3D 轮毂材质；
 * 名称无关键字时按序号轮换，保证换轮毂时视觉有变化。
 */
export function wheelFinishFor(name: string, index: number): WheelFinish {
  if (/黑|曜|玄|夜/.test(name)) return "black";
  if (/金|铜|香槟/.test(name)) return "gold";
  if (/银|钛|亮/.test(name)) return "silver";
  const safeIndex = Number.isFinite(index) && index >= 0 ? index : 0;
  return FALLBACK[safeIndex % FALLBACK.length] ?? "silver";
}
