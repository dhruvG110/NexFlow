"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
  type OnConnect,
} from "@xyflow/react";
import {
  Plus,
  Play,
  Save,
  Search,
  Sparkles,
  Waypoints,
} from "lucide-react";
import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { compileWorkflowDefinition } from "@/lib/workflow/compiler";
import { cn } from "@/lib/utils";
import type {
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
  WorkflowDefinition,
  WorkflowNodeType,
} from "@/lib/workflow/types";

type AutomationNodeData = {
  label: string;
  description?: string;
  kind: WorkflowCanvasNode["kind"];
  provider: WorkflowCanvasNode["provider"];
};

type AutomationFlowNode = Node<AutomationNodeData, "automation">;

const paletteTemplates: Record<
  WorkflowNodeType,
  Omit<WorkflowCanvasNode, "id" | "position">
> = {
  manualTrigger: {
    label: "Manual Trigger",
    kind: "TRIGGER",
    provider: "CORE",
    nodeType: "manualTrigger",
    description: "Starts a workflow manually from the dashboard.",
    config: {
      nodeType: "manualTrigger",
      samplePayload: {},
    },
  },
  webhookTrigger: {
    label: "Webhook Trigger",
    kind: "TRIGGER",
    provider: "CORE",
    nodeType: "webhookTrigger",
    description: "Receives signed events from your application.",
    config: {
      nodeType: "webhookTrigger",
      source: "product",
      path: "/api/webhooks/product/:secret",
      signatureHeader: "x-product-signature",
    },
  },
  scheduleTrigger: {
    label: "Schedule Trigger",
    kind: "TRIGGER",
    provider: "CORE",
    nodeType: "scheduleTrigger",
    description: "Runs on a cron schedule.",
    config: {
      nodeType: "scheduleTrigger",
      cron: "0 9 * * *",
      timezone: "Asia/Calcutta",
    },
  },
  httpRequest: {
    label: "HTTP Request",
    kind: "ACTION",
    provider: "HTTP",
    nodeType: "httpRequest",
    description: "Fetch or post data to any HTTP API.",
    config: {
      nodeType: "httpRequest",
      method: "POST",
      url: "https://api.example.com/v1/action",
      headers: {},
      bodyTemplate: '{"accountId":"{{input.accountId}}"}',
    },
  },
  slackMessage: {
    label: "Slack Message",
    kind: "ACTION",
    provider: "SLACK",
    nodeType: "slackMessage",
    description: "Notify a Slack channel when the flow hits a milestone.",
    config: {
      nodeType: "slackMessage",
      channel: "#launch-ops",
      messageTemplate: "New account update for {{input.accountName}}",
    },
  },
  googleSheetsAppend: {
    label: "Append to Sheet",
    kind: "ACTION",
    provider: "GOOGLE_SHEETS",
    nodeType: "googleSheetsAppend",
    description: "Write a structured row into Google Sheets.",
    config: {
      nodeType: "googleSheetsAppend",
      spreadsheetId: "sheet-id",
      sheetName: "Ops",
      rowMapping: { account: "accountName" },
    },
  },
  notionCreatePage: {
    label: "Create Notion Page",
    kind: "ACTION",
    provider: "NOTION",
    nodeType: "notionCreatePage",
    description: "Publish a rich document into a Notion database.",
    config: {
      nodeType: "notionCreatePage",
      databaseId: "database-id",
      titleTemplate: "{{input.accountName}} brief",
      contentTemplate: "{{input.summary}}",
    },
  },
  airtableCreateRecord: {
    label: "Create Airtable Record",
    kind: "ACTION",
    provider: "AIRTABLE",
    nodeType: "airtableCreateRecord",
    description: "Insert a new Airtable row for intake or review.",
    config: {
      nodeType: "airtableCreateRecord",
      baseId: "base-id",
      tableId: "table-id",
      fieldMapping: { Account: "accountName" },
    },
  },
  hubspotCreateRecord: {
    label: "Create HubSpot Record",
    kind: "ACTION",
    provider: "HUBSPOT",
    nodeType: "hubspotCreateRecord",
    description: "Create or update a CRM record inside HubSpot.",
    config: {
      nodeType: "hubspotCreateRecord",
      objectType: "deal",
      pipelineId: "default",
      fieldMapping: { dealname: "accountName" },
    },
  },
  branch: {
    label: "Branch",
    kind: "CONDITION",
    provider: "CORE",
    nodeType: "branch",
    description: "Split execution with an explicit true/false decision.",
    config: {
      nodeType: "branch",
      expression: 'input.plan === "enterprise"',
      trueLabel: "Enterprise",
      falseLabel: "Growth",
    },
  },
  loop: {
    label: "Loop",
    kind: "LOOP",
    provider: "CORE",
    nodeType: "loop",
    description: "Repeat downstream steps for each item in an array.",
    config: {
      nodeType: "loop",
      iterateOn: "input.items",
      itemAlias: "item",
      maxIterations: 25,
    },
  },
};

function toFlowNode(node: WorkflowCanvasNode): AutomationFlowNode {
  return {
    id: node.id,
    type: "automation",
    position: node.position,
    data: {
      label: node.label,
      description: node.description,
      kind: node.kind,
      provider: node.provider,
    },
  };
}

function toFlowEdge(edge: WorkflowCanvasEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: Boolean(edge.condition),
  };
}

function AutomationNode({ data, selected }: NodeProps<AutomationFlowNode>) {
  return (
    <div
      className={cn(
        "w-56 rounded-[22px] border bg-white px-4 py-3 shadow-[0_16px_40px_rgba(17,27,24,0.12)]",
        selected
          ? "border-[color:var(--accent)] ring-2 ring-[color:var(--accent-soft)]"
          : "border-[color:var(--line)]",
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-3 !border-0 !bg-[color:var(--ink)]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            {data.kind}
          </p>
          <h3 className="mt-2 text-base font-semibold text-[color:var(--ink)]">
            {data.label}
          </h3>
        </div>
        <span className="rounded-xl bg-[color:var(--accent-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
          {data.provider}
        </span>
      </div>
      {data.description ? (
        <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
          {data.description}
        </p>
      ) : null}
      <Handle type="source" position={Position.Right} className="!size-3 !border-0 !bg-[color:var(--accent)]" />
    </div>
  );
}

type WorkflowEditorProps = {
  workflowId: string;
  initialDefinition: WorkflowDefinition;
};

function EditorInner({ workflowId, initialDefinition }: WorkflowEditorProps) {
  const [definitionNodes, setDefinitionNodes] = useState(initialDefinition.nodes);
  const [definitionEdges, setDefinitionEdges] = useState(initialDefinition.edges);
  const [canvasNodes, setCanvasNodes] = useState(() =>
    initialDefinition.nodes.map(toFlowNode),
  );
  const [canvasEdges, setCanvasEdges] = useState(() =>
    initialDefinition.edges.map(toFlowEdge),
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(
    initialDefinition.nodes[0]?.id,
  );
  const [catalogQuery, setCatalogQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("Draft is ready to publish.");
  const deferredCatalogQuery = useDeferredValue(catalogQuery);

  const selectedNode = definitionNodes.find((node) => node.id === selectedNodeId);
  const filteredPalette = useMemo(() => {
    const query = deferredCatalogQuery.trim().toLowerCase();

    return Object.entries(paletteTemplates).filter(([, template]) =>
      [template.label, template.nodeType, template.provider]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredCatalogQuery]);

  const compiledPreview = useMemo(() => {
    try {
      return JSON.stringify(
        compileWorkflowDefinition({
          ...initialDefinition,
          nodes: definitionNodes,
          edges: definitionEdges,
        }),
        null,
        2,
      );
    } catch (error) {
      return `Compilation error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  }, [definitionEdges, definitionNodes, initialDefinition]);

  const syncCanvasIntoDefinition = (nextCanvasNodes: AutomationFlowNode[]) => {
    setDefinitionNodes((current) =>
      current.map((node) => {
        const nextNode = nextCanvasNodes.find((candidate) => candidate.id === node.id);

        if (!nextNode) {
          return node;
        }

        return {
          ...node,
          position: nextNode.position,
        };
      }),
    );
  };

  const updateSelectedNode = (
    updater: (node: WorkflowCanvasNode) => WorkflowCanvasNode,
  ) => {
    if (!selectedNodeId) {
      return;
    }

    setDefinitionNodes((current) =>
      current.map((node) => (node.id === selectedNodeId ? updater(node) : node)),
    );
    setCanvasNodes((current) =>
      current.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...(selectedNode
                  ? {
                      label: updater(selectedNode).label,
                      description: updater(selectedNode).description,
                    }
                  : {}),
              },
            }
          : node,
      ),
    );
  };

  const onNodeChanges = (changes: NodeChange<AutomationFlowNode>[]) => {
    setCanvasNodes((current) => {
      const next = applyNodeChanges<AutomationFlowNode>(changes, current);
      syncCanvasIntoDefinition(next);
      return next;
    });
  };

  const onEdgeChanges = (changes: Parameters<typeof applyEdgeChanges>[0]) => {
    setCanvasEdges((current) => applyEdgeChanges(changes, current));
  };

  const onConnect: OnConnect = (connection) => {
    if (!connection.source || !connection.target) {
      return;
    }

    const edgeId = `edge_${crypto.randomUUID().slice(0, 8)}`;
    const newEdge: WorkflowCanvasEdge = {
      id: edgeId,
      source: connection.source,
      target: connection.target,
    };

    setDefinitionEdges((current) => [...current, newEdge]);
    setCanvasEdges((current) => addEdge({ ...newEdge }, current));
  };

  const addNode = (nodeType: WorkflowNodeType) => {
    const template = paletteTemplates[nodeType];
    const id = `node_${crypto.randomUUID().slice(0, 8)}`;
    const newNode: WorkflowCanvasNode = {
      ...template,
      id,
      position: {
        x: 220 + definitionNodes.length * 120,
        y: 80 + (definitionNodes.length % 3) * 140,
      },
    };

    setDefinitionNodes((current) => [...current, newNode]);
    setCanvasNodes((current) => [...current, toFlowNode(newNode)]);
    setSelectedNodeId(id);

    if (selectedNodeId) {
      const edgeId = `edge_${crypto.randomUUID().slice(0, 8)}`;
      const newEdge: WorkflowCanvasEdge = {
        id: edgeId,
        source: selectedNodeId,
        target: id,
      };

      setDefinitionEdges((current) => [...current, newEdge]);
      setCanvasEdges((current) => [...current, toFlowEdge(newEdge)]);
    }
  };

  const postWorkflowAction = async (action: "publish" | "test-run") => {
    const response = await fetch(`/api/workflows/${workflowId}/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        definition: {
          ...initialDefinition,
          nodes: definitionNodes,
          edges: definitionEdges,
        },
      }),
    });

    const body = (await response.json()) as { message?: string; error?: string };
    setStatusMessage(body.message ?? body.error ?? "Action completed.");
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
      <Card className="overflow-hidden p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--line)] px-2 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Canvas
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
              Visual workflow builder
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  await postWorkflowAction("test-run");
                });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent)]"
            >
              <Play className="size-4" />
              Test run
            </button>
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  await postWorkflowAction("publish");
                });
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:#20322d]"
            >
              <Save className="size-4" />
              Publish
            </button>
          </div>
        </div>

        <div className="mt-4 h-[680px] overflow-hidden rounded-[24px] border border-[color:var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(247,241,231,0.9))]">
          <ReactFlow
            nodes={canvasNodes}
            edges={canvasEdges}
            nodeTypes={{ automation: AutomationNode }}
            onNodesChange={onNodeChanges}
            onEdgesChange={onEdgeChanges}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(undefined)}
            fitView
          >
            <Background gap={18} size={1} color="rgba(17,27,24,0.08)" />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) =>
                node.data.kind === "TRIGGER"
                  ? "#ef6b31"
                  : node.data.kind === "CONDITION"
                    ? "#0b5e52"
                    : "#111b18"
              }
            />
            <Controls />
          </ReactFlow>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] px-3 py-2">
            <Search className="size-4 text-[color:var(--muted)]" />
            <input
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              placeholder="Search node palette"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--muted)]"
            />
          </div>
          <div className="mt-4 grid gap-2">
            {filteredPalette.map(([nodeType, template]) => (
              <button
                key={nodeType}
                type="button"
                onClick={() => addNode(nodeType as WorkflowNodeType)}
                className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-left transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)]"
              >
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    {template.label}
                  </p>
                  <p className="text-xs leading-6 text-[color:var(--muted)]">
                    {template.description}
                  </p>
                </div>
                <Plus className="size-4 text-[color:var(--accent)]" />
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Inspector
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                {selectedNode?.label ?? "Select a node"}
              </h2>
            </div>
            {selectedNode ? <Badge variant="info">{selectedNode.provider}</Badge> : null}
          </div>

          {selectedNode ? (
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Label
                </span>
                <input
                  value={selectedNode.label}
                  onChange={(event) =>
                    updateSelectedNode((node) => ({
                      ...node,
                      label: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Description
                </span>
                <textarea
                  rows={3}
                  value={selectedNode.description ?? ""}
                  onChange={(event) =>
                    updateSelectedNode((node) => ({
                      ...node,
                      description: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Config JSON
                </span>
                <textarea
                  rows={10}
                  value={JSON.stringify(selectedNode.config, null, 2)}
                  onChange={(event) => {
                    try {
                      const nextConfig = JSON.parse(event.target.value) as WorkflowCanvasNode["config"];
                      updateSelectedNode((node) => ({
                        ...node,
                        config: nextConfig,
                      }));
                    } catch {
                      setStatusMessage("Config JSON must stay valid.");
                    }
                  }}
                  className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-3 font-mono text-xs leading-6 outline-none"
                />
              </label>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
              Click any node on the canvas to inspect or edit it.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Compiled DSL
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                Execution preview
              </h2>
            </div>
            <Sparkles className="size-5 text-[color:var(--accent)]" />
          </div>
          <pre className="mt-4 max-h-80 overflow-auto rounded-[24px] bg-[color:#111b18] p-4 font-mono text-[11px] leading-6 text-white">
            {compiledPreview}
          </pre>
          <div className="mt-4 flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <Waypoints className="size-4" />
            {statusMessage}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}
