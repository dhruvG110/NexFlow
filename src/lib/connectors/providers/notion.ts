import { createConnectorHandler } from "@/lib/connectors/types";
import { createId } from "@/lib/utils";
import { notionCreatePageConfigSchema } from "@/lib/workflow/schemas";

export const notionConnector = createConnectorHandler({
  provider: "NOTION",
  name: "Notion",
  description: "Create handoff documents and operational digests in Notion.",
  nodeTypes: ["notionCreatePage"],
  configSchema: notionCreatePageConfigSchema,
  async authorize({ redirectUri }) {
    return {
      authorizationUrl: `https://api.notion.com/v1/oauth/authorize?owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`,
      state: createId("oauth"),
    };
  },
  async refresh(account) {
    return account;
  },
  validateConfig(config) {
    return notionCreatePageConfigSchema.parse(config);
  },
  async execute({ config, input }) {
    return {
      nodeId: createId("notion"),
      provider: "NOTION",
      status: "SUCCEEDED",
      output: {
        databaseId: config.databaseId,
        title: config.titleTemplate,
        content: config.contentTemplate,
        input,
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
    requestsPerMinute: 45,
    strategy: "token-bucket",
  },
});
