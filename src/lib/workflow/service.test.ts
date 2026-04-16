import { describe, expect, it } from "vitest";

import { sampleWorkflowDefinition } from "@/lib/data/demo-data";
import {
  createExecutionContext,
  createRunEnvelope,
  publishDraftVersion,
  recordUsageEvent,
} from "@/lib/workflow/service";

describe("workflow service helpers", () => {
  it("publishes a new version from a draft definition", () => {
    const published = publishDraftVersion({
      workflowId: sampleWorkflowDefinition.workflowId,
      currentVersionNumber: sampleWorkflowDefinition.version,
      actorId: "user_1",
      actorEmail: "founder@example.com",
      definition: sampleWorkflowDefinition,
    });

    expect(published.versionNumber).toBe(sampleWorkflowDefinition.version + 1);
    expect(published.status).toBe("ACTIVE");
    expect(published.audit.action).toBe("workflow.publish");
  });

  it("creates correlated run and execution records", () => {
    const run = createRunEnvelope({
      workflowId: "wf_1",
      workflowName: "Test Workflow",
      triggerSource: "MANUAL",
    });
    const context = createExecutionContext({
      organizationId: "org_1",
      workflowId: "wf_1",
      workflowVersionId: "wfver_1",
      actorId: "user_1",
      actorEmail: "founder@example.com",
      triggerSource: "MANUAL",
      input: { foo: "bar" },
    });
    const usage = recordUsageEvent({
      meterName: "workflow.run.triggered",
      quantity: 1,
      organizationId: "org_1",
    });

    expect(run.status).toBe("QUEUED");
    expect(context.idempotencyKey).toContain("wf_1:wfver_1");
    expect(usage.recordedAt).toBeTruthy();
  });
});
