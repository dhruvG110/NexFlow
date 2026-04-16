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
  nodeType: z.literal("manualTrigger"),
  samplePayload: z.record(z.string(), z.unknown()).default({}),
});

export const webhookTriggerConfigSchema = z.object({
  nodeType: z.literal("webhookTrigger"),
  source: z.string().min(1),
  path: z.string().min(1),
  signatureHeader: z.string().min(1),
});

export const scheduleTriggerConfigSchema = z.object({
  nodeType: z.literal("scheduleTrigger"),
  cron: z.string().min(5),
  timezone: z.string().min(1),
});

export const httpRequestConfigSchema = z.object({
  nodeType: z.literal("httpRequest"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).default({}),
  bodyTemplate: z.string().default(""),
});

export const slackMessageConfigSchema = z.object({
  nodeType: z.literal("slackMessage"),
  channel: z.string().min(1),
  messageTemplate: z.string().min(1),
});

export const googleSheetsAppendConfigSchema = z.object({
  nodeType: z.literal("googleSheetsAppend"),
  spreadsheetId: z.string().min(1),
  sheetName: z.string().min(1),
  rowMapping: z.record(z.string(), z.string()).default({}),
});

export const notionCreatePageConfigSchema = z.object({
  nodeType: z.literal("notionCreatePage"),
  databaseId: z.string().min(1),
  titleTemplate: z.string().min(1),
  contentTemplate: z.string().min(1),
});

export const airtableCreateRecordConfigSchema = z.object({
  nodeType: z.literal("airtableCreateRecord"),
  baseId: z.string().min(1),
  tableId: z.string().min(1),
  fieldMapping: z.record(z.string(), z.string()).default({}),
});

export const hubspotCreateRecordConfigSchema = z.object({
  nodeType: z.literal("hubspotCreateRecord"),
  objectType: z.enum(["contact", "company", "deal"]),
  pipelineId: z.string().min(1),
  fieldMapping: z.record(z.string(), z.string()).default({}),
});

export const branchConfigSchema = z.object({
  nodeType: z.literal("branch"),
  expression: z.string().min(1),
  trueLabel: z.string().min(1),
  falseLabel: z.string().min(1),
});

export const loopConfigSchema = z.object({
  nodeType: z.literal("loop"),
  iterateOn: z.string().min(1),
  itemAlias: z.string().min(1),
  maxIterations: z.number().int().min(1).max(1_000),
});

export const workflowNodeConfigSchema = z.discriminatedUnion("nodeType", [
  manualTriggerConfigSchema,
  webhookTriggerConfigSchema,
  scheduleTriggerConfigSchema,
  httpRequestConfigSchema,
  slackMessageConfigSchema,
  googleSheetsAppendConfigSchema,
  notionCreatePageConfigSchema,
  airtableCreateRecordConfigSchema,
  hubspotCreateRecordConfigSchema,
  branchConfigSchema,
  loopConfigSchema,
]);

export const workflowNodeSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    kind: z.enum(workflowNodeKinds),
    provider: z.enum(workflowProviders),
    nodeType: z.enum(workflowNodeTypes),
    description: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    config: workflowNodeConfigSchema,
  })
  .superRefine((node, ctx) => {
    if (node.nodeType !== node.config.nodeType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Node type must match config nodeType",
        path: ["nodeType"],
      });
    }

    if (node.kind === "TRIGGER" && !node.nodeType.endsWith("Trigger")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Trigger nodes must use a trigger node type",
        path: ["kind"],
      });
    }
  });

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
