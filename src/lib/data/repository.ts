import {
  auditLogEvents,
  connectorSummaries,
  sampleWorkflowDefinition,
  workflowRuns,
  workflowSummaries,
  workspaceSnapshot,
} from "@/lib/data/demo-data";
import { featureFlags } from "@/lib/env";
import { getPrismaClient } from "@/lib/prisma";
import type {
  AuditLogEvent,
  ConnectorSummary,
  WorkflowDefinition,
  WorkflowRunSummary,
  WorkflowSummary,
  WorkspaceSnapshot,
} from "@/lib/workflow/types";

async function withFallback<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  if (!featureFlags.hasDatabase) {
    return fallback;
  }

  try {
    return await loader();
  } catch {
    return fallback;
  }
}

export async function getWorkflowSummaries(): Promise<WorkflowSummary[]> {
  return withFallback(async () => {
    const prisma = getPrismaClient();

    if (!prisma) {
      return workflowSummaries;
    }

    const workflows = await prisma.workflow.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 12,
    });

    return workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      slug: workflow.slug,
      description: workflow.description ?? "No description provided yet.",
      status: workflow.status,
      triggerSource: workflow.triggerType,
      lastRunAt: workflow.updatedAt.toISOString(),
      successRate: 100,
      runsToday: 0,
      version: workflow.latestVersionNumber,
      tags: workflow.tags,
    }));
  }, workflowSummaries);
}

export async function getWorkflowById(
  workflowId: string,
): Promise<WorkflowDefinition> {
  return withFallback(async () => {
    const prisma = getPrismaClient();

    if (!prisma) {
      return sampleWorkflowDefinition;
    }

    const workflow = await prisma.workflow.findUnique({
      where: {
        id: workflowId,
      },
    });

    return (workflow?.draftDefinition as WorkflowDefinition | undefined) ?? sampleWorkflowDefinition;
  }, sampleWorkflowDefinition);
}

export async function getWorkflowRunSummaries(): Promise<WorkflowRunSummary[]> {
  return withFallback(async () => {
    const prisma = getPrismaClient();

    if (!prisma) {
      return workflowRuns;
    }

    const runs = await prisma.workflowRun.findMany({
      include: {
        workflow: true,
        stepRuns: true,
      },
      orderBy: {
        queuedAt: "desc",
      },
      take: 25,
    });

    return runs.map((run) => ({
      id: run.id,
      workflowId: run.workflowId,
      workflowName: run.workflow.name,
      status: run.status,
      triggerSource: run.triggerType,
      queuedAt: run.queuedAt.toISOString(),
      completedAt: run.completedAt?.toISOString(),
      durationMs:
        run.completedAt && run.startedAt
          ? run.completedAt.getTime() - run.startedAt.getTime()
          : undefined,
      correlationId: run.correlationId,
      steps: run.stepRuns.map((stepRun) => ({
        id: stepRun.id,
        label: stepRun.nodeId,
        status: stepRun.status,
      })),
    }));
  }, workflowRuns);
}

export async function getWorkflowRunById(
  runId: string,
): Promise<WorkflowRunSummary | undefined> {
  const runs = await getWorkflowRunSummaries();

  return runs.find((run) => run.id === runId);
}

export async function getConnectorSummaries(): Promise<ConnectorSummary[]> {
  return withFallback(async () => {
    const prisma = getPrismaClient();

    if (!prisma) {
      return connectorSummaries;
    }

    const accounts = await prisma.connectorAccount.findMany();
    const counts = accounts.reduce<Record<string, number>>((acc, account) => {
      acc[account.provider] = (acc[account.provider] ?? 0) + 1;
      return acc;
    }, {});

    return connectorSummaries.map((connector) => ({
      ...connector,
      connectedAccounts: counts[connector.provider] ?? 0,
      status: (counts[connector.provider] ?? 0) > 0 ? "connected" : "planned",
    }));
  }, connectorSummaries);
}

export async function getAuditLogEvents(): Promise<AuditLogEvent[]> {
  return withFallback(async () => {
    const prisma = getPrismaClient();

    if (!prisma) {
      return auditLogEvents;
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: {
        occurredAt: "desc",
      },
      take: 20,
    });

    return logs.map((log) => ({
      id: log.id,
      actor: log.actorEmail,
      action: log.action,
      target: log.targetType,
      occurredAt: log.occurredAt.toISOString(),
      metadata: (log.metadata as Record<string, unknown> | null) ?? undefined,
    }));
  }, auditLogEvents);
}

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  return withFallback(async () => {
    const prisma = getPrismaClient();

    if (!prisma) {
      return workspaceSnapshot;
    }

    const organization = await prisma.organization.findFirst({
      include: {
        memberships: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!organization) {
      return workspaceSnapshot;
    }

    return {
      name: organization.name,
      slug: organization.slug,
      members: organization.memberships.map((membership) => ({
        name: membership.name,
        email: membership.email,
        role: membership.role,
      })),
      usage: workspaceSnapshot.usage,
    };
  }, workspaceSnapshot);
}
