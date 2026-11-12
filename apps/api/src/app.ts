import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { QuoteError } from "@wangshu/shared";
import { ZodError } from "zod";
import type { AppDb } from "./db/client";
import { ApiError, formatZodError } from "./errors";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { modelRoutes } from "./routes/models";
import { newsRoutes } from "./routes/news";
import { orderRoutes } from "./routes/orders";
import { paymentRoutes } from "./routes/payments";
import { quoteRoutes } from "./routes/quote";
import { storeRoutes } from "./routes/stores";
import { testDriveRoutes } from "./routes/test-drives";

declare module "fastify" {
  interface FastifyInstance {
    db: AppDb;
  }
}

export interface CreateAppOptions {
  db: AppDb;
  logger?: boolean;
}

function isValidationError(
  error: unknown,
): error is Error & { validation: unknown } {
  return (
    error instanceof Error &&
    "validation" in error &&
    Boolean((error as Error & { validation?: unknown }).validation)
  );
}

/** 组装 Fastify 实例，便于测试用 inject 直接请求而不监听端口。 */
export function createApp({ db, logger = false }: CreateAppOptions): FastifyInstance {
  const app = Fastify({ logger, bodyLimit: 64 * 1024, trustProxy: true });

  app.decorate("db", db);
  app.register(cookie);
  app.register(rateLimit, {
    global: false,
    errorResponseBuilder: () => ({
      statusCode: 429,
      code: "RATE_LIMITED",
      message: "请求过于频繁，请稍后再试",
    }),
  });

  app.setErrorHandler((error, request, reply) => {
    if ((error as { statusCode?: number }).statusCode === 429) {
      return reply.status(429).send({
        code: "RATE_LIMITED",
        message: "请求过于频繁，请稍后再试",
      });
    }
    if (error instanceof ApiError) {
      return reply
        .status(error.statusCode)
        .send({ code: error.code, message: error.message });
    }
    if (error instanceof QuoteError) {
      // 价格引擎抛出的业务错误：OPTION_NOT_FOUND / TRIM_REQUIRED / OPTION_CONFLICT 等
      return reply.status(400).send({ code: error.code, message: error.message });
    }
    if (error instanceof ZodError) {
      return reply
        .status(400)
        .send({ code: "VALIDATION_ERROR", message: formatZodError(error) });
    }
    if (isValidationError(error)) {
      return reply
        .status(400)
        .send({ code: "VALIDATION_ERROR", message: error.message });
    }
    request.log.error({ err: error }, "unhandled error");
    return reply.status(500).send({
      code: "INTERNAL_ERROR",
      message: "服务器内部错误",
    });
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.status(404).send({ code: "NOT_FOUND", message: "接口不存在" }),
  );

  app.register(healthRoutes, { prefix: "/api" });
  app.register(authRoutes, { prefix: "/api" });
  app.register(adminRoutes, { prefix: "/api" });
  app.register(modelRoutes, { prefix: "/api" });
  app.register(newsRoutes, { prefix: "/api" });
  app.register(quoteRoutes, { prefix: "/api" });
  app.register(storeRoutes, { prefix: "/api" });
  app.register(testDriveRoutes, { prefix: "/api" });
  app.register(orderRoutes, { prefix: "/api" });
  app.register(paymentRoutes, { prefix: "/api" });

  return app;
}