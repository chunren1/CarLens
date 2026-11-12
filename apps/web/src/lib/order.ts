import type { OrderStatus } from "@wangshu/shared";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "待支付",
  paid: "已支付",
  confirmed: "已确认",
  delivered: "已交付",
  cancelled: "已取消",
};

export type StatusTone = "pending" | "ok" | "muted" | "danger";

export function statusTone(status: OrderStatus): StatusTone {
  switch (status) {
    case "pending_payment":
      return "pending";
    case "paid":
    case "confirmed":
      return "ok";
    case "delivered":
      return "muted";
    case "cancelled":
      return "danger";
  }
}
