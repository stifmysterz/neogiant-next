// ════════════════════════════════════════════════════════════
//  src/lib/auth.ts
//  JWT 认证工具函数
//  服务端专用 — 不在客户端 bundle 中暴露
// ════════════════════════════════════════════════════════════
import jwt from "jsonwebtoken";
import type { AdminJwtPayload } from "@/types";

// JWT 密钥 — 必须在 Netlify 环境变量中设置
const JWT_SECRET = process.env.JWT_SECRET!;

// Cookie 名称常量
export const AUTH_COOKIE_NAME = "ng_admin_token";

// JWT 有效期（8 小时）
const TOKEN_EXPIRY = "8h";

/**
 * 生成管理员 JWT Token
 */
export function signAdminToken(): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable not set");

  return jwt.sign(
    { role: "admin" } satisfies Omit<AdminJwtPayload, "iat" | "exp">,
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY, algorithm: "HS256" }
  );
}

/**
 * 验证并解码管理员 JWT Token
 * @returns 解码后的 payload，验证失败返回 null
 */
export function verifyAdminToken(token: string): AdminJwtPayload | null {
  if (!JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as AdminJwtPayload;

    // 额外校验 role 字段（防止 token 被其他系统的 JWT 复用）
    if (decoded.role !== "admin") return null;

    return decoded;
  } catch {
    return null;
  }
}

/**
 * 构建 HTTP-Only Cookie 字符串（Set-Cookie header 值）
 * HTTP-Only = 无法通过 document.cookie / Inspect Element 读取
 * Secure    = 仅通过 HTTPS 传输（生产环境）
 * SameSite  = Lax，防止 CSRF
 */
export function buildAuthCookieHeader(token: string): string {
  const maxAge = 8 * 60 * 60; // 8 小时（秒）
  const isProduction = process.env.NODE_ENV === "production";

  return [
    `${AUTH_COOKIE_NAME}=${token}`,
    `Max-Age=${maxAge}`,
    "Path=/admin",         // 仅 /admin 路径携带此 Cookie
    "HttpOnly",            // ← 关键: 阻止 JS 访问，Inspect Element 无法读取
    "SameSite=Lax",
    isProduction ? "Secure" : "", // 生产环境强制 HTTPS
  ]
    .filter(Boolean)
    .join("; ");
}

/**
 * 构建清除 Cookie 的 header 值（登出时使用）
 */
export function buildClearCookieHeader(): string {
  return `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/admin; HttpOnly; SameSite=Lax`;
}

/**
 * 从 Cookie 字符串中解析 Token
 */
export function extractTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key.trim(), rest.join("=").trim()];
    })
  );

  return cookies[AUTH_COOKIE_NAME] ?? null;
}
