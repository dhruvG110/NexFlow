import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getWorkflowRunSummaries } from "@/lib/data/repository";
import { formatRelativeDate } from "@/lib/utils";

export default async function RunsPage() {
  const runs = await getWorkflowRunSummaries();

  return (
    <AppShell
      eyebrow="Runs"
      title="Trace every automation from trigger to downstream steps."
      description="Run history is the core debugging surface for an automation product. Each record should point back to an immutable version and carry enough metadata for replay and support."
    >
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr] gap-3 border-b border-[color:var(--line)] px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
          <span>Workflow</span>
          <span>Status</span>
          <span>Trigger</span>
          <span>Queued</span>
        </div>
        <div className="divide-y divide-[color:var(--line)]">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/runs/${run.id}`}
              className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr] gap-3 px-6 py-5 transition hover:bg-white/70"
            >
              <div>
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  {run.workflowName}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  {run.correlationId}
                </p>
              </div>
              <div>
                <Badge
                  variant={
                    run.status === "SUCCEEDED"
                      ? "success"
                      : run.status === "FAILED"
                        ? "danger"
                        : "info"
                  }
                >
                  {run.status}
                </Badge>
              </div>
              <div className="text-sm font-medium text-[color:var(--ink)]">
                {run.triggerSource}
              </div>
              <div className="text-sm text-[color:var(--muted)]">
                {formatRelativeDate(run.queuedAt)}
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
