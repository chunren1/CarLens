import type { ZodError } from "zod";

/** 业务错误：code 供前端判别，statusCode 决定 HTTP 状态。 */
export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function formatZodError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "请求参数不合法";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
