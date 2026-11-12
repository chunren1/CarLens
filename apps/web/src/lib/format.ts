import { formatCny } from "@wangshu/shared";

/** 金额：分 -> ¥268,000 */
export function money(cents: number): string {
  return formatCny(cents);
}

/** 选装加价：0 元显示「标配」 */
export function priceSuffix(cents: number): string {
  return cents > 0 ? "+" + formatCny(cents) : "标配";
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function maskPhone(phone: string): string {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}
