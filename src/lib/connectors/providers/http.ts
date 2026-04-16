import { createConnectorHandler } from "@/lib/connectors/types";
import { createId } from "@/lib/utils";
import { httpRequestConfigSchema } from "@/lib/workflow/schemas";

export const httpConnector = createConnectorHandler({
  provider: "HTTP",
  name: "HTTP Request",
  description: "Call any HTTP API with retry-safe request metadata.",
  nodeTypes: ["httpRequest"],
  configSchema: httpRequestConfigSchema,
  async authorize() {
    return {
      authorizationUrl: "",
      state: createId("oauth"),
    };
  },
  async refresh(account) {
    return account;
  },
  validateConfig(config) {
    return httpRequestConfigSchema.parse(config);
  },
  async execute({ config, input, context }) {
    return {
      nodeId: createId("http"),
      provider: "HTTP",
      status: "SUCCEEDED",
      output: {
        request: {
          method: config.method,
          url: config.url,
          headers: config.headers,
          bodyTemplate: config.bodyTemplate,
        },
        echoedInput: input,
        correlationId: context.correlationId,
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
    if (error instanceof Error && error.message.includes("timeout")) {
      return "TRANSIENT";
    }

    return "UNKNOWN";
  },
  rateLimitPolicy: {
    requestsPerMinute: 300,
    strategy: "token-bucket",
  },
});
