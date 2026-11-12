import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().min(1).default("0.0.0.0"),
  // 3000 被本机 vibeMusic musicapi 占用，API 固定 3100。
  PORT: z.coerce.number().int().min(1).max(65535).default(3100),
  DATABASE_URL: z.string().min(1).default("./data/wangshu.db"),
});

export type Env = z.infer<typeof envSchema>;

/** 缺 key 直接退出并打印缺哪个，不猜默认值（PORT/DATABASE_URL 的演示默认值除外）。 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("；");
    console.error(`环境变量配置错误：${detail}`);
    process.exit(1);
  }
  return parsed.data;
}
