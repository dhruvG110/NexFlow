import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  getConnectorSummaries,
  getWorkflowRunSummaries,
  getWorkflowSummaries,
} from "@/lib/data/repository";
import { formatRelativeDate } from "@/lib/utils";

export default async function DashboardPage() {
  const [workflows, runs, connectors] = await Promise.all([
    getWorkflowSummaries(),
    getWorkflowRunSummaries(),
    getConnectorSummaries(),
  ]);

  const successfulRuns = runs.filter((run) => run.status === "SUCCEEDED").length;
  const successRate = runs.length > 0 ? Math.round((successfulRuns / runs.length) * 100) : 0;

  return (
    <AppShell
      eyebrow="Overview"
      title="Operational automation, with actual guardrails."
      description="Watch run health, workflow throughput, and connector readiness from one control surface. The demo data falls away automatically when your database and auth environment are configured."
      actions={
        <Link
          href="/workflows/wf_customer_router"
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d75c24]"
        >
          Open editor
          <ArrowRight className="size-4" />
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active workflows"
          value={String(workflows.filter((workflow) => workflow.status === "ACTIVE").length)}
          caption="Live"
          tone="success"
        />
        <MetricCard
          label="Runs today"
          value={String(workflows.reduce((sum, workflow) => sum + workflow.runsToday, 0))}
          caption="Metered"
          tone="info"
        />
        <MetricCard
          label="Recent success rate"
          value={`${successRate}%`}
          caption="7-day"
          tone={successRate > 95 ? "success" : "warning"}
        />
        <MetricCard
          label="Connected providers"
          value={String(connectors.filter((connector) => connector.connectedAccounts > 0).length)}
          caption="Ready"
          tone="default"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Workflows
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                High-signal automations
              </h2>
            </div>
            <Link href="/workflows" className="text-sm font-semibold text-[color:var(--accent)]">
              View all
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {workflows.map((workflow) => (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--line)] bg-[color:var(--panel)] p-4 transition hover:border-[color:var(--accent)] md:flex-row md:items-center md:justify-between"
              >
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
                  <h3 className="mt-3 text-xl font-semibold text-[color:var(--ink)]">
                    {workflow.name}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    {workflow.description}
                  </p>
                </div>
                <div className="grid gap-2 text-sm text-[color:var(--muted)] md:text-right">
                  <span>{workflow.runsToday} runs today</span>
                  <span>{workflow.successRate}% success</span>
                  <span>Updated {formatRelativeDate(workflow.lastRunAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Recent runs
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                  Execution pulse
                </h2>
              </div>
              <Link href="/runs" className="text-sm font-semibold text-[color:var(--accent)]">
                Open runs
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {runs.slice(0, 4).map((run) => (
                <Link
                  key={run.id}
                  href={`/runs/${run.id}`}
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-[color:var(--line)] bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[color:var(--accent-soft)] p-2 text-[color:var(--accent)]">
                      <PlayCircle className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--ink)]">
                        {run.workflowName}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        {run.correlationId}
                      </p>
                    </div>
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
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Connector readiness
            </p>
            <div className="mt-4 space-y-3">
              {connectors.slice(0, 4).map((connector) => (
                <div
                  key={connector.provider}
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--ink)]">
                      {connector.name}
                    </p>
                    <p className="text-xs leading-6 text-[color:var(--muted)]">
                      {connector.description}
                    </p>
                  </div>
                  <Badge
                    variant={
                      connector.status === "connected"
                        ? "success"
                        : connector.status === "attention"
                          ? "warning"
                          : "default"
                    }
                  >
                    {connector.connectedAccounts}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
