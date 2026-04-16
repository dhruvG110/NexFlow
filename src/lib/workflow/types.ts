export const connectorProviders = [
  "SLACK",
  "GOOGLE_SHEETS",
  "NOTION",
  "AIRTABLE",
  "HUBSPOT",
  "HTTP",
] as const;

export const workflowProviders = ["CORE", ...connectorProviders] as const;

export const workflowNodeKinds = [
  "TRIGGER",
  "ACTION",
  "CONDITION",
  "LOOP",
] as const;

export const workflowNodeTypes = [
  "manualTrigger",
  "webhookTrigger",
  "scheduleTrigger",
  "httpRequest",
  "slackMessage",
  "googleSheetsAppend",
  "notionCreatePage",
  "airtableCreateRecord",
  "hubspotCreateRecord",
  "branch",
  "loop",
] as const;

export const workflowTriggerSources = ["MANUAL", "WEBHOOK", "SCHEDULE"] as const;

export const workflowRunStatuses = [
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "DEAD_LETTER",
] as const;

export type ConnectorProvider = (typeof connectorProviders)[number];
export type WorkflowProvider = (typeof workflowProviders)[number];
export type WorkflowNodeKind = (typeof workflowNodeKinds)[number];
export type WorkflowNodeType = (typeof workflowNodeTypes)[number];
export type WorkflowTriggerSource = (typeof workflowTriggerSources)[number];
export type WorkflowRunStatus = (typeof workflowRunStatuses)[number];

export type NodePosition = {
  x: number;
  y: number;
};

export type RetryPolicy = {
  maxAttempts: number;
  backoffMs: number;
  strategy: "fixed" | "exponential";
};

export type WorkflowNodeConfig =
  | {
      nodeType: "manualTrigger";
      samplePayload: Record<string, unknown>;
    }
  | {
      nodeType: "webhookTrigger";
      source: string;
      path: string;
      signatureHeader: string;
    }
  | {
      nodeType: "scheduleTrigger";
      cron: string;
      timezone: string;
    }
  | {
      nodeType: "httpRequest";
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      url: string;
      headers: Record<string, string>;
      bodyTemplate: string;
    }
  | {
      nodeType: "slackMessage";
      channel: string;
      messageTemplate: string;
    }
  | {
      nodeType: "googleSheetsAppend";
      spreadsheetId: string;
      sheetName: string;
      rowMapping: Record<string, string>;
    }
  | {
      nodeType: "notionCreatePage";
      databaseId: string;
      titleTemplate: string;
      contentTemplate: string;
    }
  | {
      nodeType: "airtableCreateRecord";
      baseId: string;
      tableId: string;
      fieldMapping: Record<string, string>;
    }
  | {
      nodeType: "hubspotCreateRecord";
      objectType: "contact" | "company" | "deal";
      pipelineId: string;
      fieldMapping: Record<string, string>;
    }
  | {
      nodeType: "branch";
      expression: string;
      trueLabel: string;
      falseLabel: string;
    }
  | {
      nodeType: "loop";
      iterateOn: string;
      itemAlias: string;
      maxIterations: number;
    };

export type WorkflowCanvasNode = {
  id: string;
  label: string;
  kind: WorkflowNodeKind;
  provider: WorkflowProvider;
  nodeType: WorkflowNodeType;
  description?: string;
  position: NodePosition;
  config: WorkflowNodeConfig;
};

export type WorkflowCanvasEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: {
    branch?: "true" | "false";
    expression?: string;
  };
};

export type WorkflowDefinition = {
  workflowId: string;
  version: number;
  name: string;
  triggerSource: WorkflowTriggerSource;
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
  settings: {
    timeoutInSeconds: number;
    concurrencyKey: string;
    defaultRetryPolicy: RetryPolicy;
  };
};

export type CompiledWorkflowNode = WorkflowCanvasNode & {
  downstreamNodeIds: string[];
  retryPolicy: RetryPolicy;
};

export type CompiledWorkflowDefinition = {
  workflowId: string;
  version: number;
  name: string;
  trigger: {
    nodeId: string;
    source: WorkflowTriggerSource;
    config: WorkflowNodeConfig;
  };
  nodes: CompiledWorkflowNode[];
  edges: WorkflowCanvasEdge[];
  conditions: Array<{
    nodeId: string;
    expression: string;
  }>;
  loops: Array<{
    nodeId: string;
    iterateOn: string;
    itemAlias: string;
    maxIterations: number;
  }>;
  timeouts: {
    workflow: number;
  };
  retryPolicy: RetryPolicy;
  idempotencyKeyTemplate: string;
};

export type ExecutionContext = {
  organizationId: string;
  workflowId: string;
  workflowVersionId: string;
  actorId: string;
  actorEmail: string;
  triggerSource: WorkflowTriggerSource;
  correlationId: string;
  idempotencyKey: string;
  secrets: Record<string, string>;
  input: Record<string, unknown>;
};

export type StepResult = {
  nodeId: string;
  provider: WorkflowProvider;
  status: "SUCCEEDED" | "FAILED" | "SKIPPED" | "RETRYING";
  output: Record<string, unknown>;
  errorClass?: "TRANSIENT" | "AUTH" | "VALIDATION" | "UNKNOWN";
  retryable: boolean;
  attempts: number;
};

export type UsageEventPayload = {
  meterName: string;
  quantity: number;
  organizationId: string;
  workflowId?: string;
  runId?: string;
  metadata?: Record<string, unknown>;
};

export type WorkflowSummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  triggerSource: WorkflowTriggerSource;
  lastRunAt: string;
  successRate: number;
  runsToday: number;
  version: number;
  tags: string[];
};

export type WorkflowRunSummary = {
  id: string;
  workflowId: string;
  workflowName: string;
  status: WorkflowRunStatus;
  triggerSource: WorkflowTriggerSource;
  queuedAt: string;
  completedAt?: string;
  durationMs?: number;
  correlationId: string;
  steps: Array<{
    id: string;
    label: string;
    status:
      | "PENDING"
      | "RUNNING"
      | "SUCCEEDED"
      | "FAILED"
      | "SKIPPED"
      | "RETRYING";
  }>;
};

export type ConnectorSummary = {
  provider: ConnectorProvider;
  name: string;
  status: "connected" | "attention" | "planned";
  connectedAccounts: number;
  description: string;
};

export type AuditLogEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

export type WorkspaceSnapshot = {
  name: string;
  slug: string;
  members: Array<{
    name: string;
    email: string;
    role: "OWNER" | "ADMIN" | "BUILDER" | "VIEWER";
  }>;
  usage: Array<{
    label: string;
    value: string;
    change: string;
  }>;
};

export type ExecutionPayload = {
  run: WorkflowRunSummary;
  compiled: CompiledWorkflowDefinition;
  context: ExecutionContext;
};
