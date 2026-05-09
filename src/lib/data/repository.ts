import type { Prisma } from "@prisma/client";

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
import { createSlug } from "@/lib/utils";
import { createDefaultWorkflowDefinition } from "@/lib/workflow/defaults";
import type {
  AuditLogEvent,
  ConnectorSummary,
  WorkflowDefinition,
  WorkflowRunSummary,
  WorkflowSummary,
  WorkflowTriggerSource,
  WorkspaceSnapshot,
} from "@/lib/workflow/types";

type PrismaClient = NonNullable<ReturnType<typeof getPrismaClient>>;
type WorkflowPublishResult = {
  versionId: string;
  versionNumber: number;
  definition: WorkflowDefinition;
};

type WorkflowCreateResult = {
  id: string;
  slug: string;
  definition: WorkflowDefinition;
};

type DemoWorkflowVersion = {
  id: string;
  versionNumber: number;
  definition: WorkflowDefinition;
};

type DemoWorkflowRecord = {
  workflowId: string;
  slug: string;
  name: string;
  description: string;
  status: WorkflowSummary["status"];
  triggerSource: WorkflowTriggerSource;
  tags: string[];
  lastRunAt: string;
  successRate: number;
  runsToday: number;
  latestVersionNumber: number;
  activeVersionId: string | null;
  draftDefinition: WorkflowDefinition;
  versions: DemoWorkflowVersion[];
};

declare global {
  var demoWorkflowStore: Map<string, DemoWorkflowRecord> | undefined;
}

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

function cloneDefinition(definition: WorkflowDefinition): WorkflowDefinition {
  return JSON.parse(JSON.stringify(definition)) as WorkflowDefinition;
}

function ensureDefinition(definition: WorkflowDefinition, workflowId: string) {
  return {
    ...cloneDefinition(definition),
    workflowId,
  };
}

function toPrismaJson(definition: WorkflowDefinition) {
  return definition as unknown as Prisma.InputJsonValue;
}

function buildDemoVersionId(workflowId: string, versionNumber: number) {
  return `demo_version_${workflowId}_${versionNumber}`;
}

function getDraftVersionNumber(
  latestVersionNumber: number,
  draftVersion?: number,
) {
  if (latestVersionNumber > 0) {
    return Math.max(latestVersionNumber, draftVersion ?? latestVersionNumber);
  }

  return Math.max(draftVersion ?? 1, 1);
}

function getNextVersionNumber(
  latestVersionNumber: number,
  draftVersion?: number,
) {
  return latestVersionNumber > 0
    ? latestVersionNumber + 1
    : Math.max(draftVersion ?? 1, 1);
}

function createWorkflowId(slug: string) {
  return `wf_${slug.replace(/-/g, "_")}`;
}

function createSeedDemoWorkflow(summary: WorkflowSummary): DemoWorkflowRecord {
  const draftDefinition =
    summary.id === sampleWorkflowDefinition.workflowId
      ? cloneDefinition(sampleWorkflowDefinition)
      : createDefaultWorkflowDefinition({
          workflowId: summary.id,
          name: summary.name,
          triggerSource: summary.triggerSource,
          version: summary.version,
        });

  if (summary.status === "DRAFT") {
    const activeVersionNumber = Math.max(summary.version - 1, 0);
    const activeDefinition =
      activeVersionNumber > 0
        ? createDefaultWorkflowDefinition({
            workflowId: summary.id,
            name: summary.name,
            triggerSource: summary.triggerSource,
            version: activeVersionNumber,
          })
        : null;

    return {
      workflowId: summary.id,
      slug: summary.slug,
      name: summary.name,
      description: summary.description,
      status: summary.status,
      triggerSource: summary.triggerSource,
      tags: [...summary.tags],
      lastRunAt: summary.lastRunAt,
      successRate: summary.successRate,
      runsToday: summary.runsToday,
      latestVersionNumber: activeVersionNumber,
      activeVersionId:
        activeVersionNumber > 0
          ? buildDemoVersionId(summary.id, activeVersionNumber)
          : null,
      draftDefinition,
      versions:
        activeDefinition && activeVersionNumber > 0
          ? [
              {
                id: buildDemoVersionId(summary.id, activeVersionNumber),
                versionNumber: activeVersionNumber,
                definition: activeDefinition,
              },
            ]
          : [],
    };
  }

  return {
    workflowId: summary.id,
    slug: summary.slug,
    name: summary.name,
    description: summary.description,
    status: summary.status,
    triggerSource: summary.triggerSource,
    tags: [...summary.tags],
    lastRunAt: summary.lastRunAt,
    successRate: summary.successRate,
    runsToday: summary.runsToday,
    latestVersionNumber: summary.version,
    activeVersionId: buildDemoVersionId(summary.id, summary.version),
    draftDefinition,
    versions: [
      {
        id: buildDemoVersionId(summary.id, summary.version),
        versionNumber: summary.version,
        definition: cloneDefinition(draftDefinition),
      },
    ],
  };
}

function createDemoWorkflowRecord(args: {
  workflowId: string;
  slug: string;
  name: string;
  description?: string;
  triggerSource?: WorkflowTriggerSource;
}) {
  const definition = createDefaultWorkflowDefinition({
    workflowId: args.workflowId,
    name: args.name,
    triggerSource: args.triggerSource ?? "MANUAL",
    version: 1,
  });

  return {
    workflowId: args.workflowId,
    slug: args.slug,
    name: args.name,
    description: args.description ?? "Draft workflow ready for visual editing.",
    status: "DRAFT" as const,
    triggerSource: definition.triggerSource,
    tags: ["draft"],
    lastRunAt: new Date().toISOString(),
    successRate: 100,
    runsToday: 0,
    latestVersionNumber: 0,
    activeVersionId: null,
    draftDefinition: definition,
    versions: [],
  };
}

function createWorkflowSummaryFromRecord(
  record: DemoWorkflowRecord,
): WorkflowSummary {
  return {
    id: record.workflowId,
    name: record.name,
    slug: record.slug,
    description: record.description,
    status: record.status,
    triggerSource: record.triggerSource,
    lastRunAt: record.lastRunAt,
    successRate: record.successRate,
    runsToday: record.runsToday,
    version: getDraftVersionNumber(
      record.latestVersionNumber,
      record.draftDefinition.version,
    ),
    tags: record.tags,
  };
}

function getDemoWorkflowSummaries() {
  return Array.from(getDemoWorkflowStore().values())
    .map(createWorkflowSummaryFromRecord)
    .sort(
      (left, right) =>
        new Date(right.lastRunAt).getTime() - new Date(left.lastRunAt).getTime(),
    );
}

function getUniqueDemoIdentifiers(name: string) {
  const store = getDemoWorkflowStore();
  const baseSlug = createSlug(name) || "workflow";
  let suffix = 0;

  while (true) {
    const slug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const workflowId = createWorkflowId(slug);
    const collision = Array.from(store.values()).some(
      (record) => record.slug === slug || record.workflowId === workflowId,
    );

    if (!collision) {
      return { workflowId, slug };
    }

    suffix += 1;
  }
}

async function getUniqueDbIdentifiers(
  prisma: PrismaClient,
  organizationId: string,
  name: string,
) {
  const baseSlug = createSlug(name) || "workflow";
  let suffix = 0;

  while (true) {
    const slug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const workflowId = createWorkflowId(slug);
    const existing = await prisma.workflow.findFirst({
      where: {
        OR: [
          { id: workflowId },
          {
            organizationId,
            slug,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return { workflowId, slug };
    }

    suffix += 1;
  }
}

function getDemoWorkflowStore() {
  if (!global.demoWorkflowStore) {
    global.demoWorkflowStore = new Map<string, DemoWorkflowRecord>();
    workflowSummaries.forEach((summary) => {
      global.demoWorkflowStore?.set(summary.id, createSeedDemoWorkflow(summary));
    });
  }

  return global.demoWorkflowStore;
}

function getOrCreateDemoWorkflow(workflowId: string, name?: string) {
  const store = getDemoWorkflowStore();
  const existing = store.get(workflowId);

  if (existing) {
    return existing;
  }

  const slug = createSlug(name ?? workflowId.replace(/^wf_/, "").replace(/_/g, " ")) || "workflow";
  const record = createDemoWorkflowRecord({
    workflowId,
    slug,
    name: name ?? "Untitled workflow",
  });

  store.set(workflowId, record);

  return record;
}

export async function getWorkflowSummaries(): Promise<WorkflowSummary[]> {
  return withFallback(async () => {
    const prisma = getPrismaClient();

    if (!prisma) {
      return getDemoWorkflowSummaries();
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
      version: getDraftVersionNumber(
        workflow.latestVersionNumber,
        (workflow.draftDefinition as WorkflowDefinition | null)?.version,
      ),
      tags: workflow.tags,
    }));
  }, getDemoWorkflowSummaries());
}

export async function getWorkflowById(
  workflowId: string,
): Promise<WorkflowDefinition | null> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return cloneDefinition(getOrCreateDemoWorkflow(workflowId).draftDefinition);
  }

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return null;
    }

    const draftDefinition = workflow.draftDefinition as WorkflowDefinition | null;

    if (draftDefinition) {
      return {
        ...draftDefinition,
        workflowId: workflow.id,
        name: draftDefinition.name ?? workflow.name,
        version: getDraftVersionNumber(
          workflow.latestVersionNumber,
          draftDefinition.version,
        ),
        triggerSource: draftDefinition.triggerSource ?? workflow.triggerType,
      };
    }

    if (!workflow.activeVersionId) {
      return null;
    }

    const activeVersion = await prisma.workflowVersion.findUnique({
      where: { id: workflow.activeVersionId },
    });

    return activeVersion
      ? ({
          ...(activeVersion.definition as WorkflowDefinition),
          workflowId: workflow.id,
          name: workflow.name,
          version: activeVersion.versionNumber,
        } satisfies WorkflowDefinition)
      : null;
  } catch {
    return cloneDefinition(getOrCreateDemoWorkflow(workflowId).draftDefinition);
  }
}

export async function createWorkflow(input: {
  name?: string;
  organizationId: string;
  actorId: string;
}): Promise<WorkflowCreateResult> {
  const name = input.name?.trim() || "Untitled workflow";
  const prisma = getPrismaClient();

  if (!prisma) {
    const { workflowId, slug } = getUniqueDemoIdentifiers(name);
    const record = createDemoWorkflowRecord({
      workflowId,
      slug,
      name,
    });

    getDemoWorkflowStore().set(workflowId, record);

    return {
      id: workflowId,
      slug,
      definition: cloneDefinition(record.draftDefinition),
    };
  }

  try {
    const { workflowId, slug } = await getUniqueDbIdentifiers(
      prisma,
      input.organizationId,
      name,
    );
    const definition = createDefaultWorkflowDefinition({
      workflowId,
      name,
      version: 1,
      triggerSource: "MANUAL",
    });

    await prisma.workflow.create({
      data: {
        id: workflowId,
        organizationId: input.organizationId,
        name,
        slug,
        description: "Draft workflow ready for visual editing.",
        status: "DRAFT",
        triggerType: definition.triggerSource,
        latestVersionNumber: 0,
        draftDefinition: toPrismaJson(definition),
        tags: ["draft"],
        createdById: input.actorId,
        updatedById: input.actorId,
      },
    });

    return {
      id: workflowId,
      slug,
      definition,
    };
  } catch {
    const { workflowId, slug } = getUniqueDemoIdentifiers(name);
    const record = createDemoWorkflowRecord({
      workflowId,
      slug,
      name,
    });

    getDemoWorkflowStore().set(workflowId, record);

    return {
      id: workflowId,
      slug,
      definition: cloneDefinition(record.draftDefinition),
    };
  }
}

export async function deleteWorkflow(workflowId: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    getDemoWorkflowStore().delete(workflowId);
    return { ok: true, isDemo: true };
  }

  try {
    await prisma.workflow.delete({
      where: { id: workflowId },
    });

    return { ok: true, isDemo: false };
  } catch {
    getDemoWorkflowStore().delete(workflowId);
    return { ok: true, isDemo: true };
  }
}

export async function saveWorkflowDraft(
  workflowId: string,
  definition: WorkflowDefinition,
  updatedById?: string,
) {
  const normalized = ensureDefinition(definition, workflowId);
  const prisma = getPrismaClient();

  if (!prisma) {
    const record = getOrCreateDemoWorkflow(workflowId);
    record.name = normalized.name;
    record.triggerSource = normalized.triggerSource;
    record.lastRunAt = new Date().toISOString();
    record.draftDefinition = {
      ...normalized,
      version: getDraftVersionNumber(
        record.latestVersionNumber,
        normalized.version,
      ),
    };

    return {
      definition: cloneDefinition(record.draftDefinition),
      versionNumber: record.draftDefinition.version,
      activeVersionId: record.activeVersionId,
      isDemo: true,
    };
  }

  try {
    const existing = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        latestVersionNumber: true,
        activeVersionId: true,
      },
    });

    if (!existing) {
      throw new Error("Workflow not found");
    }

    const nextVersion = getDraftVersionNumber(
      existing.latestVersionNumber,
      normalized.version,
    );

    const workflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        draftDefinition: toPrismaJson({
          ...normalized,
          version: nextVersion,
        }),
        name: normalized.name,
        triggerType: normalized.triggerSource,
        updatedById: updatedById ?? "system",
      },
    });

    return {
      definition: {
        ...normalized,
        version: nextVersion,
      },
      versionNumber: nextVersion,
      activeVersionId: workflow.activeVersionId,
      isDemo: false,
    };
  } catch {
    const record = getOrCreateDemoWorkflow(workflowId);
    record.name = normalized.name;
    record.triggerSource = normalized.triggerSource;
    record.lastRunAt = new Date().toISOString();
    record.draftDefinition = {
      ...normalized,
      version: getDraftVersionNumber(
        record.latestVersionNumber,
        normalized.version,
      ),
    };

    return {
      definition: cloneDefinition(record.draftDefinition),
      versionNumber: record.draftDefinition.version,
      activeVersionId: record.activeVersionId,
      isDemo: true,
    };
  }
}

export async function publishWorkflow(
  workflowId: string,
  definition: WorkflowDefinition,
  actor?: {
    id?: string;
    email?: string;
  },
): Promise<WorkflowPublishResult> {
  const normalized = ensureDefinition(definition, workflowId);
  const prisma = getPrismaClient();

  if (!prisma) {
    const record = getOrCreateDemoWorkflow(workflowId);
    const versionNumber = getNextVersionNumber(
      record.latestVersionNumber,
      normalized.version,
    );
    const versionId = buildDemoVersionId(workflowId, versionNumber);
    const publishedDefinition = {
      ...normalized,
      version: versionNumber,
    };

    record.latestVersionNumber = versionNumber;
    record.activeVersionId = versionId;
    record.name = publishedDefinition.name;
    record.triggerSource = publishedDefinition.triggerSource;
    record.status = "ACTIVE";
    record.lastRunAt = new Date().toISOString();
    record.draftDefinition = cloneDefinition(publishedDefinition);
    record.versions.unshift({
      id: versionId,
      versionNumber,
      definition: cloneDefinition(publishedDefinition),
    });

    return {
      versionId,
      versionNumber,
      definition: cloneDefinition(publishedDefinition),
    };
  }

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const versionNumber = getNextVersionNumber(
      workflow.latestVersionNumber,
      normalized.version,
    );
    const publishedDefinition = {
      ...normalized,
      version: versionNumber,
    };

    const newVersion = await prisma.workflowVersion.create({
      data: {
        workflowId,
        versionNumber,
        definition: toPrismaJson(publishedDefinition),
        publishedById: actor?.id,
        publishedByEmail: actor?.email,
      },
    });

    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        latestVersionNumber: versionNumber,
        activeVersionId: newVersion.id,
        draftDefinition: toPrismaJson(publishedDefinition),
        name: publishedDefinition.name,
        triggerType: publishedDefinition.triggerSource,
        status: "ACTIVE",
        updatedById: actor?.id ?? workflow.updatedById,
      },
    });

    return {
      versionId: newVersion.id,
      versionNumber,
      definition: publishedDefinition,
    };
  } catch {
    const record = getOrCreateDemoWorkflow(workflowId);
    const versionNumber = getNextVersionNumber(
      record.latestVersionNumber,
      normalized.version,
    );
    const versionId = buildDemoVersionId(workflowId, versionNumber);
    const publishedDefinition = {
      ...normalized,
      version: versionNumber,
    };

    record.latestVersionNumber = versionNumber;
    record.activeVersionId = versionId;
    record.name = publishedDefinition.name;
    record.triggerSource = publishedDefinition.triggerSource;
    record.status = "ACTIVE";
    record.lastRunAt = new Date().toISOString();
    record.draftDefinition = cloneDefinition(publishedDefinition);
    record.versions.unshift({
      id: versionId,
      versionNumber,
      definition: cloneDefinition(publishedDefinition),
    });

    return {
      versionId,
      versionNumber,
      definition: cloneDefinition(publishedDefinition),
    };
  }
}

export async function getExecutionWorkflowById(
  workflowId: string,
): Promise<WorkflowDefinition | null> {
  const prisma = getPrismaClient();

  if (!prisma) {
    const record = getOrCreateDemoWorkflow(workflowId);

    if (!record.activeVersionId) {
      return null;
    }

    const activeVersion = record.versions.find(
      (version) => version.id === record.activeVersionId,
    );

    return activeVersion ? cloneDefinition(activeVersion.definition) : null;
  }

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return null;
    }

    if (!workflow.activeVersionId) {
      return null;
    }

    const activeVersion = await prisma.workflowVersion.findUnique({
      where: { id: workflow.activeVersionId },
    });

    return activeVersion
      ? (activeVersion.definition as WorkflowDefinition)
      : ((workflow.draftDefinition as WorkflowDefinition | null) ?? null);
  } catch {
    const record = getOrCreateDemoWorkflow(workflowId);

    if (!record.activeVersionId) {
      return null;
    }

    const activeVersion = record.versions.find(
      (version) => version.id === record.activeVersionId,
    );

    return activeVersion ? cloneDefinition(activeVersion.definition) : null;
  }
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
