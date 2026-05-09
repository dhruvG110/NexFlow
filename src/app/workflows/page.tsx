import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createWorkflowAction, deleteWorkflowAction } from "@/app/workflows/actions";
import { getWorkflowSummaries } from "@/lib/data/repository";
import { formatRelativeDate } from "@/lib/utils";
import type { WorkflowSummary } from "@/lib/workflow/types";

export default async function WorkflowsPage() {
  let workflows: WorkflowSummary[] = [];

  try {
    const res = await getWorkflowSummaries();
    workflows = Array.isArray(res) ? res : [];
  } catch (error) {
    console.error("Workflows page error:", error);
  }

  return (
    <AppShell
      eyebrow="Builder"
      title="Build, version, and manage workflows."
      description="Create drafts, publish immutable versions, and keep the workflow list manageable without leaving the builder."
    >
      <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
            Create workflow
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[color:var(--ink)]">
            New draft
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            Start with a trigger and keep editing in draft until you publish.
          </p>
          <form action={createWorkflowAction} className="mt-5 space-y-3">
            <input
              type="text"
              name="name"
              placeholder="Untitled workflow"
              className="w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-3 text-sm outline-none"
            />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-white"
            >
              Create workflow
            </button>
          </form>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
        {workflows.length === 0 && (
          <p className="text-sm text-[color:var(--muted)]">
            No workflows available.
          </p>
        )}

        {workflows.map((workflow) => (
          <Card key={workflow.id} className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">{workflow.status}</Badge>
                  <Badge variant="info">{workflow.triggerSource}</Badge>
                </div>

                <h2 className="mt-4 text-3xl font-semibold text-[color:var(--ink)]">
                  {workflow.name}
                </h2>

                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  {workflow.description}
                </p>
              </div>

              <Link
                href={`/workflows/${workflow.id}`}
                className="rounded-full border p-3"
              >
                <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="p-4">
                <p className="text-xs">Version</p>
                <p className="text-2xl">
                  v{workflow.version}
                </p>
              </div>

              <div className="p-4">
                <p className="text-xs">Runs today</p>
                <p className="text-2xl">
                  {workflow.runsToday}
                </p>
              </div>

              <div className="p-4">
                <p className="text-xs">Success</p>
                <p className="text-2xl">
                  {workflow.successRate}%
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {workflow.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>

            <p className="mt-5 text-xs text-[color:var(--muted)]">
              Last run {formatRelativeDate(workflow.lastRunAt)}
            </p>

            <form action={deleteWorkflowAction} className="mt-4">
              <input type="hidden" name="workflowId" value={workflow.id} />
              <button
                type="submit"
                className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700"
              >
                Delete
              </button>
            </form>
          </Card>
        ))}
        </div>
      </div>
    </AppShell>
  );
}
