// ════════════════════════════════════════════════════════════
//  src/components/ui/Button.tsx
//  通用按钮组件 — 支持所有变体和尺寸
// ════════════════════════════════════════════════════════════
"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger" | "success";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-red hover:bg-brand-red-dark text-white border-2 border-brand-red hover:border-brand-red-dark shadow-red/30 hover:shadow-red",
  outline: "bg-transparent hover:bg-navy text-navy hover:text-white border-2 border-navy",
  ghost:   "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-2 border-transparent",
  danger:  "bg-red-600 hover:bg-red-700 text-white border-2 border-red-600",
  success: "bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-2 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "right",
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-lg",
          "transition-all duration-200 whitespace-nowrap select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          !isDisabled && "hover:-translate-y-px hover:shadow-card",
          className
        )}
        {...props}
      >
        {/* 加载状态 spinner */}
        {loading && (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}

        {/* 左侧图标 */}
        {!loading && icon && iconPosition === "left" && (
          <span className="shrink-0">{icon}</span>
        )}

        {children}

        {/* 右侧图标 */}
        {!loading && icon && iconPosition === "right" && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
