import { createId } from "@/lib/utils";
import { compileWorkflowDefinition } from "@/lib/workflow/compiler";
import type {
  AuditLogEvent,
  ExecutionContext,
  UsageEventPayload,
  WorkflowDefinition,
  WorkflowRunSummary,
} from "@/lib/workflow/types";

type PublishDraftInput = {
  workflowId: string;
  currentVersionNumber: number;
  actorId: string;
  actorEmail: string;
  definition: WorkflowDefinition;
};

export function publishDraftVersion(input: PublishDraftInput) {
  const compiled = compileWorkflowDefinition(input.definition);
  const versionNumber = input.currentVersionNumber + 1;

  return {
    versionId: createId("wfver"),
    versionNumber,
    status: "ACTIVE" as const,
    compiled,
    audit: {
      id: createId("audit"),
      actor: input.actorEmail,
      action: "workflow.publish",
      target: input.workflowId,
      occurredAt: new Date().toISOString(),
      metadata: {
        versionNumber,
        triggerSource: compiled.trigger.source,
      },
    } satisfies AuditLogEvent,
  };
}

type RunEnvelopeInput = {
  workflowId: string;
  workflowName: string;
  triggerSource: "MANUAL" | "WEBHOOK" | "SCHEDULE";
};

export function createRunEnvelope(input: RunEnvelopeInput): WorkflowRunSummary {
  const queuedAt = new Date().toISOString();

  return {
    id: createId("run"),
    workflowId: input.workflowId,
    workflowName: input.workflowName,
    status: "QUEUED",
    triggerSource: input.triggerSource,
    queuedAt,
    correlationId: createId("corr"),
    steps: [],
  };
}

export function createExecutionContext(args: {
  organizationId: string;
  workflowId: string;
  workflowVersionId: string;
  actorId: string;
  actorEmail: string;
  triggerSource: "MANUAL" | "WEBHOOK" | "SCHEDULE";
  input: Record<string, unknown>;
}): ExecutionContext {
  const correlationId = createId("corr");

  return {
    organizationId: args.organizationId,
    workflowId: args.workflowId,
    workflowVersionId: args.workflowVersionId,
    actorId: args.actorId,
    actorEmail: args.actorEmail,
    triggerSource: args.triggerSource,
    correlationId,
    idempotencyKey: `${args.workflowId}:${args.workflowVersionId}:${correlationId}`,
    secrets: {},
    input: args.input,
  };
}

export function recordUsageEvent(
  input: UsageEventPayload,
): UsageEventPayload & {
  recordedAt: string;
} {
  return {
    ...input,
    recordedAt: new Date().toISOString(),
  };
}
