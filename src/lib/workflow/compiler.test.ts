import { describe, expect, it } from "vitest";

import { sampleWorkflowDefinition } from "@/lib/data/demo-data";
import { compileWorkflowDefinition } from "@/lib/workflow/compiler";

describe("compileWorkflowDefinition", () => {
  it("compiles the sample workflow into a deterministic DSL", () => {
    const compiled = compileWorkflowDefinition(sampleWorkflowDefinition);

    expect(compiled.trigger.source).toBe("WEBHOOK");
    expect(compiled.nodes).toHaveLength(sampleWorkflowDefinition.nodes.length);
    expect(compiled.conditions[0]?.expression).toContain("enterprise");
    expect(compiled.idempotencyKeyTemplate).toContain("wf_customer_router");
  });

  it("rejects workflows with multiple triggers", () => {
    expect(() =>
      compileWorkflowDefinition({
        ...sampleWorkflowDefinition,
        nodes: [
          ...sampleWorkflowDefinition.nodes,
          {
            id: "node_manual",
            label: "Manual Trigger",
            kind: "TRIGGER",
            provider: "CORE",
            nodeType: "manualTrigger",
            position: { x: 20, y: 40 },
            config: {
              nodeType: "manualTrigger",
              samplePayload: {},
            },
          },
        ],
      }),
    ).toThrow("exactly one trigger");
  });
});
