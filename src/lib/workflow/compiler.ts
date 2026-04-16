import {
  type CompiledWorkflowDefinition,
  type WorkflowCanvasNode,
  type WorkflowDefinition,
} from "@/lib/workflow/types";
import { workflowDefinitionSchema } from "@/lib/workflow/schemas";

function triggerSourceFromNode(node: WorkflowCanvasNode) {
  switch (node.nodeType) {
    case "manualTrigger":
      return "MANUAL" as const;
    case "webhookTrigger":
      return "WEBHOOK" as const;
    case "scheduleTrigger":
      return "SCHEDULE" as const;
    default:
      throw new Error(`Unsupported trigger node type: ${node.nodeType}`);
  }
}

export function compileWorkflowDefinition(
  input: WorkflowDefinition | unknown,
): CompiledWorkflowDefinition {
  const definition = workflowDefinitionSchema.parse(input);
  const nodesById = new Map(definition.nodes.map((node) => [node.id, node]));
  const edgeIds = new Set<string>();
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const edge of definition.edges) {
    if (edgeIds.has(edge.id)) {
      throw new Error(`Duplicate edge id: ${edge.id}`);
    }

    edgeIds.add(edge.id);

    if (!nodesById.has(edge.source) || !nodesById.has(edge.target)) {
      throw new Error(`Edge ${edge.id} references a missing node`);
    }

    if (
      edge.source === edge.target &&
      nodesById.get(edge.source)?.kind !== "LOOP"
    ) {
      throw new Error(`Edge ${edge.id} creates a disallowed self-cycle`);
    }

    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source]);
  }

  const triggerNodes = definition.nodes.filter((node) => node.kind === "TRIGGER");

  if (triggerNodes.length !== 1) {
    throw new Error("A workflow must contain exactly one trigger node");
  }

  const triggerNode = triggerNodes[0];
  const derivedTriggerSource = triggerSourceFromNode(triggerNode);

  if (definition.triggerSource !== derivedTriggerSource) {
    throw new Error("Workflow triggerSource does not match the trigger node");
  }

  const reachable = new Set<string>();
  const queue = [triggerNode.id];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || reachable.has(current)) {
      continue;
    }

    reachable.add(current);

    for (const nextNodeId of outgoing.get(current) ?? []) {
      queue.push(nextNodeId);
    }
  }

  if (reachable.size !== definition.nodes.length) {
    const unreachable = definition.nodes
      .filter((node) => !reachable.has(node.id))
      .map((node) => node.id)
      .join(", ");

    throw new Error(
      `All nodes must be reachable from the trigger. Unreachable: ${unreachable}`,
    );
  }

  for (const node of definition.nodes) {
    if (node.kind !== "TRIGGER" && (incoming.get(node.id)?.length ?? 0) === 0) {
      throw new Error(`Node ${node.id} has no upstream dependency`);
    }

    if (node.kind === "CONDITION" && (outgoing.get(node.id)?.length ?? 0) < 2) {
      throw new Error(`Condition node ${node.id} must have true and false exits`);
    }
  }

  return {
    workflowId: definition.workflowId,
    version: definition.version,
    name: definition.name,
    trigger: {
      nodeId: triggerNode.id,
      source: definition.triggerSource,
      config: triggerNode.config,
    },
    nodes: definition.nodes.map((node) => ({
      ...node,
      downstreamNodeIds: outgoing.get(node.id) ?? [],
      retryPolicy: definition.settings.defaultRetryPolicy,
    })),
    edges: definition.edges,
    conditions: definition.nodes
      .filter((node) => node.kind === "CONDITION")
      .map((node) => ({
        nodeId: node.id,
        expression:
          node.config.nodeType === "branch" ? node.config.expression : "true",
      })),
    loops: definition.nodes.flatMap((node) => {
      if (node.kind !== "LOOP" || node.config.nodeType !== "loop") {
        return [];
      }

      return [
        {
          nodeId: node.id,
          iterateOn: node.config.iterateOn,
          itemAlias: node.config.itemAlias,
          maxIterations: node.config.maxIterations,
        },
      ];
    }),
    timeouts: {
      workflow: definition.settings.timeoutInSeconds,
    },
    retryPolicy: definition.settings.defaultRetryPolicy,
    idempotencyKeyTemplate: `${definition.workflowId}:v${definition.version}:{correlationId}`,
  };
}
