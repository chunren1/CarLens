import { z } from "zod";

export const quoteInputSchema = z.object({
  modelSlug: z.string().trim().min(1, "车型不能为空"),
  trimId: z.number().int().positive("版本不合法"),
  paintId: z.number().int().positive("车漆不合法"),
  wheelId: z.number().int().positive("轮毂不合法"),
  interiorId: z.number().int().positive("内饰不合法"),
  packageIds: z.array(z.number().int().positive()).max(20).default([]),
});

export type QuoteInputBody = z.infer<typeof quoteInputSchema>;

export const modelSlugParamsSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "车型标识不合法")
    .max(40, "车型标识过长"),
});

export const orderNoParamsSchema = z.object({
  orderNo: z
    .string()
    .regex(/^WS\d{8}[0-9A-F]{8}$/, "订单号格式不正确"),
});

export const createOrderSchema = quoteInputSchema.extend({
  customerName: z.string().trim().min(1, "请填写购车人姓名").max(40, "购车人姓名过长"),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不正确"),
  storeId: z.number().int().positive("门店不合法"),
});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
