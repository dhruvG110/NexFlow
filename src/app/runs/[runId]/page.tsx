import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getWorkflowRunById } from "@/lib/data/repository";
import { formatRelativeDate } from "@/lib/utils";

type RunDetailPageProps = {
  params: Promise<{
    runId: string;
  }>;
};

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { runId } = await params;
  const run = await getWorkflowRunById(runId);

  if (!run) {
    notFound();
  }

  return (
    <AppShell
      eyebrow="Run Detail"
      title={run.workflowName}
      description="A production workflow app lives or dies on debuggability. Each run here is tied to a correlation ID, a trigger source, and a precise step timeline."
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Metadata
          </p>
          <div className="mt-5 space-y-4 text-sm text-[color:var(--muted)]">
            <div>
              <p className="font-semibold text-[color:var(--ink)]">Run ID</p>
              <p>{run.id}</p>
            </div>
            <div>
              <p className="font-semibold text-[color:var(--ink)]">Correlation ID</p>
              <p>{run.correlationId}</p>
            </div>
            <div>
              <p className="font-semibold text-[color:var(--ink)]">Queued</p>
              <p>{formatRelativeDate(run.queuedAt)}</p>
            </div>
            {run.completedAt ? (
              <div>
                <p className="font-semibold text-[color:var(--ink)]">Completed</p>
                <p>{formatRelativeDate(run.completedAt)}</p>
              </div>
            ) : null}
            <div>
              <p className="font-semibold text-[color:var(--ink)]">Duration</p>
              <p>{run.durationMs ? `${run.durationMs} ms` : "Still running"}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Step timeline
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                Execution path
              </h2>
            </div>
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
          <div className="mt-6 space-y-3">
            {run.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center justify-between gap-3 rounded-[22px] border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    {step.label}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {step.id}
                  </p>
                </div>
                <Badge
                  variant={
                    step.status === "SUCCEEDED"
                      ? "success"
                      : step.status === "FAILED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {step.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
