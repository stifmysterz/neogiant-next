// ════════════════════════════════════════════════════════════
//  src/components/admin/PositionFormModal.tsx
//  职位 新增/编辑 表单 Modal
//  — 统一表单，根据是否传入 position 判断新增还是编辑
//  — 客户端验证 + 部门/地点严格枚举下拉菜单
// ════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { DEPARTMENTS, LOCATIONS, JOB_TYPES } from "@/types";
import type { OpenPosition, PositionFormData } from "@/types";

interface PositionFormModalProps {
  open:        boolean;
  onClose:     () => void;
  onSave:      (data: PositionFormData) => Promise<void>;
  position?:   OpenPosition | null;  // null = 新增模式
}

const EMPTY_FORM: PositionFormData = {
  title:        "",
  department:   "Production & Operations",
  location:     "Penang (槟城)",
  job_type:     "Full-time",
  description:  "",
  requirements: "",
  salary_range: "",
  is_active:    true,
};

type FormErrors = Partial<Record<keyof PositionFormData, string>>;

export function PositionFormModal({
  open,
  onClose,
  onSave,
  position,
}: PositionFormModalProps) {
  const isEdit = Boolean(position);
  const [form, setForm] = useState<PositionFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // ── 编辑模式：填充表单数据 ────────────────────────────
  useEffect(() => {
    if (open) {
      if (position) {
        setForm({
          title:        position.title,
          department:   position.department,
          location:     position.location,
          job_type:     position.job_type,
          description:  position.description,
          requirements: position.requirements ?? "",
          salary_range: position.salary_range ?? "",
          is_active:    position.is_active,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [open, position]);

  // ── 字段更新辅助函数 ──────────────────────────────────
  function update<K extends keyof PositionFormData>(key: K, value: PositionFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // 清除对应字段的错误
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // ── 表单验证 ──────────────────────────────────────────
  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.title.trim())
      newErrors.title = "Job title is required";
    else if (form.title.length > 120)
      newErrors.title = "Job title must be under 120 characters";

    if (!form.description.trim())
      newErrors.description = "Description is required";
    else if (form.description.trim().length < 20)
      newErrors.description = "Description must be at least 20 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── 提交处理 ──────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave({
        ...form,
        title:        form.title.trim(),
        description:  form.description.trim(),
        requirements: form.requirements?.trim() || null,
        salary_range: form.salary_range?.trim() || null,
      } as PositionFormData);
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      setErrors({ title: err.message || "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Position" : "Add New Position"}
      size="lg"
    >
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* ── 职位名称 (全宽) ── */}
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="f-title" required>Job Title</FieldLabel>
            <input
              id="f-title"
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Production Operator"
              className={inputClass(!!errors.title)}
              maxLength={120}
            />
            {errors.title && <FieldError>{errors.title}</FieldError>}
          </div>

          {/* ── 部门 ── */}
          <div>
            <FieldLabel htmlFor="f-dept" required>Department</FieldLabel>
            <select
              id="f-dept"
              value={form.department}
              onChange={(e) => update("department", e.target.value as any)}
              className={inputClass(false)}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* ── 职位类型 ── */}
          <div>
            <FieldLabel htmlFor="f-type" required>Job Type</FieldLabel>
            <select
              id="f-type"
              value={form.job_type}
              onChange={(e) => update("job_type", e.target.value as any)}
              className={inputClass(false)}
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* ── 地点 (全宽) ── */}
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="f-location" required>Location</FieldLabel>
            <select
              id="f-location"
              value={form.location}
              onChange={(e) => update("location", e.target.value as any)}
              className={inputClass(false)}
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* ── 薪酬范围 ── */}
          <div>
            <FieldLabel htmlFor="f-salary">Salary Range</FieldLabel>
            <input
              id="f-salary"
              type="text"
              value={form.salary_range ?? ""}
              onChange={(e) => update("salary_range", e.target.value)}
              placeholder="e.g. RM 1,800 – RM 2,500 / month"
              className={inputClass(false)}
            />
          </div>

          {/* ── 发布状态 ── */}
          <div>
            <FieldLabel htmlFor="f-status">Status</FieldLabel>
            <select
              id="f-status"
              value={String(form.is_active)}
              onChange={(e) => update("is_active", e.target.value === "true")}
              className={inputClass(false)}
            >
              <option value="true">Active (Published)</option>
              <option value="false">Inactive (Hidden)</option>
            </select>
          </div>

          {/* ── 职位描述 (全宽) ── */}
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="f-desc" required>Job Description</FieldLabel>
            <textarea
              id="f-desc"
              rows={4}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe the role, key responsibilities, and work environment…"
              className={cn(inputClass(!!errors.description), "resize-y min-h-[100px]")}
            />
            {errors.description && <FieldError>{errors.description}</FieldError>}
            <p className="text-xs text-gray-400 mt-1">{form.description.length} characters</p>
          </div>

          {/* ── 任职要求 (全宽) ── */}
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="f-reqs">Requirements</FieldLabel>
            <textarea
              id="f-reqs"
              rows={3}
              value={form.requirements ?? ""}
              onChange={(e) => update("requirements", e.target.value)}
              placeholder="Education level, years of experience, certifications, skills…"
              className={cn(inputClass(false), "resize-y min-h-[80px]")}
            />
          </div>

        </div>
      </div>

      {/* ── Modal 底部操作 ── */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <Button variant="ghost" size="md" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          loading={saving}
          onClick={handleSubmit}
        >
          {isEdit ? "Save Changes" : "Add Position"}
        </Button>
      </div>
    </Modal>
  );
}


// ════════════════════════════════════════════════════════════
//  小型辅助组件
// ════════════════════════════════════════════════════════════
function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold text-gray-700 mb-1.5"
    >
      {children}
      {required && <span className="text-brand-red ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-red-500 mt-1">{children}</p>;
}

function inputClass(hasError: boolean): string {
  return cn(
    "w-full px-3 py-2.5 text-sm rounded-lg border bg-white text-gray-800",
    "transition-colors duration-150 focus:outline-none",
    "placeholder:text-gray-400",
    hasError
      ? "border-red-300 focus:border-red-500 bg-red-50"
      : "border-gray-200 focus:border-brand-red"
  );
}
