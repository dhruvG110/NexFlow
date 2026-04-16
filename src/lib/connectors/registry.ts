import { airtableConnector } from "@/lib/connectors/providers/airtable";
import { googleSheetsConnector } from "@/lib/connectors/providers/google-sheets";
import { httpConnector } from "@/lib/connectors/providers/http";
import { hubspotConnector } from "@/lib/connectors/providers/hubspot";
import { notionConnector } from "@/lib/connectors/providers/notion";
import { slackConnector } from "@/lib/connectors/providers/slack";
import type { ConnectorHandler } from "@/lib/connectors/types";
import type { ConnectorProvider } from "@/lib/workflow/types";

export const connectorRegistry = {
  AIRTABLE: airtableConnector,
  GOOGLE_SHEETS: googleSheetsConnector,
  HTTP: httpConnector,
  HUBSPOT: hubspotConnector,
  NOTION: notionConnector,
  SLACK: slackConnector,
} satisfies Record<ConnectorProvider, unknown>;

export function getConnectorHandler(provider: ConnectorProvider) {
  return connectorRegistry[provider] as unknown as ConnectorHandler;
}
