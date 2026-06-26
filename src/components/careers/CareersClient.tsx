// ════════════════════════════════════════════════════════════
//  src/components/careers/CareersClient.tsx
//  招聘页面客户端交互组件
//  — 职位过滤（部门/地点/搜索）
//  — Apply Now → Jotform Modal
//  — 社交分享
// ════════════════════════════════════════════════════════════
"use client";

import { useState, useMemo } from "react";
import { JotformEmbed } from "./JotformEmbed";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SocialSharePopover } from "@/components/shared/SocialSharePopover";
import { cn, formatDate, truncate } from "@/lib/utils";
import { DEPARTMENTS, LOCATIONS } from "@/types";
import type { OpenPosition } from "@/types";

// 从环境变量读取 Jotform 表单 ID
const JOTFORM_ID = process.env.NEXT_PUBLIC_JOTFORM_FORM_ID || "";

interface CareersClientProps {
  initialPositions: OpenPosition[];
}

export function CareersClient({ initialPositions }: CareersClientProps) {
  // 过滤状态
  const [deptFilter,    setDeptFilter]    = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [search,        setSearch]        = useState("");

  // Apply Now Modal
  const [applyTarget, setApplyTarget] = useState<OpenPosition | null>(null);

  // ── 客户端过滤 ────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = initialPositions;

    if (deptFilter !== "all") {
      result = result.filter((p) => p.department === deptFilter);
    }
    if (locationFilter !== "all") {
      result = result.filter((p) => p.location === locationFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [initialPositions, deptFilter, locationFilter, search]);

  return (
    <section className="py-16 sm:py-24 bg-gray-50" aria-labelledby="careers-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Section 标题 ── */}
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red mb-3">
            Open Positions
          </p>
          <h2
            id="careers-heading"
            className="font-display font-extrabold text-3xl sm:text-4xl text-navy leading-tight"
          >
            Join Our <span className="text-brand-red">Client Companies</span>
          </h2>
          <p className="text-gray-500 mt-4 text-base">
            Browse current openings placed by Neo Giant across Penang and Malaysia's
            leading manufacturing, engineering, and logistics companies.
          </p>
        </div>

        {/* ── 过滤栏 ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 关键词搜索 */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 16 16">
                <path d="M7 13A6 6 0 107 1a6 6 0 000 12zM13 13l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="search"
                placeholder="Search jobs, skills…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-red bg-white placeholder:text-gray-400"
              />
            </div>

            {/* 部门过滤 */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-red bg-white text-gray-700"
              aria-label="Filter by department"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* 地点过滤 */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-red bg-white text-gray-700"
              aria-label="Filter by location"
            >
              <option value="all">All Locations</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* 活跃过滤器标签 */}
          {(deptFilter !== "all" || locationFilter !== "all" || search) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-400">Filtering:</span>
              {deptFilter !== "all" && (
                <ActiveFilter label={deptFilter} onClear={() => setDeptFilter("all")} />
              )}
              {locationFilter !== "all" && (
                <ActiveFilter label={locationFilter} onClear={() => setLocationFilter("all")} />
              )}
              {search && (
                <ActiveFilter label={`"${search}"`} onClear={() => setSearch("")} />
              )}
              <button
                onClick={() => { setDeptFilter("all"); setLocationFilter("all"); setSearch(""); }}
                className="text-xs text-brand-red hover:underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* 结果计数 */}
        <p className="text-sm text-gray-400 mb-4">
          Showing <strong className="text-navy">{filtered.length}</strong> of{" "}
          {initialPositions.length} positions
        </p>

        {/* ── 职位卡片网格 ── */}
        {filtered.length === 0 ? (
          <EmptyState onReset={() => { setDeptFilter("all"); setLocationFilter("all"); setSearch(""); }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((pos) => (
              <JobCard
                key={pos.id}
                position={pos}
                onApply={() => setApplyTarget(pos)}
              />
            ))}
          </div>
        )}

        {/* 底部 CTA */}
        <div className="text-center mt-16 py-12 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-4">
            Don't see a suitable role? Send us your resume and we'll match you when the right opportunity opens.
          </p>
          <a href="/#contact">
            <Button variant="outline" size="lg">Submit Your Resume →</Button>
          </a>
        </div>
      </div>

      {/* ── Apply Now Modal ── */}
      <Modal
        open={Boolean(applyTarget)}
        onClose={() => setApplyTarget(null)}
        title={applyTarget ? `Apply — ${applyTarget.title}` : "Apply"}
        size="xl"
      >
        <div className="p-6">
          {/* 职位元信息 */}
          {applyTarget && (
            <div className="flex flex-wrap gap-2 mb-5">
              <Badge variant="red">{applyTarget.department}</Badge>
              <Badge variant="navy">{applyTarget.job_type}</Badge>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                📍 {applyTarget.location}
              </span>
            </div>
          )}

          {/* Jotform 自动高度嵌入 */}
          {JOTFORM_ID ? (
            <JotformEmbed
              formId={JOTFORM_ID}
              initialHeight={520}
              onLoad={() => console.log("Jotform loaded")}
            />
          ) : (
            // 开发环境占位符
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <span className="text-3xl mb-3">📝</span>
              <p className="font-semibold text-navy text-sm mb-1">Jotform Application Form</p>
              <p className="text-xs text-gray-400">
                Set <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_JOTFORM_FORM_ID</code> in your .env.local
              </p>
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}


// ════════════════════════════════════════════════════════════
//  Job Card Component
// ════════════════════════════════════════════════════════════
interface JobCardProps {
  position: OpenPosition;
  onApply: () => void;
}

function JobCard({ position: pos, onApply }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-card",
        "flex flex-col transition-shadow duration-200 hover:shadow-card-lg",
        "overflow-hidden group"
      )}
    >
      {/* 顶부 红色高亮条（hover 时显示） */}
      <div className="h-0.5 bg-brand-red scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      <div className="p-5 flex flex-col flex-1">
        {/* 标签行 */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="red">{pos.department}</Badge>
            <Badge variant="grey">{pos.job_type}</Badge>
          </div>
          {/* 分享按钮 */}
          <SocialSharePopover
            jobId={pos.id}
            jobTitle={pos.title}
            location={pos.location}
            trigger="icon"
            align="right"
          />
        </div>

        {/* 职位名称 */}
        <h3 className="font-display font-bold text-base text-navy mb-2 group-hover:text-brand-red transition-colors">
          <a href={`/careers/${pos.id}`}>{pos.title}</a>
        </h3>

        {/* 地点 + 薪酬 */}
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1C3.84 1 2.5 2.34 2.5 4c0 2.25 3 6 3 6s3-3.75 3-6c0-1.66-1.34-3-3-3zm0 4.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" fill="currentColor"/>
            </svg>
            {pos.location}
          </span>
          {pos.salary_range && (
            <span className="text-xs font-semibold text-brand-gold">{pos.salary_range}</span>
          )}
        </div>

        {/* 描述（可展开） */}
        <p className={cn(
          "text-sm text-gray-500 leading-relaxed mb-3",
          !expanded && "line-clamp-2"
        )}>
          {pos.description}
        </p>
        {pos.description.length > 120 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-brand-red hover:underline mb-3 text-left"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {/* 任职要求 */}
        {pos.requirements && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-1">Requirements</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              {truncate(pos.requirements, 140)}
            </p>
          </div>
        )}

        {/* 底部操作 */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <span className="text-xs text-gray-300">Posted {formatDate(pos.created_at)}</span>
          <Button variant="primary" size="sm" onClick={onApply}>
            Apply Now
          </Button>
        </div>
      </div>
    </article>
  );
}

// ── 活跃过滤器标签 ────────────────────────────────────────
function ActiveFilter({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-brand-red/10 text-brand-red text-xs font-medium px-2 py-0.5 rounded-full">
      {label}
      <button onClick={onClear} className="hover:opacity-70">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>
    </span>
  );
}

// ── 无结果状态 ────────────────────────────────────────────
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="font-display font-bold text-lg text-navy mb-2">No positions found</h3>
      <p className="text-sm text-gray-500 mb-5">
        No open positions match your current filters.
      </p>
      <Button variant="outline" size="sm" onClick={onReset}>Clear Filters</Button>
    </div>
  );
}
