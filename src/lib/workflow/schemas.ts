import { z } from "zod";

import {
  connectorProviders,
  workflowNodeKinds,
  workflowNodeTypes,
  workflowProviders,
  workflowTriggerSources,
} from "@/lib/workflow/types";

export const retryPolicySchema = z.object({
  maxAttempts: z.number().int().min(1).max(10),
  backoffMs: z.number().int().min(250).max(60_000),
  strategy: z.enum(["fixed", "exponential"]),
});

export const manualTriggerConfigSchema = z.object({
  samplePayload: z.record(z.string(), z.unknown()).default({}),
});

export const webhookTriggerConfigSchema = z.object({
  source: z.string().min(1),
  path: z.string().min(1),
  signatureHeader: z.string().min(1),
});

export const scheduleTriggerConfigSchema = z.object({
  cron: z.string().min(5),
  timezone: z.string().min(1),
});

export const httpRequestConfigSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).default({}),
  bodyTemplate: z.string().default(""),
});

export const slackMessageConfigSchema = z.object({
  channel: z.string().min(1),
  messageTemplate: z.string().min(1),
});

export const googleSheetsAppendConfigSchema = z.object({
  spreadsheetId: z.string().min(1),
  sheetName: z.string().min(1),
  rowMapping: z.record(z.string(), z.string()).default({}),
});

export const notionCreatePageConfigSchema = z.object({
  databaseId: z.string().min(1),
  titleTemplate: z.string().min(1),
  contentTemplate: z.string().min(1),
});

export const airtableCreateRecordConfigSchema = z.object({
  baseId: z.string().min(1),
  tableId: z.string().min(1),
  fieldMapping: z.record(z.string(), z.string()).default({}),
});

export const hubspotCreateRecordConfigSchema = z.object({
  objectType: z.enum(["contact", "company", "deal"]),
  pipelineId: z.string().min(1),
  fieldMapping: z.record(z.string(), z.string()).default({}),
});

export const branchConfigSchema = z.object({
  expression: z.string().min(1),
  trueLabel: z.string().min(1),
  falseLabel: z.string().min(1),
});

export const loopConfigSchema = z.object({
  iterateOn: z.string().min(1),
  itemAlias: z.string().min(1),
  maxIterations: z.number().int().min(1).max(1_000),
});

const baseNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

function createWorkflowNodeSchema<
  TNodeType extends (typeof workflowNodeTypes)[number],
  TKind extends (typeof workflowNodeKinds)[number],
  TProvider extends (typeof workflowProviders)[number],
>(
  nodeType: TNodeType,
  kind: TKind,
  provider: TProvider,
  config: z.ZodType,
) {
  return baseNodeSchema.extend({
    kind: z.literal(kind),
    provider: z.literal(provider),
    nodeType: z.literal(nodeType),
    config,
  });
}

export const workflowNodeSchema = z.discriminatedUnion("nodeType", [
  createWorkflowNodeSchema(
    "manualTrigger",
    "TRIGGER",
    "CORE",
    manualTriggerConfigSchema,
  ),
  createWorkflowNodeSchema(
    "webhookTrigger",
    "TRIGGER",
    "CORE",
    webhookTriggerConfigSchema,
  ),
  createWorkflowNodeSchema(
    "scheduleTrigger",
    "TRIGGER",
    "CORE",
    scheduleTriggerConfigSchema,
  ),
  createWorkflowNodeSchema(
    "httpRequest",
    "ACTION",
    "HTTP",
    httpRequestConfigSchema,
  ),
  createWorkflowNodeSchema(
    "slackMessage",
    "ACTION",
    "SLACK",
    slackMessageConfigSchema,
  ),
  createWorkflowNodeSchema(
    "googleSheetsAppend",
    "ACTION",
    "GOOGLE_SHEETS",
    googleSheetsAppendConfigSchema,
  ),
  createWorkflowNodeSchema(
    "notionCreatePage",
    "ACTION",
    "NOTION",
    notionCreatePageConfigSchema,
  ),
  createWorkflowNodeSchema(
    "airtableCreateRecord",
    "ACTION",
    "AIRTABLE",
    airtableCreateRecordConfigSchema,
  ),
  createWorkflowNodeSchema(
    "hubspotCreateRecord",
    "ACTION",
    "HUBSPOT",
    hubspotCreateRecordConfigSchema,
  ),
  createWorkflowNodeSchema("branch", "CONDITION", "CORE", branchConfigSchema),
  createWorkflowNodeSchema("loop", "LOOP", "CORE", loopConfigSchema),
]);

export const workflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  condition: z
    .object({
      branch: z.enum(["true", "false"]).optional(),
      expression: z.string().optional(),
    })
    .optional(),
});

export const workflowDefinitionSchema = z.object({
  workflowId: z.string().min(1),
  version: z.number().int().min(0),
  name: z.string().min(1),
  triggerSource: z.enum(workflowTriggerSources),
  nodes: z.array(workflowNodeSchema).min(1),
  edges: z.array(workflowEdgeSchema),
  settings: z.object({
    timeoutInSeconds: z.number().int().min(10).max(900),
    concurrencyKey: z.string().min(1),
    defaultRetryPolicy: retryPolicySchema,
  }),
});

export function getConfigSchemaForNodeType(nodeType: string) {
  switch (nodeType) {
    case "manualTrigger":
      return manualTriggerConfigSchema;
    case "webhookTrigger":
      return webhookTriggerConfigSchema;
    case "scheduleTrigger":
      return scheduleTriggerConfigSchema;
    case "httpRequest":
      return httpRequestConfigSchema;
    case "slackMessage":
      return slackMessageConfigSchema;
    case "googleSheetsAppend":
      return googleSheetsAppendConfigSchema;
    case "notionCreatePage":
      return notionCreatePageConfigSchema;
    case "airtableCreateRecord":
      return airtableCreateRecordConfigSchema;
    case "hubspotCreateRecord":
      return hubspotCreateRecordConfigSchema;
    case "branch":
      return branchConfigSchema;
    case "loop":
      return loopConfigSchema;
    default:
      return z.never();
  }
}

export const connectorProviderSchema = z.enum(connectorProviders);
