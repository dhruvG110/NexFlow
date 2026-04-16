import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[color:var(--line)] bg-white/88 shadow-[0_20px_60px_rgba(10,15,12,0.08)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
