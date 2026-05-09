import type {
  WorkflowDefinition,
  WorkflowNodeConfig,
  WorkflowNodeType,
  WorkflowTriggerSource,
} from "@/lib/workflow/types";

export function getDefaultConfig(nodeType: WorkflowNodeType): WorkflowNodeConfig {
  switch (nodeType) {
    case "manualTrigger":
      return {
        samplePayload: {},
      };
    case "webhookTrigger":
      return {
        source: "product",
        path: "/api/webhooks/product/:secret",
        signatureHeader: "x-product-signature",
      };
    case "scheduleTrigger":
      return {
        cron: "0 9 * * *",
        timezone: "Asia/Calcutta",
      };
    case "httpRequest":
      return {
        method: "GET",
        url: "https://api.example.com/v1/action",
        headers: {},
        bodyTemplate: '{"accountId":"{{input.accountId}}"}',
      };
    case "slackMessage":
      return {
        channel: "#ops",
        messageTemplate: "Hello {{input.name}}",
      };
    case "googleSheetsAppend":
      return {
        spreadsheetId: "sheet-id",
        sheetName: "Sheet1",
        rowMapping: {},
      };
    case "notionCreatePage":
      return {
        databaseId: "database-id",
        titleTemplate: "{{input.accountName}} brief",
        contentTemplate: "{{input.summary}}",
      };
    case "airtableCreateRecord":
      return {
        baseId: "base-id",
        tableId: "table-id",
        fieldMapping: {},
      };
    case "hubspotCreateRecord":
      return {
        objectType: "deal",
        pipelineId: "default",
        fieldMapping: {},
      };
    case "branch":
      return {
        expression: 'input.plan === "enterprise"',
        trueLabel: "True path",
        falseLabel: "False path",
      };
    case "loop":
      return {
        iterateOn: "input.items",
        itemAlias: "item",
        maxIterations: 25,
      };
  }
}

export function createDefaultWorkflowDefinition(args: {
  workflowId: string;
  name: string;
  version?: number;
  triggerSource?: WorkflowTriggerSource;
}): WorkflowDefinition {
  const triggerNodeType =
    args.triggerSource === "WEBHOOK"
      ? "webhookTrigger"
      : args.triggerSource === "SCHEDULE"
        ? "scheduleTrigger"
        : "manualTrigger";

  return {
    workflowId: args.workflowId,
    version: args.version ?? 1,
    name: args.name,
    triggerSource: args.triggerSource ?? "MANUAL",
    nodes: [
      {
        id: "node_trigger",
        label:
          triggerNodeType === "webhookTrigger"
            ? "Webhook Trigger"
            : triggerNodeType === "scheduleTrigger"
              ? "Schedule Trigger"
              : "Manual Trigger",
        kind: "TRIGGER",
        provider: "CORE",
        nodeType: triggerNodeType,
        description:
          triggerNodeType === "webhookTrigger"
            ? "Receives events from your application."
            : triggerNodeType === "scheduleTrigger"
              ? "Runs on a fixed schedule."
              : "Starts the workflow manually.",
        position: { x: 120, y: 180 },
        config: getDefaultConfig(triggerNodeType),
      },
    ],
    edges: [],
    settings: {
      timeoutInSeconds: 180,
      concurrencyKey: "organizationId",
      defaultRetryPolicy: {
        maxAttempts: 3,
        backoffMs: 1500,
        strategy: "exponential",
      },
    },
  };
}
