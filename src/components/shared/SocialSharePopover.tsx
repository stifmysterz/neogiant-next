// ════════════════════════════════════════════════════════════
//  src/components/shared/SocialSharePopover.tsx
//  多平台社交分享弹窗组件
//
//  使用 react-share 库提供:
//  - WhatsApp 分享
//  - LinkedIn 分享
//  - Facebook 分享
//
//  所有平台使用公开职位 URL（不暴露 /admin 内部 URL）
//  分享文案严格遵循规范中要求的格式
// ════════════════════════════════════════════════════════════
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  WhatsappShareButton,
  WhatsappIcon,
  LinkedinShareButton,
  LinkedinIcon,
  FacebookShareButton,
  FacebookIcon,
} from "react-share";
import { cn } from "@/lib/utils";
import { getJobPublicUrl, buildShareMessage } from "@/lib/utils";

interface SocialSharePopoverProps {
  jobId: string;
  jobTitle: string;
  location: string;
  /** 触发器外观：'icon'（仅图标）| 'button'（带文字） */
  trigger?: "icon" | "button";
  /** Popover 弹出方向 */
  align?: "left" | "right";
  className?: string;
}

export function SocialSharePopover({
  jobId,
  jobTitle,
  location,
  trigger = "icon",
  align = "right",
  className,
}: SocialSharePopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 动态生成分享数据
  const publicUrl = getJobPublicUrl(jobId);
  const shareMessage = buildShareMessage({ title: jobTitle, location, jobId });

  // ── 点击外部关闭 Popover ─────────────────────────────
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, handleOutsideClick]);

  // Escape 键关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // 分享后自动关闭 popover
  const handleShareClick = () => setTimeout(() => setOpen(false), 300);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* ── 触发按钮 ── */}
      {trigger === "button" ? (
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5",
            "text-xs font-semibold text-gray-600 hover:text-navy",
            "bg-white border border-gray-200 hover:border-gray-300 rounded-lg",
            "transition-all duration-150",
            open && "border-brand-red text-brand-red"
          )}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="Share job"
        >
          <ShareIcon />
          Share
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-8 h-8 flex items-center justify-center",
            "text-gray-500 hover:text-navy",
            "bg-white border border-gray-200 hover:border-gray-300 rounded-lg",
            "transition-all duration-150",
            open && "border-brand-red text-brand-red bg-red-50"
          )}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="Share job"
        >
          <ShareIcon />
        </button>
      )}

      {/* ── Popover 下拉菜单 ── */}
      {open && (
        <div
          className={cn(
            "absolute z-50 top-full mt-2",
            "bg-white rounded-xl border border-gray-100 shadow-card-lg",
            "p-3 min-w-[180px]",
            "animate-slide-up",
            align === "right" ? "right-0" : "left-0"
          )}
          role="menu"
          aria-label="Share options"
        >
          {/* 标题行 */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
            Share Position
          </p>

          <div className="flex flex-col gap-1">
            {/* ── WhatsApp ── */}
            <WhatsappShareButton
              url={publicUrl}
              title={shareMessage}
              onClick={handleShareClick}
              className="w-full"
            >
              <div className={shareItemClass}>
                <WhatsappIcon size={24} round />
                <span>WhatsApp</span>
              </div>
            </WhatsappShareButton>

            {/* ── LinkedIn ── */}
            <LinkedinShareButton
              url={publicUrl}
              title={`New Job Opening! ${jobTitle}`}
              summary={shareMessage}
              source="Neo Giant (M) Sdn Bhd"
              onClick={handleShareClick}
              className="w-full"
            >
              <div className={shareItemClass}>
                <LinkedinIcon size={24} round />
                <span>LinkedIn</span>
              </div>
            </LinkedinShareButton>

            {/* ── Facebook ── */}
            <FacebookShareButton
              url={publicUrl}
              hashtag="#hiring"
              onClick={handleShareClick}
              className="w-full"
            >
              <div className={shareItemClass}>
                <FacebookIcon size={24} round />
                <span>Facebook</span>
              </div>
            </FacebookShareButton>

            {/* ── 分隔线 + 复制链接 ── */}
            <hr className="my-1 border-gray-100" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                handleShareClick();
              }}
              className={cn(shareItemClass, "w-full")}
            >
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 7.5L7.5 4.5M5.5 3.5L6.5 2.5a2.121 2.121 0 013 3L8.5 6.5M6.5 8.5l-1 1a2.121 2.121 0 01-3-3l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>Copy Link</span>
            </button>
          </div>

          {/* 箭头装饰 */}
          <div
            className={cn(
              "absolute -top-1.5 w-3 h-3 bg-white border-t border-l border-gray-100 rotate-45",
              align === "right" ? "right-3" : "left-3"
            )}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

// ── 复用的分享项样式 ──────────────────────────────────────
const shareItemClass =
  "flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700";

// ── 分享图标 SVG ──────────────────────────────────────────
function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="11" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="11" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4.35 6.15L9.7 3.35M4.35 7.85L9.7 10.65" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
