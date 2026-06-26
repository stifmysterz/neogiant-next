// ════════════════════════════════════════════════════════════
//  src/lib/supabase.ts
//  Supabase 客户端 — 公开匿名客户端（前端使用）
//  仅能访问已启用 RLS policy 的数据（已发布职位）
// ════════════════════════════════════════════════════════════
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    "❌ Missing Supabase environment variables. " +
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

// 单例模式 — 避免在 Next.js 热重载时创建多个连接
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false }, // 公开页面不需要持久 session
    });
  }
  return _client;
}

export const supabase = getSupabaseClient();
