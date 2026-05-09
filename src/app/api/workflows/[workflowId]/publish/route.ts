import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/auth/session";
import {
  getWorkflowById,
  publishWorkflow,
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
    const published = await publishWorkflow(workflowId, definition, {
      id: session.userId,
      email: session.email,
    });

    return NextResponse.json({
      ok: true,
      message: `Published version ${published.versionNumber} for ${definition.name}.`,
      data: published,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to publish workflow",
      },
      { status: 500 },
    );
  }
}
