// ════════════════════════════════════════════════════════════
//  netlify/functions/jobs.ts
//  职位 CRUD API — Supabase 安全代理
//
//  GET    /.netlify/functions/jobs          → 获取已发布职位（公开）
//  GET    /.netlify/functions/jobs?all=1    → 获取全部职位（需认证）
//  POST   /.netlify/functions/jobs          → 创建职位（需认证）
//  PUT    /.netlify/functions/jobs?id=UUID  → 更新职位（需认证）
//  DELETE /.netlify/functions/jobs?id=UUID  → 删除职位（需认证）
//
//  ⚠️ SUPABASE_SERVICE_ROLE_KEY 绝不在前端暴露，
//     仅在此 Serverless Function 的服务器端环境使用
// ════════════════════════════════════════════════════════════
import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import {
  extractTokenFromCookies,
  verifyAdminToken,
} from "../../src/lib/auth";
import type { PositionFormData } from "../../src/types";

// ── Supabase 服务端客户端 ─────────────────────────────────
function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── 公共响应头 ────────────────────────────────────────────
const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_SITE_URL || "https://www.neogiant.com.my",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

// ── 认证中间件 ────────────────────────────────────────────
function requireAuth(event: HandlerEvent): boolean {
  const token = extractTokenFromCookies(event.headers["cookie"] || null);
  if (!token) return false;
  return verifyAdminToken(token) !== null;
}

function unauthorized() {
  return {
    statusCode: 401,
    headers: HEADERS,
    body: JSON.stringify({ success: false, error: "Unauthorized" }),
  };
}

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: HEADERS, body: "" };
  }

  const supabase = getServiceClient();
  const { httpMethod, queryStringParameters, body } = event;
  const id = queryStringParameters?.id;
  const showAll = queryStringParameters?.all === "1";

  try {
    // ════════════════════════
    //  GET — 读取职位
    // ════════════════════════
    if (httpMethod === "GET") {
      if (showAll) {
        // 全部职位 — 需要管理员认证
        if (!requireAuth(event)) return unauthorized();

        const { data, error } = await supabase
          .from("open_positions")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return {
          statusCode: 200,
          headers: HEADERS,
          body: JSON.stringify({ success: true, data }),
        };
      }

      // 公开职位（is_active = true）— 不需要认证
      let query = supabase
        .from("open_positions")
        .select("id, title, department, location, job_type, description, requirements, salary_range, created_at, updated_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      // 支持按部门过滤
      const dept = queryStringParameters?.department;
      if (dept && dept !== "all") {
        query = query.eq("department", dept);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        statusCode: 200,
        headers: {
          ...HEADERS,
          // 缓存 5 分钟（CDN 层）
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
        body: JSON.stringify({ success: true, data }),
      };
    }

    // ════════════════════════
    //  POST — 创建职位（需认证）
    // ════════════════════════
    if (httpMethod === "POST") {
      if (!requireAuth(event)) return unauthorized();

      const payload = JSON.parse(body || "{}") as PositionFormData;
      const validation = validatePositionPayload(payload);
      if (!validation.ok) {
        return {
          statusCode: 400,
          headers: HEADERS,
          body: JSON.stringify({ success: false, error: validation.error }),
        };
      }

      const { data, error } = await supabase
        .from("open_positions")
        .insert([sanitizePayload(payload)])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        headers: HEADERS,
        body: JSON.stringify({ success: true, data }),
      };
    }

    // ════════════════════════
    //  PUT — 更新职位（需认证）
    // ════════════════════════
    if (httpMethod === "PUT") {
      if (!requireAuth(event)) return unauthorized();
      if (!id) {
        return {
          statusCode: 400,
          headers: HEADERS,
          body: JSON.stringify({ success: false, error: "Missing position id" }),
        };
      }

      const payload = JSON.parse(body || "{}") as Partial<PositionFormData>;

      const { data, error } = await supabase
        .from("open_positions")
        .update(sanitizePayload(payload))
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ success: true, data }),
      };
    }

    // ════════════════════════
    //  DELETE — 删除职位（需认证）
    // ════════════════════════
    if (httpMethod === "DELETE") {
      if (!requireAuth(event)) return unauthorized();
      if (!id) {
        return {
          statusCode: 400,
          headers: HEADERS,
          body: JSON.stringify({ success: false, error: "Missing position id" }),
        };
      }

      const { error } = await supabase
        .from("open_positions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ success: true, message: "Position deleted" }),
      };
    }

    return {
      statusCode: 405,
      headers: HEADERS,
      body: JSON.stringify({ success: false, error: "Method not allowed" }),
    };
  } catch (err: any) {
    console.error("[jobs function] Error:", err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
        // 仅开发环境暴露详情
        ...(process.env.NODE_ENV !== "production" && { detail: err.message }),
      }),
    };
  }
};

// ── 输入验证 ──────────────────────────────────────────────
function validatePositionPayload(p: PositionFormData): { ok: boolean; error?: string } {
  if (!p.title?.trim()) return { ok: false, error: "Title is required" };
  if (!p.department)    return { ok: false, error: "Department is required" };
  if (!p.location)      return { ok: false, error: "Location is required" };
  if (!p.job_type)      return { ok: false, error: "Job type is required" };
  if (!p.description?.trim()) return { ok: false, error: "Description is required" };
  if (p.title.length > 120) return { ok: false, error: "Title too long (max 120 chars)" };
  return { ok: true };
}

// ── 清洁/安全化 payload（防止不预期字段写入）────────────
function sanitizePayload(p: Partial<PositionFormData>): Partial<PositionFormData> {
  const allowed: (keyof PositionFormData)[] = [
    "title", "department", "location", "job_type",
    "description", "requirements", "salary_range", "is_active",
  ];
  const result: Partial<PositionFormData> = {};
  for (const key of allowed) {
    if (key in p) (result as any)[key] = (p as any)[key];
  }
  return result;
}

export { handler };
