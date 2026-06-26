// ════════════════════════════════════════════════════════════
//  src/components/careers/JotformEmbed.tsx
//  Jotform 自动高度 React 封装组件
//
//  解决的核心问题：
//  - 防止 iframe 与页面同时出现双滚动条（tablet/mobile）
//  - 监听 Jotform postMessage 事件动态调整 iframe 高度
//  - 支持条件字段展开时的高度重新计算
// ════════════════════════════════════════════════════════════
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface JotformEmbedProps {
  /** Jotform 表单 ID，例如 "242345678901234" */
  formId: string;
  /** 初始最小高度（px），防止加载时闪烁 */
  initialHeight?: number;
  /** 表单加载完成回调 */
  onLoad?: () => void;
  /** 额外 className */
  className?: string;
}

export function JotformEmbed({
  formId,
  initialHeight = 400,
  onLoad,
  className,
}: JotformEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(initialHeight);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Jotform postMessage 高度同步 ──────────────────────
  // Jotform 在表单高度变化时（条件字段显示/隐藏）
  // 会向父窗口发送 postMessage，格式为：
  // { action: 'setHeight', value: '800px', formID: '...' }
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // 安全校验 — 仅接受 Jotform 域的消息
      if (
        !event.origin.includes("jotform.com") &&
        !event.origin.includes("jotform.net")
      ) {
        return;
      }

      try {
        // Jotform 有时发送字符串，有时发送对象
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        // 格式 1: { action: 'setHeight', value: '850', formID: '...' }
        if (data?.action === "setHeight" && data?.value) {
          const newHeight = parseInt(String(data.value), 10);
          if (!isNaN(newHeight) && newHeight > 0) {
            // 加 40px 缓冲，防止底部 submit 按钮被遮挡
            setHeight(newHeight + 40);
          }
          return;
        }

        // 格式 2: { type: 'resize', height: '850' }  (旧版 Jotform)
        if (data?.type === "resize" && data?.height) {
          const newHeight = parseInt(String(data.height), 10);
          if (!isNaN(newHeight) && newHeight > 0) {
            setHeight(newHeight + 40);
          }
          return;
        }

        // 格式 3: Jotform iframe 传递的字符串 "setHeight:850:formId"
        if (typeof data === "string" && data.startsWith("setHeight")) {
          const parts = data.split(":");
          const newHeight = parseInt(parts[1], 10);
          if (!isNaN(newHeight) && newHeight > 0) {
            setHeight(newHeight + 40);
          }
        }
      } catch {
        // JSON 解析失败 — 忽略，不影响用户体验
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // ── iframe 加载完成处理 ────────────────────────────────
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();

    // 通知 Jotform iframe 启用 postMessage 高度同步
    // （部分 Jotform 版本需要此初始化消息）
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ action: "subscribe", formID: formId }),
      "*"
    );
  };

  // ── 构建 Jotform iframe URL ───────────────────────────
  const iframeSrc = `https://form.jotform.com/${formId}?isIframeEmbed=1`;

  return (
    <div className={cn("w-full relative", className)}>
      {/* 加载占位符 */}
      {!isLoaded && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 rounded-xl"
          style={{ minHeight: initialHeight }}
          aria-label="Loading form..."
        >
          <div className="w-8 h-8 border-2 border-gray-200 border-t-brand-red rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading form…</p>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title="Neo Giant Application Form"
        onLoad={handleLoad}
        // ── 关键: 防止 iframe 自身出现滚动条 ──
        // scrolling="no" 配合动态高度，完全消除双滚动条问题
        scrolling="no"
        allow="geolocation; camera; microphone"
        className={cn(
          "w-full border-0 rounded-xl transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: `${height}px`,
          // 防止 iOS Safari 的 iframe 内部滚动 bug
          WebkitOverflowScrolling: "touch",
        }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Modal 版本 — 在弹窗中嵌入 Jotform
// ────────────────────────────────────────────────────────────
interface JotformModalProps {
  formId: string;
  open: boolean;
  onClose: () => void;
  jobTitle?: string;
}

export function JotformModal({ formId, open, onClose, jobTitle }: JotformModalProps) {
  // 动态导入 Modal，避免 SSR 问题
  const { Modal } = require("@/components/ui/Modal");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={jobTitle ? `Apply — ${jobTitle}` : "Apply Now"}
      size="xl"
    >
      <div className="p-6">
        <JotformEmbed
          formId={formId}
          initialHeight={500}
          className="rounded-xl overflow-hidden"
        />
      </div>
    </Modal>
  );
}
