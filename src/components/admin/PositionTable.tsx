// ════════════════════════════════════════════════════════════
//  src/components/admin/PositionTable.tsx
//  Admin 职位管理组件
//
//  响应式策略（规范 #4）:
//  - Desktop (≥768px): 标准数据表格   → hidden md:block
//  - Mobile/Tablet (<768px): 职位卡片 → block md:hidden
//
//  Actions 列包含:
//  - SocialSharePopover (WhatsApp + LinkedIn + Facebook)
//  - 编辑按钮
//  - 发布/隐藏切换开关
//  - 删除按钮
// ════════════════════════════════════════════════════════════
"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SocialSharePopover } from "@/components/shared/SocialSharePopover";
import { cn, formatDate, truncate } from "@/lib/utils";
import type { OpenPosition } from "@/types";

interface PositionTableProps {
  positions: OpenPosition[];
  loading?: boolean;
  onEdit:   (pos: OpenPosition) => void;
  onDelete: (pos: OpenPosition) => void;
  onToggle: (id: string, newValue: boolean) => void;
}

export function PositionTable({
  positions,
  loading = false,
  onEdit,
  onDelete,
  onToggle,
}: PositionTableProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // ── 过滤职位 ─────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = positions;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }
    if (deptFilter !== "all") {
      result = result.filter((p) => p.department === deptFilter);
    }
    return result;
  }, [positions, search, deptFilter]);

  // 所有部门（用于过滤选项）
  const departments = [...new Set(positions.map((p) => p.department))];

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">

      {/* ── 顶部工具栏 ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
            fill="none" viewBox="0 0 16 16"
          >
            <path d="M7 13A6 6 0 107 1a6 6 0 000 12zM13 13l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search positions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-red bg-gray-50 placeholder:text-gray-400"
          />
        </div>

        {/* 部门过滤 */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-red bg-gray-50 text-gray-700"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* 结果计数 */}
        <p className="text-xs text-gray-400 shrink-0">
          {filtered.length} of {positions.length} positions
        </p>
      </div>

      {/* ════════════════════════════════════════════════
           DESKTOP TABLE (md 及以上显示)
      ════════════════════════════════════════════════ */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className={thClass}>Job Title</th>
              <th className={thClass}>Department</th>
              <th className={thClass}>Location</th>
              <th className={thClass}>Type</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Created</th>
              <th className={cn(thClass, "text-right")}>Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">
                  <div className="text-3xl mb-2">🔍</div>
                  No positions match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((pos) => (
                <tr key={pos.id} className="hover:bg-gray-50/60 transition-colors">

                  {/* 职位名称 */}
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-navy">{pos.title}</p>
                    {pos.salary_range && (
                      <p className="text-xs text-gray-400 mt-0.5">{pos.salary_range}</p>
                    )}
                  </td>

                  {/* 部门 */}
                  <td className="px-4 py-3.5">
                    <Badge variant="red">{pos.department}</Badge>
                  </td>

                  {/* 地点 */}
                  <td className="px-4 py-3.5 text-gray-600 max-w-[160px]">
                    <span className="text-xs">{pos.location}</span>
                  </td>

                  {/* 职位类型 */}
                  <td className="px-4 py-3.5">
                    <Badge variant="navy">{pos.job_type}</Badge>
                  </td>

                  {/* 发布状态切换 */}
                  <td className="px-4 py-3.5">
                    <ToggleSwitch
                      checked={pos.is_active}
                      onChange={(v) => onToggle(pos.id, v)}
                      label={pos.is_active ? "Active" : "Hidden"}
                    />
                  </td>

                  {/* 创建日期 */}
                  <td className="px-4 py-3.5 text-xs text-gray-400">
                    {formatDate(pos.created_at)}
                  </td>

                  {/* 操作列 */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* 多平台分享 */}
                      <SocialSharePopover
                        jobId={pos.id}
                        jobTitle={pos.title}
                        location={pos.location}
                        trigger="icon"
                        align="right"
                      />

                      {/* 编辑 */}
                      <ActionIconButton
                        label="Edit position"
                        onClick={() => onEdit(pos)}
                        className="hover:border-navy hover:text-navy"
                      >
                        <EditIcon />
                      </ActionIconButton>

                      {/* 删除 */}
                      <ActionIconButton
                        label="Delete position"
                        onClick={() => onDelete(pos)}
                        className="hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon />
                      </ActionIconButton>
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ════════════════════════════════════════════════
           MOBILE / TABLET CARDS (md 以下显示)
           响应式卡片布局 — 对称、整齐、对齐
      ════════════════════════════════════════════════ */}
      <div className="block md:hidden divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <div className="text-3xl mb-2">🔍</div>
            No positions match your filters.
          </div>
        ) : (
          filtered.map((pos) => (
            <div
              key={pos.id}
              className={cn(
                "p-4 transition-colors",
                pos.is_active ? "bg-white" : "bg-gray-50"
              )}
            >
              {/* 卡片顶部：职位名称 + 状态切换 */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy text-sm leading-snug">
                    {pos.title}
                  </p>
                  {pos.salary_range && (
                    <p className="text-xs text-brand-gold mt-0.5 font-medium">
                      {pos.salary_range}
                    </p>
                  )}
                </div>
                <ToggleSwitch
                  checked={pos.is_active}
                  onChange={(v) => onToggle(pos.id, v)}
                  compact
                />
              </div>

              {/* 元数据行：部门 + 类型 */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <Badge variant="red">{pos.department}</Badge>
                <Badge variant="navy">{pos.job_type}</Badge>
                {pos.is_active ? (
                  <Badge variant="green">Active</Badge>
                ) : (
                  <Badge variant="grey">Hidden</Badge>
                )}
              </div>

              {/* 地点 */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5c0 2.625 3.5 6.5 3.5 6.5s3.5-3.875 3.5-6.5C9.5 2.57 7.93 1 6 1zm0 4.75a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" fill="currentColor"/>
                </svg>
                {pos.location}
              </div>

              {/* 描述预览 */}
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                {truncate(pos.description, 100)}
              </p>

              {/* 操作按钮行 — 对称分布 */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <SocialSharePopover
                  jobId={pos.id}
                  jobTitle={pos.title}
                  location={pos.location}
                  trigger="button"
                  align="left"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(pos)}
                  className="flex-1 text-xs"
                  icon={<EditIcon />}
                  iconPosition="left"
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(pos)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
                  icon={<TrashIcon />}
                  iconPosition="left"
                >
                  Delete
                </Button>
              </div>

              {/* 创建日期 */}
              <p className="text-xs text-gray-300 mt-2">
                Added {formatDate(pos.created_at)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════
//  Sub-components
// ════════════════════════════════════════════════════════════

// ── 切换开关 ──────────────────────────────────────────────
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  compact?: boolean;
}

function ToggleSwitch({ checked, onChange, label, compact = false }: ToggleSwitchProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer group">
      <div className="relative shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={cn(
          "rounded-full transition-colors duration-200",
          "peer-checked:bg-emerald-500 bg-gray-300",
          compact ? "w-8 h-4.5" : "w-10 h-[22px]"
        )} />
        <div className={cn(
          "absolute top-0.5 left-0.5 bg-white rounded-full shadow-sm",
          "transition-transform duration-200",
          "peer-checked:translate-x-[calc(100%+1px)]",
          compact ? "w-3.5 h-3.5 peer-checked:translate-x-3.5" : "w-[18px] h-[18px]"
        )} />
      </div>
      {label && !compact && (
        <span className={cn(
          "text-xs font-medium",
          checked ? "text-emerald-600" : "text-gray-400"
        )}>
          {label}
        </span>
      )}
    </label>
  );
}

// ── 图标按钮 ──────────────────────────────────────────────
interface ActionIconButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

function ActionIconButton({ label, onClick, children, className }: ActionIconButtonProps) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "w-8 h-8 flex items-center justify-center",
        "border border-gray-200 rounded-lg bg-white text-gray-400",
        "transition-all duration-150",
        className
      )}
    >
      {children}
    </button>
  );
}

// ── SVG 图标 ──────────────────────────────────────────────
function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M9.5 1.5a1.414 1.414 0 012 2L4 11H1.5V8.5L9.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1.5 3.5h10M4 3.5V2.5a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v1M5.5 6v4M7.5 6v4M2.5 3.5l.5 8a.5.5 0 00.5.5h6a.5.5 0 00.5-.5l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── 表格骨架加载 ──────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/4 mb-6" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 mb-4">
          <div className="h-3 bg-gray-100 rounded flex-1" />
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

// 表头单元格样式常量
const thClass =
  "px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider";
