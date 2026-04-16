import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getWorkflowSummaries } from "@/lib/data/repository";
import { formatRelativeDate } from "@/lib/utils";

export default async function WorkflowsPage() {
  const workflows = await getWorkflowSummaries();

  return (
    <AppShell
      eyebrow="Builder"
      title="Versioned workflows ready for production handling."
      description="Keep draft graphs mutable, compile them into a DSL, and publish immutable versions that the runtime can replay safely."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      workflow.status === "ACTIVE"
                        ? "success"
                        : workflow.status === "DRAFT"
                          ? "warning"
                          : "info"
                    }
                  >
                    {workflow.status}
                  </Badge>
                  <Badge variant="info">{workflow.triggerSource}</Badge>
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
                  {workflow.name}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                  {workflow.description}
                </p>
              </div>
              <Link
                href={`/workflows/${workflow.id}`}
                className="rounded-full border border-[color:var(--line)] p-3 text-[color:var(--accent)] transition hover:border-[color:var(--accent)]"
              >
                <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-[22px] bg-[color:var(--panel)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Version
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                  v{workflow.version}
                </p>
              </div>
              <div className="rounded-[22px] bg-[color:var(--panel)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Runs today
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                  {workflow.runsToday}
                </p>
              </div>
              <div className="rounded-[22px] bg-[color:var(--panel)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Success
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                  {workflow.successRate}%
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {workflow.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Last run {formatRelativeDate(workflow.lastRunAt)}
            </p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
