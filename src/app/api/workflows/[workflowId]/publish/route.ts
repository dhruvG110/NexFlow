import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/auth/session";
import { getWorkflowById } from "@/lib/data/repository";
import { publishDraftVersion } from "@/lib/workflow/service";
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
  const published = publishDraftVersion({
    workflowId,
    currentVersionNumber: definition.version,
    actorId: session.userId,
    actorEmail: session.email,
    definition,
  });

  return NextResponse.json({
    ok: true,
    message: `Published version ${published.versionNumber} for ${definition.name}.`,
    data: published,
  });
}
