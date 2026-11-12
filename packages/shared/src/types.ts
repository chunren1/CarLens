export type Money = number;

export interface ModelSummary {
  id: number;
  slug: string;
  name: string;
  enName: string;
  body: string;
  segment: string;
  priceFrom: Money;
  seats: number;
  tagline: string;
  heroImage: string;
}

export interface Trim {
  id: number;
  modelId: number;
  name: string;
  price: Money;
  rangeKm: number;
  zero100: number;
  powerKw: number;
  rank: number;
}

export interface Paint {
  id: number;
  name: string;
  hex: string;
  price: Money;
}

export interface Wheel {
  id: number;
  name: string;
  sizeInch: number;
  price: Money;
  rangeDelta: number;
}

export interface Interior {
  id: number;
  name: string;
  hex: string;
  price: Money;
}

export interface PackageOption {
  id: number;
  name: string;
  price: Money;
  description: string;
}

export interface OptionRule {
  id: number;
  modelId: number;
  ifOption: string;
  requiresOption?: string | null;
  excludesOption?: string | null;
  minTrimRank?: number | null;
  message: string;
}

export interface OptionCatalog {
  model: ModelSummary;
  trims: Trim[];
  paints: Paint[];
  wheels: Wheel[];
  interiors: Interior[];
  packages: PackageOption[];
  rules: OptionRule[];
}

export interface QuoteInput {
  modelSlug: string;
  trimId: number;
  paintId: number;
  wheelId: number;
  interiorId: number;
  packageIds: number[];
}

export interface QuoteLine {
  key: string;
  label: string;
  amount: Money;
}

export interface QuoteResult {
  model: ModelSummary;
  trim: Trim;
  paint: Paint;
  wheel: Wheel;
  interior: Interior;
  packages: PackageOption[];
  lines: QuoteLine[];
  subtotal: Money;
  taxFull: Money;
  taxRelief: Money;
  tax: Money;
  insurance: Money;
  registration: Money;
  total: Money;
  rangeKm: number;
  deposit: Money;
  warnings: string[];
}

export interface Store {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string;
  hours: string;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "confirmed"
  | "delivered"
  | "cancelled";

export interface Order {
  id: number;
  orderNo: string;
  modelSlug: string;
  customerName: string;
  phone: string;
  storeId: number;
  store: Store;
  config: QuoteResult;
  deposit: Money;
  total: Money;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
}

export interface PriceSettings {
  taxRate: number;
  taxDivisor: number;
  reliefRate: number;
  reliefCap: Money;
  insuranceRate: number;
  insuranceBase: Money;
  registration: Money;
  deposit: Money;
}

export interface TestDriveInput {
  name: string;
  phone: string;
  modelSlug: string;
  storeId: number;
  slot: string;
}

export interface TestDriveResult {
  id: number;
  leadId: number;
  storeId: number;
  slot: string;
  status: string;
  createdAt: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface AdminSummary {
  models: number;
  orders: number;
  leads: number;
  appointments: number;
  revenuePaid: number;
  byStatus: Record<string, number>;
}

export interface AdminLead {
  id: number;
  name: string;
  phone: string;
  city: string | null;
  storeName: string;
  status: string;
  createdAt: string;
  appointment: { slot: string; status: string } | null;
}

export interface AdminTrim {
  id: number;
  modelId: number;
  name: string;
  price: number;
  rangeKm: number;
  zero100: number;
  powerKw: number;
  rank: number;
}

export interface AdminModel {
  id: number;
  slug: string;
  name: string;
  enName: string;
  body: string;
  segment: string;
  priceFrom: number;
  seats: number;
  trims: AdminTrim[];
}

export interface NewsArticle {
  id: number;
  slug: string;
  title: string;
  tag: string;
  summary: string;
  body: string;
  status: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}
