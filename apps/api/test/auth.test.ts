import { describe, expect, it } from "vitest";
import { openApiContext } from "./helpers";
import { eq } from "drizzle-orm";
import { users } from "../src/db/schema";

function sessionCookie(response: { headers: Record<string, unknown> }): string {
  const raw = response.headers["set-cookie"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") throw new Error("缺少 Set-Cookie");
  const first = value.split(";")[0] ?? "";
  const token = first.slice(first.indexOf("=") + 1);
  if (!token) throw new Error("缺少会话 token");
  return token;
}

describe("auth", () => {
  it("registers, sets an httpOnly cookie, and returns the current user", async () => {
    const ctx = await openApiContext();
    try {
      const response = await ctx.app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "buyer@example.com", password: "password123", name: "车主" },
      });
      expect(response.statusCode).toBe(201);
      expect(response.headers["set-cookie"]).toContain("HttpOnly");
      const body = response.json<{ user: { email: string; role: string } }>();
      expect(body.user.email).toBe("buyer@example.com");
      expect(body.user.role).toBe("customer");

      const stored = ctx.db.select().from(users).where(eq(users.email, "buyer@example.com")).get();
      expect(stored?.passwordHash.startsWith("scrypt$")).toBe(true);
      expect(stored?.passwordHash).not.toContain("password123");

      const me = await ctx.app.inject({
        method: "GET",
        url: "/api/me",
        cookies: { ws_sid: sessionCookie(response) },
      });
      expect(me.statusCode).toBe(200);
      expect(me.json<{ user: { name: string } }>().user.name).toBe("车主");
    } finally {
      await ctx.close();
    }
  });

  it("rejects a duplicate email", async () => {
    const ctx = await openApiContext();
    try {
      const payload = { email: "buyer@example.com", password: "password123", name: "车主" };
      expect((await ctx.app.inject({ method: "POST", url: "/api/auth/register", payload })).statusCode).toBe(201);
      expect((await ctx.app.inject({ method: "POST", url: "/api/auth/register", payload })).statusCode).toBe(409);
    } finally {
      await ctx.close();
    }
  });

  it("rejects a wrong password and logs out cleanly", async () => {
    const ctx = await openApiContext();
    try {
      await ctx.app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "buyer@example.com", password: "password123", name: "车主" },
      });
      const wrong = await ctx.app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "buyer@example.com", password: "wrong-password" },
      });
      expect(wrong.statusCode).toBe(401);

      const login = await ctx.app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "buyer@example.com", password: "password123" },
      });
      expect(login.statusCode).toBe(200);
      const token = sessionCookie(login);

      const logout = await ctx.app.inject({
        method: "POST",
        url: "/api/auth/logout",
        cookies: { ws_sid: token },
      });
      expect(logout.statusCode).toBe(200);

      const me = await ctx.app.inject({
        method: "GET",
        url: "/api/me",
        cookies: { ws_sid: token },
      });
      expect(me.statusCode).toBe(401);
    } finally {
      await ctx.close();
    }
  });
});