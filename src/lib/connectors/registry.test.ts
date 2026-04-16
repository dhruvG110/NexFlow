import { describe, expect, it } from "vitest";

import { connectorRegistry } from "@/lib/connectors/registry";

describe("connector registry", () => {
  it("exposes the launch provider set", () => {
    expect(Object.keys(connectorRegistry).sort()).toEqual([
      "AIRTABLE",
      "GOOGLE_SHEETS",
      "HTTP",
      "HUBSPOT",
      "NOTION",
      "SLACK",
    ]);
  });

  it("validates provider config with shared schemas", () => {
    const slack = connectorRegistry.SLACK;
    const config = slack.validateConfig({
      nodeType: "slackMessage",
      channel: "#ops",
      messageTemplate: "Hello {{input.name}}",
    });

    expect(config.channel).toBe("#ops");
    expect(slack.rateLimitPolicy.requestsPerMinute).toBeGreaterThan(1);
  });
});
