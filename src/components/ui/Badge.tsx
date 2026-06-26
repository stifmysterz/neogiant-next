// ════════════════════════════════════════════════════════════
//  src/components/ui/Badge.tsx
//  通用标签/徽章组件
// ════════════════════════════════════════════════════════════
import { cn } from "@/lib/utils";

type BadgeVariant = "red" | "green" | "grey" | "gold" | "navy";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  red:   "bg-brand-red/10 text-brand-red",
  green: "bg-emerald-100 text-emerald-700",
  grey:  "bg-gray-100 text-gray-600",
  gold:  "bg-amber-100 text-amber-700",
  navy:  "bg-navy/8 text-navy",
};

export function Badge({ children, variant = "grey", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full",
        "text-xs font-semibold tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
