import { createConnectorHandler } from "@/lib/connectors/types";
import { createId } from "@/lib/utils";
import { slackMessageConfigSchema } from "@/lib/workflow/schemas";

export const slackConnector = createConnectorHandler({
  provider: "SLACK",
  name: "Slack",
  description: "Send templated messages into incident and launch channels.",
  nodeTypes: ["slackMessage"],
  configSchema: slackMessageConfigSchema,
  async authorize({ redirectUri }) {
    return {
      authorizationUrl: `https://slack.com/oauth/v2/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`,
      state: createId("oauth"),
    };
  },
  async refresh(account) {
    return account;
  },
  validateConfig(config) {
    return slackMessageConfigSchema.parse(config);
  },
  async execute({ config, input }) {
    return {
      nodeId: createId("slack"),
      provider: "SLACK",
      status: "SUCCEEDED",
      output: {
        channel: config.channel,
        message: config.messageTemplate,
        echoedInput: input,
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
    if (error instanceof Error && error.message.includes("auth")) {
      return "AUTH";
    }

    return "UNKNOWN";
  },
  rateLimitPolicy: {
    requestsPerMinute: 80,
    strategy: "token-bucket",
  },
});
