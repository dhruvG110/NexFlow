import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/auth/session";
import {
  getWorkflowById,
  saveWorkflowDraft,
} from "@/lib/data/repository";
import type { WorkflowDefinition } from "@/lib/workflow/types";

type RouteContext = {
  params: Promise<{
    workflowId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { workflowId } = await context.params;
  const session = await getAppSession();
  const body = (await request.json().catch(() => ({}))) as {
    definition?: WorkflowDefinition;
  };
  const definition = body.definition ?? (await getWorkflowById(workflowId));

  if (!definition) {
    return NextResponse.json(
      {
        ok: false,
        error: "Workflow not found",
      },
      { status: 404 },
    );
  }

  try {
    const draft = await saveWorkflowDraft(
      workflowId,
      definition,
      session.userId,
    );

    return NextResponse.json({
      ok: true,
      message: "Draft saved.",
      data: {
        workflowId,
        triggerSource: draft.definition.triggerSource,
        version: draft.versionNumber,
        activeVersionId: draft.activeVersionId,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to save draft",
      },
      { status: 500 },
    );
  }
}
