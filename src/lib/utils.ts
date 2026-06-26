// ════════════════════════════════════════════════════════════
//  src/lib/utils.ts
//  工具函数集合
// ════════════════════════════════════════════════════════════
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind 类名合并工具（解决类名冲突）*/
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * 生成职位公开分享 URL
 * @param jobId UUID
 */
export function getJobPublicUrl(jobId: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.neogiant.com.my";
  return `${base}/careers/${jobId}`;
}

/**
 * 生成职位社交分享文案
 * 严格遵循规范中要求的格式
 */
export function buildShareMessage(params: {
  title: string;
  location: string;
  jobId: string;
}): string {
  const url = getJobPublicUrl(params.jobId);
  return (
    `🌟 New Job Opening!\n\n` +
    `Position: ${params.title}\n` +
    `Location: ${params.location}\n` +
    `Apply Here: ${url}`
  );
}

/** 截断文字并追加省略号 */
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen).trimEnd() + "…" : str;
}

/** 格式化日期为可读字符串 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
