// ════════════════════════════════════════════════════════════
//  netlify/functions/auth.ts
//  管理员登录认证 Serverless Function
//
//  流程:
//  1. 从 Supabase admin_settings 表读取 bcrypt 密码哈希
//  2. 用 bcryptjs 验证用户输入的密码
//  3. 验证通过 → 签发 JWT → 写入 HTTP-Only Cookie
//  4. 验证失败 → 返回 401，不泄露任何哈希信息
//
//  端点: POST /.netlify/functions/auth
// ════════════════════════════════════════════════════════════
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import {
  signAdminToken,
  buildAuthCookieHeader,
  buildClearCookieHeader,
  extractTokenFromCookies,
  verifyAdminToken,
} from "../../src/lib/auth";

// ── Supabase 服务端客户端（使用 service_role key，绕过 RLS）
function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── CORS 头（仅允许同源请求）────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  process.env.NEXT_PUBLIC_SITE_URL || "https://www.neogiant.com.my",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
  "Content-Type": "application/json",
};

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // ── CORS Preflight ────────────────────────────────────
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  // ── POST /auth — 登录 ─────────────────────────────────
  if (event.httpMethod === "POST") {
    return handleLogin(event);
  }

  // ── DELETE /auth — 登出 ───────────────────────────────
  if (event.httpMethod === "DELETE") {
    return handleLogout();
  }

  // ── GET /auth — 验证当前会话 ──────────────────────────
  if (event.httpMethod === "GET") {
    return handleVerify(event);
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: "Method not allowed" }),
  };
};

// ────────────────────────────────────────────────────────────
//  登录处理
// ────────────────────────────────────────────────────────────
async function handleLogin(event: HandlerEvent) {
  // 1. 解析请求体
  let password: string;
  try {
    const body = JSON.parse(event.body || "{}");
    password = body.password;
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: "Invalid request body" }),
    };
  }

  if (!password || typeof password !== "string" || password.length > 128) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: "Password is required" }),
    };
  }

  // 2. 从 Supabase 读取 bcrypt 哈希
  let storedHash: string;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "admin_password")
      .single();

    if (error || !data?.value) {
      console.error("[auth] Failed to fetch password hash:", error?.message);
      // 不向前端泄露具体原因
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: "Authentication service unavailable" }),
      };
    }

    storedHash = data.value;
  } catch (err) {
    console.error("[auth] Supabase connection error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: "Authentication service unavailable" }),
    };
  }

  // 3. bcryptjs 密码验证
  const isValid = await bcrypt.compare(password, storedHash);

  if (!isValid) {
    // ⚠️ 故意延迟响应（防止时序攻击/暴力破解）
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: "Invalid password" }),
    };
  }

  // 4. 签发 JWT，写入 HTTP-Only Cookie
  const token = signAdminToken();
  const cookieHeader = buildAuthCookieHeader(token);

  return {
    statusCode: 200,
    headers: {
      ...CORS_HEADERS,
      "Set-Cookie": cookieHeader,
    },
    body: JSON.stringify({ success: true, message: "Authenticated" }),
  };
}

// ────────────────────────────────────────────────────────────
//  登出处理（清除 Cookie）
// ────────────────────────────────────────────────────────────
function handleLogout() {
  return {
    statusCode: 200,
    headers: {
      ...CORS_HEADERS,
      "Set-Cookie": buildClearCookieHeader(),
    },
    body: JSON.stringify({ success: true, message: "Logged out" }),
  };
}

// ────────────────────────────────────────────────────────────
//  会话验证（前端页面加载时调用，确认 Cookie 仍有效）
// ────────────────────────────────────────────────────────────
function handleVerify(event: HandlerEvent) {
  const cookieHeader = event.headers["cookie"] || null;
  const token = extractTokenFromCookies(cookieHeader);

  if (!token) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: "Not authenticated" }),
    };
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    return {
      statusCode: 401,
      headers: {
        ...CORS_HEADERS,
        "Set-Cookie": buildClearCookieHeader(), // 清除无效 Cookie
      },
      body: JSON.stringify({ success: false, error: "Session expired" }),
    };
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: true, role: payload.role }),
  };
}

export { handler };
