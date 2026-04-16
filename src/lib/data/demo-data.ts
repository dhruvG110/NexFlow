import { compileWorkflowDefinition } from "@/lib/workflow/compiler";
import type {
  AuditLogEvent,
  ConnectorSummary,
  WorkflowDefinition,
  WorkflowRunSummary,
  WorkflowSummary,
  WorkspaceSnapshot,
} from "@/lib/workflow/types";

export const sampleWorkflowDefinition: WorkflowDefinition = {
  workflowId: "wf_customer_router",
  version: 3,
  name: "Customer Signal Router",
  triggerSource: "WEBHOOK",
  nodes: [
    {
      id: "node_webhook",
      label: "Customer Webhook",
      kind: "TRIGGER",
      provider: "CORE",
      nodeType: "webhookTrigger",
      position: { x: 40, y: 180 },
      description: "Receives product events from your app.",
      config: {
        nodeType: "webhookTrigger",
        source: "product",
        path: "/api/webhooks/product/:secret",
        signatureHeader: "x-product-signature",
      },
    },
    {
      id: "node_http",
      label: "Enrich Payload",
      kind: "ACTION",
      provider: "HTTP",
      nodeType: "httpRequest",
      position: { x: 280, y: 180 },
      description: "Fetches the latest account profile from your API.",
      config: {
        nodeType: "httpRequest",
        method: "POST",
        url: "https://api.example.com/v1/accounts/enrich",
        headers: {
          Authorization: "Bearer {{secrets.apiToken}}",
        },
        bodyTemplate: '{"accountId":"{{input.accountId}}"}',
      },
    },
    {
      id: "node_branch",
      label: "Enterprise?",
      kind: "CONDITION",
      provider: "CORE",
      nodeType: "branch",
      position: { x: 520, y: 180 },
      description: "Routes enterprise and growth accounts differently.",
      config: {
        nodeType: "branch",
        expression: 'input.plan === "enterprise"',
        trueLabel: "Enterprise path",
        falseLabel: "Growth path",
      },
    },
    {
      id: "node_slack",
      label: "Notify Ops",
      kind: "ACTION",
      provider: "SLACK",
      nodeType: "slackMessage",
      position: { x: 760, y: 80 },
      description: "Posts priority accounts into the launch channel.",
      config: {
        nodeType: "slackMessage",
        channel: "#launch-ops",
        messageTemplate:
          "Priority account {{input.accountName}} generated {{input.eventType}}",
      },
    },
    {
      id: "node_loop",
      label: "For Each Contact",
      kind: "LOOP",
      provider: "CORE",
      nodeType: "loop",
      position: { x: 760, y: 260 },
      description: "Expands related contacts and creates CRM follow-ups.",
      config: {
        nodeType: "loop",
        iterateOn: "input.contacts",
        itemAlias: "contact",
        maxIterations: 50,
      },
    },
    {
      id: "node_hubspot",
      label: "Create Deal",
      kind: "ACTION",
      provider: "HUBSPOT",
      nodeType: "hubspotCreateRecord",
      position: { x: 1000, y: 260 },
      description: "Creates or updates an expansion deal in HubSpot.",
      config: {
        nodeType: "hubspotCreateRecord",
        objectType: "deal",
        pipelineId: "expansion-pipeline",
        fieldMapping: {
          dealname: "{{contact.company}} - Expansion",
          amount: "{{contact.arr}}",
        },
      },
    },
  ],
  edges: [
    { id: "edge_1", source: "node_webhook", target: "node_http" },
    { id: "edge_2", source: "node_http", target: "node_branch" },
    {
      id: "edge_3",
      source: "node_branch",
      target: "node_slack",
      label: "true",
      condition: { branch: "true", expression: 'input.plan === "enterprise"' },
    },
    {
      id: "edge_4",
      source: "node_branch",
      target: "node_loop",
      label: "false",
      condition: { branch: "false", expression: 'input.plan !== "enterprise"' },
    },
    { id: "edge_5", source: "node_loop", target: "node_hubspot" },
  ],
  settings: {
    timeoutInSeconds: 180,
    concurrencyKey: "organizationId",
    defaultRetryPolicy: {
      maxAttempts: 3,
      backoffMs: 1_500,
      strategy: "exponential",
    },
  },
};

export const compiledSampleWorkflow = compileWorkflowDefinition(
  sampleWorkflowDefinition,
);

export const workflowSummaries: WorkflowSummary[] = [
  {
    id: "wf_customer_router",
    name: "Customer Signal Router",
    slug: "customer-signal-router",
    description:
      "Routes webhook events into Slack, HubSpot, and downstream recovery paths.",
    status: "ACTIVE",
    triggerSource: "WEBHOOK",
    lastRunAt: "2026-04-14T13:42:00.000Z",
    successRate: 98.2,
    runsToday: 342,
    version: 3,
    tags: ["launch", "revops", "webhook"],
  },
  {
    id: "wf_daily_sync",
    name: "Daily Expansion Digest",
    slug: "daily-expansion-digest",
    description: "Pulls CRM changes every morning and writes a summary to Notion.",
    status: "ACTIVE",
    triggerSource: "SCHEDULE",
    lastRunAt: "2026-04-14T05:00:00.000Z",
    successRate: 99.4,
    runsToday: 1,
    version: 7,
    tags: ["schedule", "crm", "notion"],
  },
  {
    id: "wf_sales_handoff",
    name: "Sales Handoff Guardrail",
    slug: "sales-handoff-guardrail",
    description: "Manual escalation flow for high-value customer handoffs.",
    status: "DRAFT",
    triggerSource: "MANUAL",
    lastRunAt: "2026-04-13T16:08:00.000Z",
    successRate: 95.1,
    runsToday: 12,
    version: 2,
    tags: ["manual", "ops", "handoff"],
  },
];

export const workflowRuns: WorkflowRunSummary[] = [
  {
    id: "run_1",
    workflowId: "wf_customer_router",
    workflowName: "Customer Signal Router",
    status: "SUCCEEDED",
    triggerSource: "WEBHOOK",
    queuedAt: "2026-04-14T13:42:00.000Z",
    completedAt: "2026-04-14T13:42:07.000Z",
    durationMs: 7210,
    correlationId: "corr_93af4b8a0f2d",
    steps: [
      { id: "node_http", label: "Enrich Payload", status: "SUCCEEDED" },
      { id: "node_branch", label: "Enterprise?", status: "SUCCEEDED" },
      { id: "node_slack", label: "Notify Ops", status: "SUCCEEDED" },
    ],
  },
  {
    id: "run_2",
    workflowId: "wf_customer_router",
    workflowName: "Customer Signal Router",
    status: "FAILED",
    triggerSource: "WEBHOOK",
    queuedAt: "2026-04-14T12:18:00.000Z",
    completedAt: "2026-04-14T12:18:11.000Z",
    durationMs: 11204,
    correlationId: "corr_d8a45bb713f1",
    steps: [
      { id: "node_http", label: "Enrich Payload", status: "SUCCEEDED" },
      { id: "node_branch", label: "Enterprise?", status: "SUCCEEDED" },
      { id: "node_loop", label: "For Each Contact", status: "FAILED" },
    ],
  },
  {
    id: "run_3",
    workflowId: "wf_daily_sync",
    workflowName: "Daily Expansion Digest",
    status: "SUCCEEDED",
    triggerSource: "SCHEDULE",
    queuedAt: "2026-04-14T05:00:00.000Z",
    completedAt: "2026-04-14T05:01:34.000Z",
    durationMs: 94200,
    correlationId: "corr_8d1ce6ae3f22",
    steps: [
      { id: "node_fetch", label: "Fetch CRM Changes", status: "SUCCEEDED" },
      { id: "node_notion", label: "Create Notion Digest", status: "SUCCEEDED" },
    ],
  },
];

export const connectorSummaries: ConnectorSummary[] = [
  {
    provider: "SLACK",
    name: "Slack",
    status: "connected",
    connectedAccounts: 2,
    description: "Channel alerts, approvals, and escalation notifications.",
  },
  {
    provider: "GOOGLE_SHEETS",
    name: "Google Sheets",
    status: "connected",
    connectedAccounts: 1,
    description: "Append rows for lightweight ops reporting and QA checks.",
  },
  {
    provider: "NOTION",
    name: "Notion",
    status: "connected",
    connectedAccounts: 1,
    description: "Publish digests, handoff notes, and postmortem logs.",
  },
  {
    provider: "AIRTABLE",
    name: "Airtable",
    status: "attention",
    connectedAccounts: 1,
    description: "Structured records for growth, partnerships, and intake.",
  },
  {
    provider: "HUBSPOT",
    name: "HubSpot",
    status: "connected",
    connectedAccounts: 3,
    description: "Sync deals, contacts, and routing outputs into the CRM.",
  },
  {
    provider: "HTTP",
    name: "HTTP Request",
    status: "planned",
    connectedAccounts: 0,
    description: "Generic fetch node for custom APIs and private tools.",
  },
];

export const auditLogEvents: AuditLogEvent[] = [
  {
    id: "audit_1",
    actor: "Aarav Gupta",
    action: "workflow.publish",
    target: "Customer Signal Router",
    occurredAt: "2026-04-14T11:10:00.000Z",
    metadata: { version: 3 },
  },
  {
    id: "audit_2",
    actor: "Ishita Rao",
    action: "connector.refresh",
    target: "Airtable / Growth Ops",
    occurredAt: "2026-04-14T08:42:00.000Z",
  },
  {
    id: "audit_3",
    actor: "Aarav Gupta",
    action: "workflow.replay",
    target: "run_2",
    occurredAt: "2026-04-14T12:20:00.000Z",
  },
];

export const workspaceSnapshot: WorkspaceSnapshot = {
  name: "Northstar Ops",
  slug: "northstar-ops",
  members: [
    { name: "Aarav Gupta", email: "aarav@northstar.work", role: "OWNER" },
    { name: "Ishita Rao", email: "ishita@northstar.work", role: "ADMIN" },
    { name: "Rehan Mehta", email: "rehan@northstar.work", role: "BUILDER" },
    { name: "Sara Khan", email: "sara@northstar.work", role: "VIEWER" },
  ],
  usage: [
    { label: "Runs this week", value: "8,432", change: "+14%" },
    { label: "Failed runs", value: "37", change: "-18%" },
    { label: "Connected accounts", value: "8", change: "+2" },
  ],
};
