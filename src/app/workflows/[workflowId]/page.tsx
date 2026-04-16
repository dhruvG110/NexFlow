import Link from "next/link";
import { ArrowLeft, Code2 } from "lucide-react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { WorkflowEditor } from "@/components/workflow/workflow-editor";
import { Badge } from "@/components/ui/badge";
import { getWorkflowById, getWorkflowSummaries } from "@/lib/data/repository";

type WorkflowPageProps = {
  params: Promise<{
    workflowId: string;
  }>;
};

export default async function WorkflowDetailPage({
  params,
}: WorkflowPageProps) {
  const { workflowId } = await params;
  const [workflows, definition] = await Promise.all([
    getWorkflowSummaries(),
    getWorkflowById(workflowId),
  ]);

  const workflow = workflows.find((item) => item.id === workflowId);

  if (!workflow) {
    notFound();
  }

  return (
    <AppShell
      eyebrow="Workflow Editor"
      title={workflow.name}
      description="Use the visual canvas to tune node metadata, inspect the compiled DSL, and test-publish the workflow through the managed execution contract."
      actions={
        <>
          <Link
            href="/workflows"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <Badge variant="info">
            <span className="inline-flex items-center gap-2">
              <Code2 className="size-3.5" />
              Version {workflow.version}
            </span>
          </Badge>
        </>
      }
    >
      <WorkflowEditor workflowId={workflow.id} initialDefinition={definition} />
    </AppShell>
  );
}
