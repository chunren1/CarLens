import type { FastifyInstance, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../auth/password";
import {
  createSession,
  deleteSession,
  getUserByToken,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  toPublicUser,
} from "../auth/session";
import { users } from "../db/schema";
import { ApiError } from "../errors";

const emailSchema = z.string().trim().toLowerCase().email("邮箱格式不正确").max(120);
const passwordSchema = z.string().min(8, "密码至少 8 位").max(72);
const nameSchema = z.string().trim().min(2, "昵称至少 2 个字符").max(30);

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    // HTTP 演示（未上 TLS）时用 COOKIE_SECURE=false 关闭 Secure，否则浏览器不保存会话。
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE, token, cookieOptions());
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", { config: { rateLimit: { max: 8, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = registerSchema.parse(request.body ?? {});
    const existing = app.db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .get();
    if (existing) {
      throw new ApiError("EMAIL_TAKEN", "该邮箱已注册", 409);
    }

    const passwordHash = await hashPassword(body.password);
    const user = app.db
      .insert(users)
      .values({
        email: body.email,
        name: body.name,
        passwordHash,
        role: "customer",
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get();

    const session = createSession(app.db, user.id);
    setSessionCookie(reply, session.token);
    return reply.code(201).send({ user: toPublicUser(user) });
  });

  app.post("/auth/login", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = loginSchema.parse(request.body ?? {});
    const user = app.db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .get();
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new ApiError("INVALID_CREDENTIALS", "邮箱或密码不正确", 401);
    }

    const session = createSession(app.db, user.id);
    setSessionCookie(reply, session.token);
    return reply.send({ user: toPublicUser(user) });
  });

  app.post("/auth/logout", async (request, reply) => {
    deleteSession(app.db, request.cookies[SESSION_COOKIE]);
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return reply.send({ ok: true });
  });

  app.get("/me", async (request) => {
    const user = getUserByToken(app.db, request.cookies[SESSION_COOKIE]);
    // 访客返回 200 + null，避免每个公开页面都产生一次 401 控制台噪声。
    return { user: user ?? null };
  });
}