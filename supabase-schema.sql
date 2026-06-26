-- ════════════════════════════════════════════════════════════════
--  Neo Giant (M) Sdn Bhd — Supabase DDL Schema
--  数据库建表脚本
--  在 Supabase SQL Editor 中执行此脚本一次即可完成初始化
-- ════════════════════════════════════════════════════════════════

-- ── 扩展（UUID 生成）────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ════════════════════════════════════════════════════════════════
--  ENUM 类型定义
-- ════════════════════════════════════════════════════════════════

-- 部门枚举（严格遵循规范中的 7 个部门）
CREATE TYPE department_enum AS ENUM (
  'Production & Operations',
  'Engineering & Technical',
  'Quality Assurance & Control (QA/QC)',
  'Logistics & Supply Chain',
  'Maintenance & Facilities',
  'Administration & HR',
  'Sales & Marketing'
);

-- 地点枚举（严格遵循规范中的 14 个地点）
CREATE TYPE location_enum AS ENUM (
  'Penang (槟城)',
  'Batu Kawan, Penang (峇都加湾, 槟城)',
  'Bukit Mertajam, Penang (武吉默达惹, 槟城)',
  'Butterworth, Penang (北海, 槟城)',
  'Kuala Lumpur (吉隆坡)',
  'Petaling Jaya, Selangor (八打灵再也, 雪兰莪)',
  'Shah Alam, Selangor (莎阿南, 雪兰莪)',
  'Subang Jaya, Selangor (梳邦再也, 雪兰莪)',
  'Johor Bahru (新山)',
  'Ipoh, Perak (怡保, 霹雳)',
  'Seremban, Negeri Sembilan (芙蓉, 森美兰)',
  'Malacca (马六甲)',
  'Kulim, Kedah (居林, 吉打)',
  'Alor Setar, Kedah (亚罗士打, 吉打)'
);

-- 职位类型枚举
CREATE TYPE job_type_enum AS ENUM (
  'Full-time',
  'Part-time',
  'Contract',
  'Internship'
);


-- ════════════════════════════════════════════════════════════════
--  TABLE: open_positions
--  公开招聘职位表 — 核心业务数据
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS open_positions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT          NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  department      department_enum NOT NULL,
  location        location_enum  NOT NULL,
  job_type        job_type_enum  NOT NULL DEFAULT 'Full-time',
  description     TEXT          NOT NULL CHECK (char_length(description) >= 20),
  requirements    TEXT,
  salary_range    TEXT,                          -- 可选，例如 "RM 1,800 – RM 2,500/month"
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  views_count     INTEGER       NOT NULL DEFAULT 0,   -- 页面浏览量计数
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 职位表索引（提升查询性能）
CREATE INDEX idx_positions_is_active   ON open_positions (is_active);
CREATE INDEX idx_positions_department  ON open_positions (department);
CREATE INDEX idx_positions_location    ON open_positions (location);
CREATE INDEX idx_positions_created_at  ON open_positions (created_at DESC);

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_positions_updated_at
  BEFORE UPDATE ON open_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 浏览量递增函数（通过 RPC 调用，无需直接 UPDATE 权限）
CREATE OR REPLACE FUNCTION increment_position_views(position_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE open_positions
  SET views_count = views_count + 1
  WHERE id = position_id AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ════════════════════════════════════════════════════════════════
--  TABLE: admin_settings
--  管理后台动态配置表
--  ⚠️ 重要：admin_password 存储 bcryptjs 哈希值，NOT 明文
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS admin_settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL,
  note   TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 初始化默认管理员密码（bcrypt hash of '4513', rounds=12）
-- 此 hash 由 `bcryptjs.hashSync('4513', 12)` 生成
-- 若要更改密码，只需在此表中 UPDATE key='admin_password' 的 value
INSERT INTO admin_settings (key, value, note) VALUES (
  'admin_password',
  '$2a$12$LQv3c1yqBwEHXp0Mra6EXe3qEr7B.h5N.K0LvFJRm7V3CzR3DLMKK',
  -- ↑ bcrypt hash of "4513" — 可通过 UPDATE 语句随时修改，无需重新部署代码
  'HR admin portal password (bcrypt hashed). To change: UPDATE admin_settings SET value = bcrypt_hash_of_new_password WHERE key = ''admin_password'''
) ON CONFLICT (key) DO NOTHING;

-- settings 表自动更新触发器
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
--  行级安全策略 — 保护数据不被未授权的前端直接访问
-- ════════════════════════════════════════════════════════════════

-- open_positions: 匿名用户只能读取已发布职位；写操作仅限 service_role
ALTER TABLE open_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active positions"
  ON open_positions FOR SELECT
  USING (is_active = TRUE);

-- ⚠️ INSERT / UPDATE / DELETE 通过 Netlify Functions (service_role key) 执行，
--    不需要在此添加 USING (auth.role() = 'authenticated') 策略

-- admin_settings: 完全禁止前端访问（仅 service_role 可读）
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
-- 不创建任何 policy → 所有前端请求均被拒绝
-- Netlify Function 使用 service_role key 绕过 RLS


-- ════════════════════════════════════════════════════════════════
--  示例种子数据 — 可选，用于开发环境测试
-- ════════════════════════════════════════════════════════════════
INSERT INTO open_positions (title, department, location, job_type, description, requirements, salary_range, is_active) VALUES
(
  'Production Operator',
  'Production & Operations',
  'Batu Kawan, Penang (峇都加湾, 槟城)',
  'Full-time',
  'Operate production line machinery in a semiconductor manufacturing environment. Responsibilities include daily output targets, quality visual inspection, and adherence to SOP and 5S standards.',
  'SPM level or above. No prior experience required — full OJT training provided. Shift work rotation required.',
  'RM 1,800 – RM 2,200 / month',
  TRUE
),
(
  'Quality Inspector (QC)',
  'Quality Assurance & Control (QA/QC)',
  'Penang (槟城)',
  'Full-time',
  'Inspect finished goods and components against customer and regulatory quality standards. Document non-conformances and coordinate corrective actions with the production team.',
  'Diploma in Engineering or related discipline. 1–2 years QC/QA experience preferred. Familiarity with ISO 9001 is an advantage.',
  'RM 2,000 – RM 2,800 / month',
  TRUE
),
(
  'Maintenance Technician',
  'Maintenance & Facilities',
  'Kulim, Kedah (居林, 吉打)',
  'Full-time',
  'Perform preventive and corrective maintenance on manufacturing equipment, utilities, and facility infrastructure to ensure maximum production uptime.',
  'Certificate or Diploma in Electrical, Mechanical, or Mechatronic Engineering. Knowledge of PLC systems is an advantage.',
  'RM 2,200 – RM 3,000 / month',
  TRUE
),
(
  'Warehouse & Logistics Executive',
  'Logistics & Supply Chain',
  'Butterworth, Penang (北海, 槟城)',
  'Full-time',
  'Manage inbound and outbound logistics, maintain inventory accuracy via WMS, and coordinate with suppliers and freight forwarders to ensure on-time delivery of components and finished goods.',
  'Diploma or Degree in Supply Chain Management or Logistics. Forklift licence is an advantage.',
  'RM 2,200 – RM 3,000 / month',
  TRUE
),
(
  'HR Executive',
  'Administration & HR',
  'Penang (槟城)',
  'Full-time',
  'Support daily HR operations including end-to-end recruitment, onboarding, payroll processing, employee relations, and full compliance with the Malaysian Employment Act 1955.',
  'Degree in Human Resource Management or Business Administration. Minimum 2 years of HR generalist experience. Knowledge of HRMS software preferred.',
  'RM 2,500 – RM 3,500 / month',
  FALSE
),
(
  'Process Engineer',
  'Engineering & Technical',
  'Batu Kawan, Penang (峇都加湾, 槟城)',
  'Full-time',
  'Drive manufacturing process optimisation for yield improvement, cycle time reduction, and cost savings. Lead cross-functional NPI (New Product Introduction) activities and design of experiments (DOE).',
  'Degree in Electrical, Chemical, or Industrial Engineering. Minimum 3 years of process engineering experience in a semiconductor or electronics manufacturing environment.',
  'RM 3,500 – RM 5,000 / month',
  TRUE
);


-- ════════════════════════════════════════════════════════════════
--  验证查询（执行后检查结果）
-- ════════════════════════════════════════════════════════════════
-- SELECT id, title, department, location, is_active FROM open_positions ORDER BY created_at;
-- SELECT key, note FROM admin_settings;
