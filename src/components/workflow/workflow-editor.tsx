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
import { getDefaultConfig } from "@/lib/workflow/defaults";
import { cn } from "@/lib/utils";
import type {
  AirtableCreateRecordConfig,
  BranchConfig,
  GoogleSheetsAppendConfig,
  HubspotCreateRecordConfig,
  HttpRequestConfig,
  LoopConfig,
  NotionCreatePageConfig,
  ScheduleTriggerConfig,
  SlackMessageConfig,
  WebhookTriggerConfig,
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

type PaletteTemplate = Omit<WorkflowCanvasNode, "id" | "position" | "config">;

const paletteTemplates: Record<
  WorkflowNodeType,
  PaletteTemplate
> = {
  manualTrigger: {
    label: "Manual Trigger",
    kind: "TRIGGER",
    provider: "CORE",
    nodeType: "manualTrigger",
    description: "Starts a workflow manually from the dashboard.",
  },
  webhookTrigger: {
    label: "Webhook Trigger",
    kind: "TRIGGER",
    provider: "CORE",
    nodeType: "webhookTrigger",
    description: "Receives signed events from your application.",
  },
  scheduleTrigger: {
    label: "Schedule Trigger",
    kind: "TRIGGER",
    provider: "CORE",
    nodeType: "scheduleTrigger",
    description: "Runs on a cron schedule.",
  },
  httpRequest: {
    label: "HTTP Request",
    kind: "ACTION",
    provider: "HTTP",
    nodeType: "httpRequest",
    description: "Fetch or post data to any HTTP API.",
  },
  slackMessage: {
    label: "Slack Message",
    kind: "ACTION",
    provider: "SLACK",
    nodeType: "slackMessage",
    description: "Notify a Slack channel when the flow hits a milestone.",
  },
  googleSheetsAppend: {
    label: "Append to Sheet",
    kind: "ACTION",
    provider: "GOOGLE_SHEETS",
    nodeType: "googleSheetsAppend",
    description: "Write a structured row into Google Sheets.",
  },
  notionCreatePage: {
    label: "Create Notion Page",
    kind: "ACTION",
    provider: "NOTION",
    nodeType: "notionCreatePage",
    description: "Publish a rich document into a Notion database.",
  },
  airtableCreateRecord: {
    label: "Create Airtable Record",
    kind: "ACTION",
    provider: "AIRTABLE",
    nodeType: "airtableCreateRecord",
    description: "Insert a new Airtable row for intake or review.",
  },
  hubspotCreateRecord: {
    label: "Create HubSpot Record",
    kind: "ACTION",
    provider: "HUBSPOT",
    nodeType: "hubspotCreateRecord",
    description: "Create or update a CRM record inside HubSpot.",
  },
  branch: {
    label: "Branch",
    kind: "CONDITION",
    provider: "CORE",
    nodeType: "branch",
    description: "Split execution with an explicit true/false decision.",
  },
  loop: {
    label: "Loop",
    kind: "LOOP",
    provider: "CORE",
    nodeType: "loop",
    description: "Repeat downstream steps for each item in an array.",
  },
};

function toFlowNode(node: WorkflowCanvasNode): AutomationFlowNode {
  return {
    id: node.id,
    type: "automation",
    position: node.position,
    data: {
      label: node.label ?? "Untitled node",
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

type WorkflowAction = "activate" | "publish" | "test-run";
type TestRunStatus = "IDLE" | "RUNNING" | "SUCCESS" | "FAILED";
type WorkflowActionResponse = {
  message?: string;
  error?: string;
  data?: {
    version?: number;
    versionNumber?: number;
  };
};

async function readWorkflowActionResponse(
  response: Response,
): Promise<WorkflowActionResponse> {
  const payload = await response.text();

  if (!payload.trim()) {
    return {};
  }

  try {
    return JSON.parse(payload) as WorkflowActionResponse;
  } catch {
    return {
      error: response.ok
        ? "Received an invalid response from the server."
        : `Request failed with status ${response.status}.`,
    };
  }
}

function getTestRunBadgeVariant(status: TestRunStatus) {
  switch (status) {
    case "RUNNING":
      return "info" as const;
    case "SUCCESS":
      return "success" as const;
    case "FAILED":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

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
  const [currentVersion, setCurrentVersion] = useState(
    initialDefinition.version,
  );
  const [publishedVersions, setPublishedVersions] = useState<number[]>([
    initialDefinition.version,
  ]);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("Draft is ready to publish.");
  const [testRunStatus, setTestRunStatus] = useState<TestRunStatus>("IDLE");
  const deferredCatalogQuery = useDeferredValue(catalogQuery);
  const currentDefinition = useMemo(
    () => ({
      ...initialDefinition,
      version: currentVersion,
      nodes: definitionNodes,
      edges: definitionEdges,
    }),
    [currentVersion, definitionEdges, definitionNodes, initialDefinition],
  );

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
        compileWorkflowDefinition(currentDefinition),
        null,
        2,
      );
    } catch (error) {
      return `Compilation error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  }, [currentDefinition]);

  const syncCanvasIntoDefinition = (nextCanvasNodes: AutomationFlowNode[]) => {
    const nextNodeIds = new Set(nextCanvasNodes.map((node) => node.id));
    setDefinitionNodes((current) =>
      current
        .filter((node) => nextNodeIds.has(node.id))
        .map((node) => {
        const nextNode = nextCanvasNodes.find((candidate) => candidate.id === node.id);

        if (!nextNode) {
          return node;
        }

        return {
          ...node,
          position: nextNode.position,
          label: nextNode.data.label,
          description: nextNode.data.description,
        };
      }),
    );
    setDefinitionEdges((current) =>
      current.filter(
        (edge) => nextNodeIds.has(edge.source) && nextNodeIds.has(edge.target),
      ),
    );
    setCanvasEdges((current) =>
      current.filter(
        (edge) => nextNodeIds.has(edge.source) && nextNodeIds.has(edge.target),
      ),
    );
  };

  const updateSelectedNode = (
    updater: (node: WorkflowCanvasNode) => WorkflowCanvasNode,
  ) => {
    if (!selectedNodeId || !selectedNode) {
      return;
    }

    const nextSelectedNode = updater(selectedNode);

    setDefinitionNodes((current) =>
      current.map((node) => (node.id === selectedNodeId ? nextSelectedNode : node)),
    );
    setCanvasNodes((current) =>
      current.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                label: nextSelectedNode.label,
                description: nextSelectedNode.description,
              },
            }
          : node,
      ),
    );
  };

  const updateSelectedNodeConfig = (config: WorkflowCanvasNode["config"]) => {
    updateSelectedNode((node) => ({
      ...node,
      config,
    }));
  };

  const onNodeChanges = (changes: NodeChange<AutomationFlowNode>[]) => {
    setCanvasNodes((current) => {
      const next = applyNodeChanges<AutomationFlowNode>(changes, current);
      syncCanvasIntoDefinition(next);
      return next;
    });
  };

  const onEdgeChanges = (changes: Parameters<typeof applyEdgeChanges>[0]) => {
    setCanvasEdges((current) => {
      const next = applyEdgeChanges(changes, current);

      setDefinitionEdges(
        next.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: typeof edge.label === "string" ? edge.label : undefined,
        })),
      );

      return next;
    });
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
    let nodeIndex = definitionNodes.length + 1;
    let id = `${nodeType}_${nodeIndex}`;

    while (definitionNodes.some((node) => node.id === id)) {
      nodeIndex += 1;
      id = `${nodeType}_${nodeIndex}`;
    }

    const newNode: WorkflowCanvasNode = {
      ...template,
      id,
      position: {
        x: 100 + (definitionNodes.length % 3) * 160,
        y: 100 + (definitionNodes.length % 4) * 120,
      },
      config: getDefaultConfig(nodeType),
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

  const postWorkflowAction = async (action: WorkflowAction) => {
    if (action === "test-run") {
      setTestRunStatus("RUNNING");
      setStatusMessage("Dispatching test run...");
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          definition: currentDefinition,
        }),
      });

      const body = await readWorkflowActionResponse(response);

      if (response.ok) {
        const nextVersion =
          body.data?.versionNumber ?? body.data?.version ?? currentVersion;

        if (action === "publish") {
          setCurrentVersion(nextVersion);
          setPublishedVersions((current) =>
            current.includes(nextVersion) ? current : [nextVersion, ...current],
          );
        }

        if (action === "test-run") {
          setTestRunStatus("SUCCESS");
          setStatusMessage(body.message ?? "Test run succeeded.");
        } else if (action === "activate") {
          setStatusMessage(body.message ?? "Draft saved.");
        } else {
          setStatusMessage(body.message ?? "Action completed.");
        }

        return;
      }

      if (action === "test-run") {
        setTestRunStatus("FAILED");
      }

      setStatusMessage(body.error ?? `Request failed with status ${response.status}.`);
    } catch {
      if (action === "test-run") {
        setTestRunStatus("FAILED");
      }

      setStatusMessage("Workflow action failed. Try again.");
    }
  };

  const renderConfigFields = () => {
    if (!selectedNode) {
      return null;
    }

    const inputClassName =
      "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-3 text-sm outline-none";
    const textareaClassName = `${inputClassName} min-h-28 resize-y`;
    const labelClassName =
      "text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]";

    switch (selectedNode.nodeType) {
      case "httpRequest": {
        const config = selectedNode.config as HttpRequestConfig;

        return (
          <>
            <label className="block">
              <span className={labelClassName}>URL</span>
              <input
                value={config.url}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    url: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Method</span>
              <select
                value={config.method}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    method: event.target.value as HttpRequestConfig["method"],
                  })
                }
                className={inputClassName}
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClassName}>Body template</span>
              <textarea
                rows={4}
                value={config.bodyTemplate}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    bodyTemplate: event.target.value,
                  })
                }
                className={textareaClassName}
              />
            </label>
          </>
        );
      }
      case "webhookTrigger": {
        const config = selectedNode.config as WebhookTriggerConfig;

        return (
          <>
            <label className="block">
              <span className={labelClassName}>Source</span>
              <input
                value={config.source}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    source: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Webhook path</span>
              <input
                value={config.path}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    path: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
          </>
        );
      }
      case "scheduleTrigger": {
        const config = selectedNode.config as ScheduleTriggerConfig;

        return (
          <>
            <label className="block">
              <span className={labelClassName}>Cron</span>
              <input
                value={config.cron}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    cron: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Timezone</span>
              <input
                value={config.timezone}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    timezone: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
          </>
        );
      }
      case "slackMessage": {
        const config = selectedNode.config as SlackMessageConfig;

        return (
          <>
            <label className="block">
              <span className={labelClassName}>Channel</span>
              <input
                value={config.channel}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    channel: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Message</span>
              <textarea
                rows={4}
                value={config.messageTemplate}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    messageTemplate: event.target.value,
                  })
                }
                className={textareaClassName}
              />
            </label>
          </>
        );
      }
      case "branch": {
        const config = selectedNode.config as BranchConfig;

        return (
          <label className="block">
            <span className={labelClassName}>Expression</span>
            <textarea
              rows={4}
              value={config.expression}
              onChange={(event) =>
                updateSelectedNodeConfig({
                  ...config,
                  expression: event.target.value,
                })
              }
              className={textareaClassName}
            />
          </label>
        );
      }
      case "loop": {
        const config = selectedNode.config as LoopConfig;

        return (
          <>
            <label className="block">
              <span className={labelClassName}>Iterate on</span>
              <input
                value={config.iterateOn}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    iterateOn: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Item alias</span>
              <input
                value={config.itemAlias}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    itemAlias: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
          </>
        );
      }
      case "googleSheetsAppend": {
        const config = selectedNode.config as GoogleSheetsAppendConfig;

        return (
          <>
            <label className="block">
              <span className={labelClassName}>Spreadsheet ID</span>
              <input
                value={config.spreadsheetId}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    spreadsheetId: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Sheet name</span>
              <input
                value={config.sheetName}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    sheetName: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
          </>
        );
      }
      case "notionCreatePage": {
        const config = selectedNode.config as NotionCreatePageConfig;

        return (
          <label className="block">
            <span className={labelClassName}>Database ID</span>
            <input
              value={config.databaseId}
              onChange={(event) =>
                updateSelectedNodeConfig({
                  ...config,
                  databaseId: event.target.value,
                })
              }
              className={inputClassName}
            />
          </label>
        );
      }
      case "airtableCreateRecord": {
        const config = selectedNode.config as AirtableCreateRecordConfig;

        return (
          <>
            <label className="block">
              <span className={labelClassName}>Base ID</span>
              <input
                value={config.baseId}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    baseId: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Table ID</span>
              <input
                value={config.tableId}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    tableId: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
          </>
        );
      }
      case "hubspotCreateRecord": {
        const config = selectedNode.config as HubspotCreateRecordConfig;

        return (
          <>
            <label className="block">
              <span className={labelClassName}>Object type</span>
              <select
                value={config.objectType}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    objectType: event.target.value as HubspotCreateRecordConfig["objectType"],
                  })
                }
                className={inputClassName}
              >
                {["contact", "company", "deal"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClassName}>Pipeline ID</span>
              <input
                value={config.pipelineId}
                onChange={(event) =>
                  updateSelectedNodeConfig({
                    ...config,
                    pipelineId: event.target.value,
                  })
                }
                className={inputClassName}
              />
            </label>
          </>
        );
      }
      default:
        return (
          <p className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-3 text-sm text-[color:var(--muted)]">
            This node uses generated defaults. Save or publish to keep the internal config.
          </p>
        );
    }
  };

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="min-w-0 overflow-hidden p-4 xl:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--line)] px-2 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Canvas
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
              Visual workflow builder
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="info">v{currentVersion}</Badge>
              <Badge variant="warning">Draft</Badge>
              <Badge variant={getTestRunBadgeVariant(testRunStatus)}>
                {testRunStatus}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  await postWorkflowAction("activate");
                });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent)]"
            >
              <Save className="size-4" />
              Save
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
          </div>
        </div>

        <div className="mt-4 h-[680px] min-w-0 overflow-hidden rounded-[24px] border border-[color:var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(247,241,231,0.9))]">
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

      <div className="min-w-0 space-y-5 xl:w-[360px]">
        <Card className="min-w-0 overflow-hidden p-5">
          <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] px-3 py-2">
            <Search className="size-4 text-[color:var(--muted)]" />
            <input
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              placeholder="Search node palette"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--muted)]"
            />
          </div>
          <div className="mt-4 max-h-[420px] overflow-y-auto pr-1">
            <div className="grid gap-2">
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
          </div>
        </Card>

        <Card className="min-w-0 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Versions
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                Published history
              </h2>
            </div>
            <Badge variant="info">{publishedVersions.length} versions</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {publishedVersions.map((version) => (
              <Badge key={version} variant={version === currentVersion ? "success" : "default"}>
                v{version}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="min-w-0 p-5">
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
                  value={selectedNode.label ?? ""}
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

              {renderConfigFields()}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
              Click any node on the canvas to inspect or edit it.
            </p>
          )}
        </Card>

        <Card className="min-w-0 overflow-hidden p-5">
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
          <pre className="mt-4 max-h-80 min-w-0 overflow-auto rounded-[24px] bg-[color:#111b18] p-4 font-mono text-[11px] leading-6 whitespace-pre-wrap break-all text-white">
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
