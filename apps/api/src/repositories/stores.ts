import { asc, eq } from "drizzle-orm";
import type { Store } from "@wangshu/shared";
import type { AppDb } from "../db/client";
import { stores } from "../db/schema";

type StoreRow = typeof stores.$inferSelect;

function toStore(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    address: row.address,
    phone: row.phone,
    hours: row.hours,
  };
}

export function listStores(db: AppDb): Store[] {
  return db
    .select()
    .from(stores)
    .orderBy(asc(stores.id))
    .all()
    .map(toStore);
}

export function findStore(db: AppDb, id: number): Store | null {
  const row = db.select().from(stores).where(eq(stores.id, id)).get();
  return row ? toStore(row) : null;
}
