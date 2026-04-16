import type { ZodType } from "zod";

import type {
  ConnectorProvider,
  ExecutionContext,
  StepResult,
  WorkflowNodeConfig,
} from "@/lib/workflow/types";

export type ConnectorAuthorizeResponse = {
  authorizationUrl: string;
  state: string;
};

export type ConnectorAccountState = {
  provider: ConnectorProvider;
  accessToken?: string;
  refreshToken?: string;
  metadata?: Record<string, unknown>;
};

export type ConnectorExecutionRequest<TConfig extends WorkflowNodeConfig = WorkflowNodeConfig> = {
  config: TConfig;
  input: Record<string, unknown>;
  context: ExecutionContext;
  account?: ConnectorAccountState;
};

export type ConnectorHandler<TConfig extends WorkflowNodeConfig = WorkflowNodeConfig> = {
  provider: ConnectorProvider;
  name: string;
  description: string;
  nodeTypes: TConfig["nodeType"][];
  configSchema: ZodType<TConfig>;
  authorize: (args: { redirectUri: string }) => Promise<ConnectorAuthorizeResponse>;
  refresh: (account: ConnectorAccountState) => Promise<ConnectorAccountState>;
  validateConfig: (config: unknown) => TConfig;
  execute: (request: ConnectorExecutionRequest<TConfig>) => Promise<StepResult>;
  mapInput: (payload: Record<string, unknown>) => Record<string, unknown>;
  mapOutput: (payload: Record<string, unknown>) => Record<string, unknown>;
  classifyError: (error: unknown) => StepResult["errorClass"];
  rateLimitPolicy: {
    requestsPerMinute: number;
    strategy: "token-bucket" | "fixed-window";
  };
};

export function createConnectorHandler<TConfig extends WorkflowNodeConfig>(
  handler: ConnectorHandler<TConfig>,
) {
  return handler;
}
