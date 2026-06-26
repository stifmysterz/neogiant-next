// ════════════════════════════════════════════════════════════
//  src/app/admin/page.tsx
//  管理后台主页面
//  — JWT HTTP-Only Cookie 认证保护
//  — 完整 CRUD 职位管理
//  — 响应式 Table/Card 布局
// ════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useCallback } from "react";
import { PositionTable } from "@/components/admin/PositionTable";
import { PositionFormModal } from "@/components/admin/PositionFormModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { OpenPosition, PositionFormData } from "@/types";

// ── API 助手函数 ──────────────────────────────────────────
const API = {
  auth:   (method: string, body?: object) =>
    fetch("/.netlify/functions/auth", {
      method, credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  jobs:   (method: string, query?: string, body?: object) =>
    fetch(`/.netlify/functions/jobs${query ? `?${query}` : ""}`, {
      method, credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
};

// ── 状态机 ────────────────────────────────────────────────
type AuthState = "checking" | "unauthenticated" | "authenticated";

export default function AdminPage() {
  const [authState, setAuthState]   = useState<AuthState>("checking");
  const [positions, setPositions]   = useState<OpenPosition[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // 表单 Modal 状态
  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<OpenPosition | null>(null);

  // 删除确认 Modal 状态
  const [deleteTarget, setDeleteTarget] = useState<OpenPosition | null>(null);

  // ── 验证现有 Session ─────────────────────────────────
  useEffect(() => {
    API.auth("GET").then(async (res) => {
      const json = await res.json();
      setAuthState(json.success ? "authenticated" : "unauthenticated");
    }).catch(() => setAuthState("unauthenticated"));
  }, []);

  // ── Session 验证后加载职位 ───────────────────────────
  useEffect(() => {
    if (authState === "authenticated") fetchJobs();
  }, [authState]);

  // ── 拉取全部职位（包含未发布）───────────────────────
  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await API.jobs("GET", "all=1");
      const json = await res.json();
      if (json.success) setPositions(json.data);
    } catch {
      showToast("Failed to load positions.", "err");
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  // ── Toast 工具 ────────────────────────────────────────
  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── 登出 ──────────────────────────────────────────────
  async function handleLogout() {
    await API.auth("DELETE");
    setAuthState("unauthenticated");
    setPositions([]);
  }

  // ── 创建 / 更新 ──────────────────────────────────────
  async function handleSave(data: PositionFormData) {
    if (editTarget) {
      const res = await API.jobs("PUT", `id=${editTarget.id}`, data);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast(`"${data.title}" updated.`, "ok");
    } else {
      const res = await API.jobs("POST", undefined, data);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast(`"${data.title}" added.`, "ok");
    }
    fetchJobs();
  }

  // ── Toggle 发布/隐藏 ─────────────────────────────────
  async function handleToggle(id: string, newValue: boolean) {
    const res = await API.jobs("PUT", `id=${id}`, { is_active: newValue });
    const json = await res.json();
    if (json.success) {
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: newValue } : p))
      );
      showToast(`Position ${newValue ? "published" : "hidden"}.`, "ok");
    }
  }

  // ── 删除确认 ─────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const res = await API.jobs("DELETE", `id=${deleteTarget.id}`);
    const json = await res.json();
    if (json.success) {
      setPositions((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast(`"${deleteTarget.title}" deleted.`, "ok");
    }
    setDeleteTarget(null);
  }

  // ────────────────────────────────────────────────────
  //  渲染状态机
  // ────────────────────────────────────────────────────

  // 检查中 — 全屏 spinner
  if (authState === "checking") return <FullScreenSpinner />;

  // 未认证 — 登录界面
  if (authState === "unauthenticated") {
    return <LoginScreen onSuccess={() => setAuthState("authenticated")} />;
  }

  // 统计数字
  const stats = {
    total:    positions.length,
    active:   positions.filter((p) => p.is_active).length,
    hidden:   positions.filter((p) => !p.is_active).length,
    locations: new Set(positions.map((p) => p.location)).size,
  };

  // ── 已认证 — Dashboard ────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-body">

      {/* ── 顶部导航栏 ── */}
      <header className="bg-navy border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-brand-red rounded-md flex items-center justify-center text-white font-display font-bold text-sm">
              NG
            </div>
            <span className="font-display font-bold text-white text-sm hidden sm:block">
              Neo Giant
            </span>
            <span className="text-white/30 text-sm hidden sm:block">/</span>
            <span className="text-white/60 text-sm hidden sm:block">Admin</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white text-xs font-medium transition-colors hidden sm:block"
            >
              View Live Site ↗
            </a>
            <Button variant="ghost" size="sm" onClick={handleLogout}
              className="text-white/60 hover:text-white text-xs border-white/10">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── 页面标题 + 新增按钮 ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-navy">
              Open Positions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage job listings published on the public careers page.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => { setEditTarget(null); setFormOpen(true); }}
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            }
            iconPosition="left"
          >
            Add Position
          </Button>
        </div>

        {/* ── 统计卡片 ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Positions", value: stats.total,   icon: "📋", color: "bg-blue-50" },
            { label: "Published",       value: stats.active,  icon: "✅", color: "bg-emerald-50" },
            { label: "Hidden",          value: stats.hidden,  icon: "⏸",  color: "bg-gray-100" },
            { label: "Locations",       value: stats.locations,icon: "📍", color: "bg-amber-50" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center text-lg shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="font-display font-bold text-xl text-navy leading-none">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── 职位表格（响应式：桌面=表格 / 移动=卡片）── */}
        <PositionTable
          positions={positions}
          loading={loadingJobs}
          onEdit={(pos) => { setEditTarget(pos); setFormOpen(true); }}
          onDelete={setDeleteTarget}
          onToggle={handleToggle}
        />
      </main>

      {/* ── 新增/编辑 Modal ── */}
      <PositionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        position={editTarget}
      />

      {/* ── 删除确认 Modal ── */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        size="sm"
      >
        <div className="p-6 text-center">
          <div className="text-4xl mb-3">🗑️</div>
          <h3 className="font-display font-bold text-lg text-navy mb-2">Delete Position?</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to permanently delete{" "}
            <strong className="text-navy">"{deleteTarget?.title}"</strong>?
            This cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>Delete</Button>
          </div>
        </div>
      </Modal>

      {/* ── Toast 通知 ── */}
      {toast && (
        <div className={`
          fixed bottom-6 right-6 z-50
          flex items-center gap-2.5 px-4 py-3
          rounded-xl shadow-card-lg text-sm font-medium
          animate-slide-up
          ${toast.type === "ok"
            ? "bg-navy text-white border-l-4 border-emerald-400"
            : "bg-navy text-white border-l-4 border-brand-red"
          }
        `}>
          <span>{toast.type === "ok" ? "✅" : "❌"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════════
//  Login Screen Component
// ════════════════════════════════════════════════════════════
function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/.netlify/functions/auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();

      if (json.success) {
        onSuccess();
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-mid to-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card-lg overflow-hidden">

        {/* 顶部品牌色条 */}
        <div className="h-1 bg-gradient-to-r from-brand-red via-brand-gold to-brand-red" />

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-9 h-9 bg-brand-red rounded-lg flex items-center justify-center font-display font-bold text-white text-sm">
              NG
            </div>
            <div>
              <p className="font-display font-bold text-navy text-sm leading-tight">Neo Giant (M) Sdn Bhd</p>
              <p className="text-xs text-gray-400">HR Admin Portal</p>
            </div>
          </div>

          <h1 className="font-display font-bold text-xl text-navy mb-1">Sign In</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your admin password to access the job management dashboard.
          </p>

          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg mb-4">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="pw" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Admin Password
              </label>
              <input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-red bg-white"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? "Signing in…" : "Sign In →"}
            </Button>
          </form>

          {/* 安全说明 */}
          <p className="text-xs text-gray-300 text-center mt-5">
            🔒 Session secured with HTTP-Only cookie
          </p>
        </div>
      </div>
    </div>
  );
}

// ── 全屏加载 spinner ──────────────────────────────────────
function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-white/20 border-t-brand-red rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Verifying session…</p>
      </div>
    </div>
  );
}
