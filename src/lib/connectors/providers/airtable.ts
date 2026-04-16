import { createConnectorHandler } from "@/lib/connectors/types";
import { createId } from "@/lib/utils";
import { airtableCreateRecordConfigSchema } from "@/lib/workflow/schemas";

export const airtableConnector = createConnectorHandler({
  provider: "AIRTABLE",
  name: "Airtable",
  description: "Insert records into operational bases and growth trackers.",
  nodeTypes: ["airtableCreateRecord"],
  configSchema: airtableCreateRecordConfigSchema,
  async authorize({ redirectUri }) {
    return {
      authorizationUrl: `https://airtable.com/oauth2/v1/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`,
      state: createId("oauth"),
    };
  },
  async refresh(account) {
    return account;
  },
  validateConfig(config) {
    return airtableCreateRecordConfigSchema.parse(config);
  },
  async execute({ config, input }) {
    return {
      nodeId: createId("airtable"),
      provider: "AIRTABLE",
      status: "SUCCEEDED",
      output: {
        baseId: config.baseId,
        tableId: config.tableId,
        fields: Object.fromEntries(
          Object.entries(config.fieldMapping).map(([field, value]) => [
            field,
            input[value],
          ]),
        ),
      },
      retryable: true,
      attempts: 1,
    };
  },
  mapInput(payload) {
    return payload;
  },
  mapOutput(payload) {
    return payload;
  },
  classifyError(error) {
    if (error instanceof Error && error.message.includes("429")) {
      return "TRANSIENT";
    }

    return "UNKNOWN";
  },
  rateLimitPolicy: {
    requestsPerMinute: 30,
    strategy: "fixed-window",
  },
});
