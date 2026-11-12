import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { AppDb } from "../db/client";
import { sessions, users } from "../db/schema";

export const SESSION_COOKIE = "ws_sid";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

type UserRow = typeof users.$inferSelect;

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(
  db: AppDb,
  userId: number,
): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.insert(sessions)
    .values({
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      createdAt: new Date().toISOString(),
    })
    .run();
  return { token, expiresAt };
}

export function getUserByToken(db: AppDb, token: string | undefined): PublicUser | null {
  if (!token) return null;
  const row = db
    .select()
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        gt(sessions.expiresAt, new Date().toISOString()),
      ),
    )
    .get();
  return row ? toPublicUser(row.users) : null;
}

export function deleteSession(db: AppDb, token: string | undefined): void {
  if (!token) return;
  db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token))).run();
}
