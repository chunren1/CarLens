import type {
  AdminLead,
  AdminModel,
  AdminPaintImage,
  AdminSummary,
  AdminTrim,
  AuthUser,
  ModelSummary,
  NewsArticle,
  Order,
  OptionCatalog,
  QuoteInput,
  QuoteResult,
  Store,
  TestDriveInput,
  TestDriveResult,
  Trim,
} from "@wangshu/shared";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";

export type ModelDetail = ModelSummary & { trims: Trim[] };

export interface CreateOrderInput extends QuoteInput {
  customerName: string;
  phone: string;
  storeId: number;
}

/** 统一的接口错误：携带服务端 { code, message }。 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function toApiError(response: Response): Promise<ApiError> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  let code = "HTTP_" + response.status;
  let message =
    response.status >= 500
      ? "服务暂时不可用，请稍后重试"
      : "请求未被接受，请检查填写内容";

  if (isRecord(payload)) {
    if (typeof payload.code === "string" && payload.code.length > 0) {
      code = payload.code;
    }
    if (typeof payload.message === "string" && payload.message.length > 0) {
      message = payload.message;
    }
  }

  return new ApiError(code, message, response.status);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(BASE + path, {
      ...init,
      headers,
      credentials: init.credentials ?? "include",
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "无法连接 API 服务，请确认服务已启动后重试",
      0,
    );
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  const text = await response.text();
  if (text.length === 0) {
    throw new ApiError("EMPTY_RESPONSE", "服务返回了空响应", response.status);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("BAD_RESPONSE", "服务返回的数据无法解析", response.status);
  }
}

export const api = {
  listModels: (): Promise<ModelSummary[]> => request<ModelSummary[]>("/models"),
  getModel: (slug: string): Promise<ModelDetail> =>
    request<ModelDetail>("/models/" + encodeURIComponent(slug)),
  getOptions: (slug: string): Promise<OptionCatalog> =>
    request<OptionCatalog>("/models/" + encodeURIComponent(slug) + "/options"),
  createQuote: (input: QuoteInput): Promise<QuoteResult> =>
    request<QuoteResult>("/quote", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  listStores: (city?: string): Promise<Store[]> =>
    request<Store[]>("/stores" + (city ? "?city=" + encodeURIComponent(city) : "")),
  createTestDrive: (input: TestDriveInput): Promise<TestDriveResult> =>
    request<TestDriveResult>("/test-drives", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createOrder: (input: CreateOrderInput, idempotencyKey?: string): Promise<Order> =>
    request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(input),
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    }),
  getOrder: (orderNo: string): Promise<Order> =>
    request<Order>("/orders/" + encodeURIComponent(orderNo)),
  payOrder: (orderNo: string): Promise<Order> =>
    request<Order>("/orders/" + encodeURIComponent(orderNo) + "/pay", {
      method: "POST",
    }),
  cancelOrder: (orderNo: string): Promise<Order> =>
    request<Order>("/orders/" + encodeURIComponent(orderNo) + "/cancel", {
      method: "POST",
    }),
  listOrders: (): Promise<Order[]> => request<Order[]>("/orders"),
  me: (): Promise<{ user: AuthUser | null }> => request<{ user: AuthUser | null }>("/me"),
  login: (email: string, password: string): Promise<{ user: AuthUser }> =>
    request<{ user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (input: { email: string; password: string; name: string }): Promise<{ user: AuthUser }> =>
    request<{ user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  logout: (): Promise<{ ok: boolean }> =>
    request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  adminSummary: (): Promise<AdminSummary> => request<AdminSummary>("/admin/summary"),
  adminOrders: (): Promise<Order[]> => request<Order[]>("/admin/orders"),
  adminLeads: (): Promise<AdminLead[]> => request<AdminLead[]>("/admin/leads"),
  listNews: (): Promise<NewsArticle[]> => request<NewsArticle[]>("/news"),
  getNews: (slug: string): Promise<NewsArticle> =>
    request<NewsArticle>("/news/" + encodeURIComponent(slug)),
  adminNews: (): Promise<NewsArticle[]> => request<NewsArticle[]>("/admin/news"),
  createAdminNews: (input: {
    title: string;
    tag: string;
    summary: string;
    body: string;
    status: string;
    publishedAt: string;
  }): Promise<NewsArticle> =>
    request<NewsArticle>("/admin/news", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateAdminNews: (id: number, patch: Partial<NewsArticle>): Promise<NewsArticle> =>
    request<NewsArticle>("/admin/news/" + id, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteAdminNews: (id: number): Promise<{ ok: boolean }> =>
    request<{ ok: boolean }>("/admin/news/" + id, { method: "DELETE" }),
  adminModels: (): Promise<AdminModel[]> => request<AdminModel[]>("/admin/models"),
  adminStores: (): Promise<Store[]> => request<Store[]>("/admin/stores"),
  adminPaintImages: (): Promise<AdminPaintImage[]> => request<AdminPaintImage[]>("/admin/paint-images"),
  updateAdminPaintImage: (id: number, input: { reviewed?: boolean; imagePath?: string }): Promise<AdminPaintImage> =>
    request<AdminPaintImage>("/admin/paint-images/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  updateAdminTrim: (id: number, price: number): Promise<AdminTrim> =>
    request<AdminTrim>("/admin/trims/" + id, {
      method: "PATCH",
      body: JSON.stringify({ price }),
    }),
  updateAdminStore: (id: number, patch: { address?: string; phone?: string; hours?: string }): Promise<Store> =>
    request<Store>("/admin/stores/" + id, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  updateAdminOrderStatus: (orderNo: string, status: string): Promise<Order> =>
    request<Order>("/admin/orders/" + encodeURIComponent(orderNo) + "/status", {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "发生未知错误，请稍后重试";
}

export function errorCode(error: unknown): string {
  return error instanceof ApiError ? error.code : "";
}