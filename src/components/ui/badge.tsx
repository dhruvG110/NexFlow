import { cn } from "@/lib/utils";

const variants = {
  default: "border-[color:var(--line)] bg-white/70 text-[color:var(--ink)]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
} as const;

type BadgeProps = {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
