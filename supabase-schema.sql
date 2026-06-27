-- ============================================================
--  Neo Giant (M) Sdn Bhd — Supabase DDL
--  Run this ONCE in Supabase SQL Editor to initialise the DB.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE department_enum AS ENUM (
  'Production & Operations',
  'Engineering & Technical',
  'Quality Assurance & Control (QA/QC)',
  'Logistics & Supply Chain',
  'Maintenance & Facilities',
  'Administration & HR',
  'Sales & Marketing'
);

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

CREATE TYPE job_type_enum AS ENUM (
  'Full-time',
  'Part-time',
  'Contract',
  'Internship'
);

-- ── TABLES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS open_positions (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT          NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  department   department_enum NOT NULL,
  location     location_enum   NOT NULL,
  job_type     job_type_enum   NOT NULL DEFAULT 'Full-time',
  description  TEXT          NOT NULL CHECK (char_length(description) >= 20),
  requirements TEXT,
  salary_range TEXT,
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  views_count  INTEGER       NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_positions_is_active  ON open_positions (is_active);
CREATE INDEX idx_positions_department ON open_positions (department);
CREATE INDEX idx_positions_location   ON open_positions (location);
CREATE INDEX idx_positions_created_at ON open_positions (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_positions_updated_at
  BEFORE UPDATE ON open_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── ADMIN SETTINGS (password stored as bcrypt hash) ──────────
CREATE TABLE IF NOT EXISTS admin_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  note       TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default password = "4513"  (bcrypt hash, rounds=12)
-- To change password: UPDATE admin_settings SET value = '<new_bcrypt_hash>' WHERE key = 'admin_password';
INSERT INTO admin_settings (key, value, note) VALUES (
  'admin_password',
  '$2a$12$LQv3c1yqBwEHXp0Mra6EXe3qEr7B.h5N.K0LvFJRm7V3CzR3DLMKK',
  'bcrypt hash of default password 4513. Replace hash to change password without redeploying.'
) ON CONFLICT (key) DO NOTHING;

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE open_positions ENABLE ROW LEVEL SECURITY;

-- Public can only read active positions
CREATE POLICY "Public read active positions"
  ON open_positions FOR SELECT USING (is_active = TRUE);

-- admin_settings is fully locked to the frontend
-- Netlify Functions use service_role key which bypasses RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- ── SEED DATA ─────────────────────────────────────────────────
INSERT INTO open_positions (title, department, location, job_type, description, requirements, salary_range, is_active) VALUES
('Production Operator', 'Production & Operations', 'Batu Kawan, Penang (峇都加湾, 槟城)', 'Full-time',
 'Operate production line machinery in a semiconductor manufacturing environment. Responsible for daily output targets, quality visual inspection, and adherence to SOP and 5S standards.',
 'SPM level or above. No prior experience required — full OJT training provided. Willing to do shift rotation.',
 'RM 1,800 – RM 2,200 / month', TRUE),

('Quality Inspector (QC)', 'Quality Assurance & Control (QA/QC)', 'Penang (槟城)', 'Full-time',
 'Inspect finished goods and components against customer and regulatory quality standards. Document non-conformances and coordinate corrective actions with the production team.',
 'Diploma in Engineering or related discipline. 1–2 years QC/QA experience preferred.',
 'RM 2,000 – RM 2,800 / month', TRUE),

('Maintenance Technician', 'Maintenance & Facilities', 'Kulim, Kedah (居林, 吉打)', 'Full-time',
 'Perform preventive and corrective maintenance on manufacturing equipment and facilities to ensure maximum production uptime.',
 'Certificate or Diploma in Electrical, Mechanical, or Mechatronic Engineering.',
 'RM 2,200 – RM 3,000 / month', TRUE),

('Warehouse & Logistics Executive', 'Logistics & Supply Chain', 'Butterworth, Penang (北海, 槟城)', 'Full-time',
 'Manage inbound and outbound logistics, maintain inventory accuracy, and coordinate with suppliers and freight forwarders.',
 'Diploma or Degree in Supply Chain Management or Logistics. Forklift licence is an advantage.',
 'RM 2,200 – RM 3,000 / month', TRUE),

('HR Executive', 'Administration & HR', 'Penang (槟城)', 'Full-time',
 'Support daily HR operations including recruitment, onboarding, payroll processing, and compliance with the Malaysian Employment Act 1955.',
 'Degree in Human Resource Management or Business Administration. Minimum 2 years HR generalist experience.',
 'RM 2,500 – RM 3,500 / month', FALSE),

('Process Engineer', 'Engineering & Technical', 'Batu Kawan, Penang (峇都加湾, 槟城)', 'Full-time',
 'Drive manufacturing process optimisation for yield improvement, cycle time reduction, and cost savings. Lead cross-functional NPI activities.',
 'Degree in Electrical, Chemical, or Industrial Engineering. Minimum 3 years in a semiconductor or electronics manufacturing environment.',
 'RM 3,500 – RM 5,000 / month', TRUE);
