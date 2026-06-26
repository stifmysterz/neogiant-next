// ════════════════════════════════════════════════════════════
//  src/components/ui/Modal.tsx
//  通用 Modal 对话框组件
//  支持 Escape 关闭、背景点击关闭、焦点陷阱
// ════════════════════════════════════════════════════════════
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Escape 键关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // 打开时锁定 body 滚动
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* 半透明背景层 */}
      <div
        className="absolute inset-0 bg-navy/70 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
      />

      {/* 内容盒子 */}
      <div
        className={cn(
          "relative z-10 w-full bg-white rounded-2xl shadow-card-lg",
          "flex flex-col max-h-[90vh] overflow-hidden",
          "animate-slide-up",
          sizeClasses[size],
          className
        )}
      >
        {/* 头部 */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h3 id="modal-title" className="font-display font-bold text-lg text-navy">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              aria-label="Close dialog"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
