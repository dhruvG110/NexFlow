import { createConnectorHandler } from "@/lib/connectors/types";
import { createId } from "@/lib/utils";
import { googleSheetsAppendConfigSchema } from "@/lib/workflow/schemas";

export const googleSheetsConnector = createConnectorHandler({
  provider: "GOOGLE_SHEETS",
  name: "Google Sheets",
  description: "Append structured rows into operational spreadsheets.",
  nodeTypes: ["googleSheetsAppend"],
  configSchema: googleSheetsAppendConfigSchema,
  async authorize({ redirectUri }) {
    return {
      authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${encodeURIComponent(redirectUri)}`,
      state: createId("oauth"),
    };
  },
  async refresh(account) {
    return account;
  },
  validateConfig(config) {
    return googleSheetsAppendConfigSchema.parse(config);
  },
  async execute({ config, input }) {
    return {
      nodeId: createId("gsheet"),
      provider: "GOOGLE_SHEETS",
      status: "SUCCEEDED",
      output: {
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        row: Object.fromEntries(
          Object.entries(config.rowMapping).map(([column, field]) => [
            column,
            input[field],
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
    if (error instanceof Error && error.message.includes("quota")) {
      return "TRANSIENT";
    }

    return "UNKNOWN";
  },
  rateLimitPolicy: {
    requestsPerMinute: 60,
    strategy: "fixed-window",
  },
});
