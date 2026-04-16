import { tasks } from "@trigger.dev/sdk";

import { featureFlags } from "@/lib/env";
import type { ExecutionPayload } from "@/lib/workflow/types";

export async function queueWorkflowExecution(payload: ExecutionPayload) {
  if (!featureFlags.hasTrigger) {
    return {
      provider: "local" as const,
      taskId: "local-execute-workflow",
      queued: true,
      payload,
    };
  }

  const handle = await tasks.trigger("execute-workflow", payload, {
    idempotencyKey: payload.context.idempotencyKey,
  });

  return {
    provider: "trigger.dev" as const,
    taskId: handle.id,
    queued: true,
  };
}
