import { getConnectorHandler } from "@/lib/connectors/registry";
import { queueWorkflowExecution } from "@/lib/runtime/trigger-client";
import { createExecutionContext, createRunEnvelope, recordUsageEvent } from "@/lib/workflow/service";
import { compileWorkflowDefinition } from "@/lib/workflow/compiler";
import type {
  ConnectorProvider,
  ExecutionPayload,
  WorkflowDefinition,
  WorkflowTriggerSource,
} from "@/lib/workflow/types";

export async function dispatchWorkflowRun(args: {
  organizationId: string;
  actorId: string;
  actorEmail: string;
  workflowDefinition: WorkflowDefinition;
  workflowVersionId: string;
  input: Record<string, unknown>;
}) {
  const compiled = compileWorkflowDefinition(args.workflowDefinition);
  const run = createRunEnvelope({
    workflowId: args.workflowDefinition.workflowId,
    workflowName: args.workflowDefinition.name,
    triggerSource: args.workflowDefinition.triggerSource,
  });

  const context = createExecutionContext({
    organizationId: args.organizationId,
    workflowId: args.workflowDefinition.workflowId,
    workflowVersionId: args.workflowVersionId,
    actorId: args.actorId,
    actorEmail: args.actorEmail,
    triggerSource: args.workflowDefinition.triggerSource,
    input: args.input,
  });

  const payload: ExecutionPayload = {
    run,
    compiled,
    context,
  };

  const dispatch = await queueWorkflowExecution(payload);
  const usageEvent = recordUsageEvent({
    meterName: "workflow.run.triggered",
    quantity: 1,
    organizationId: args.organizationId,
    workflowId: args.workflowDefinition.workflowId,
    runId: run.id,
    metadata: {
      triggerSource: args.workflowDefinition.triggerSource,
      dispatchProvider: dispatch.provider,
    },
  });

  return {
    run,
    context,
    dispatch,
    usageEvent,
  };
}

export async function startConnectorOAuth(
  provider: ConnectorProvider,
  appUrl: string,
) {
  const connector = getConnectorHandler(provider);
  const redirectUri = `${appUrl}/api/connectors/${provider}/oauth/callback`;

  return connector.authorize({ redirectUri });
}

export function completeConnectorOAuth(provider: ConnectorProvider, code: string) {
  return {
    provider,
    status: "connected" as const,
    externalAccountId: `acct_${code.slice(0, 8)}`,
    receivedCode: code,
  };
}

export function buildWebhookReceipt(args: {
  source: string;
  secret: string;
  payload: Record<string, unknown>;
  triggerSource?: WorkflowTriggerSource;
}) {
  return {
    accepted: true,
    source: args.source,
    secretPreview: `${args.secret.slice(0, 4)}...${args.secret.slice(-4)}`,
    triggerSource: args.triggerSource ?? "WEBHOOK",
    payload: args.payload,
  };
}
