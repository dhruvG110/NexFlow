import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  caption: string;
  tone?: "success" | "warning" | "info" | "default";
};

export function MetricCard({
  label,
  value,
  caption,
  tone = "default",
}: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
            {value}
          </p>
        </div>
        <Badge variant={tone}>{caption}</Badge>
      </div>
    </Card>
  );
}
