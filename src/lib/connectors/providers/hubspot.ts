import { createConnectorHandler } from "@/lib/connectors/types";
import { createId } from "@/lib/utils";
import { hubspotCreateRecordConfigSchema } from "@/lib/workflow/schemas";

export const hubspotConnector = createConnectorHandler({
  provider: "HUBSPOT",
  name: "HubSpot",
  description: "Create or update CRM records for routing workflows.",
  nodeTypes: ["hubspotCreateRecord"],
  configSchema: hubspotCreateRecordConfigSchema,
  async authorize({ redirectUri }) {
    return {
      authorizationUrl: `https://app.hubspot.com/oauth/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`,
      state: createId("oauth"),
    };
  },
  async refresh(account) {
    return account;
  },
  validateConfig(config) {
    return hubspotCreateRecordConfigSchema.parse(config);
  },
  async execute({ config, input }) {
    return {
      nodeId: createId("hubspot"),
      provider: "HUBSPOT",
      status: "SUCCEEDED",
      output: {
        objectType: config.objectType,
        pipelineId: config.pipelineId,
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
    if (error instanceof Error && error.message.includes("validation")) {
      return "VALIDATION";
    }

    return "UNKNOWN";
  },
  rateLimitPolicy: {
    requestsPerMinute: 80,
    strategy: "token-bucket",
  },
});
