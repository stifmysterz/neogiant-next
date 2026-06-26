// ════════════════════════════════════════════════════════════
//  src/types/index.ts
//  全局类型定义 — 与 Supabase Schema 严格对应
// ════════════════════════════════════════════════════════════

// ── 部门枚举（与 SQL department_enum 严格一致）────────────
export const DEPARTMENTS = [
  "Production & Operations",
  "Engineering & Technical",
  "Quality Assurance & Control (QA/QC)",
  "Logistics & Supply Chain",
  "Maintenance & Facilities",
  "Administration & HR",
  "Sales & Marketing",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

// ── 地点枚举（与 SQL location_enum 严格一致）─────────────
export const LOCATIONS = [
  "Penang (槟城)",
  "Batu Kawan, Penang (峇都加湾, 槟城)",
  "Bukit Mertajam, Penang (武吉默达惹, 槟城)",
  "Butterworth, Penang (北海, 槟城)",
  "Kuala Lumpur (吉隆坡)",
  "Petaling Jaya, Selangor (八打灵再也, 雪兰莪)",
  "Shah Alam, Selangor (莎阿南, 雪兰莪)",
  "Subang Jaya, Selangor (梳邦再也, 雪兰莪)",
  "Johor Bahru (新山)",
  "Ipoh, Perak (怡保, 霹雳)",
  "Seremban, Negeri Sembilan (芙蓉, 森美兰)",
  "Malacca (马六甲)",
  "Kulim, Kedah (居林, 吉打)",
  "Alor Setar, Kedah (亚罗士打, 吉打)",
] as const;

export type Location = (typeof LOCATIONS)[number];

// ── 职位类型枚举 ──────────────────────────────────────────
export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"] as const;
export type JobType = (typeof JOB_TYPES)[number];

// ── 职位数据模型（对应 open_positions 表）────────────────
export interface OpenPosition {
  id: string;            // UUID
  title: string;
  department: Department;
  location: Location;
  job_type: JobType;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  is_active: boolean;
  views_count: number;
  created_at: string;    // ISO 8601
  updated_at: string;    // ISO 8601
}

// 创建/编辑时的表单数据（不含 id / timestamps / views_count）
export type PositionFormData = Omit<
  OpenPosition,
  "id" | "created_at" | "updated_at" | "views_count"
>;

// ── API 响应通用类型 ──────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── JWT Payload ────────────────────────────────────────────
export interface AdminJwtPayload {
  role: "admin";
  iat: number;
  exp: number;
}

// ── 社交分享数据结构 ──────────────────────────────────────
export interface ShareData {
  url: string;       // 公开职位 URL
  title: string;     // 分享标题
  message: string;   // 预格式化分享文案
}

// ── 过滤器状态（Career 页面）─────────────────────────────
export interface FilterState {
  department: Department | "all";
  location: Location | "all";
  jobType: JobType | "all";
  search: string;
}
