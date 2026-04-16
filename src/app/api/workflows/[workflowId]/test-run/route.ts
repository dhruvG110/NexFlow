import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/auth/session";
import { getWorkflowById } from "@/lib/data/repository";
import { dispatchWorkflowRun } from "@/lib/runtime/orchestration";
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

  const result = await dispatchWorkflowRun({
    organizationId: session.organizationId,
    actorId: session.userId,
    actorEmail: session.email,
    workflowDefinition: definition,
    workflowVersionId: `wfver_${definition.version}`,
    input: {
      accountId: "acct_123",
      accountName: "Northwind Labs",
      eventType: "customer.created",
      plan: "enterprise",
      contacts: [
        { company: "Northwind Labs", arr: 24000 },
        { company: "Northwind Labs", arr: 18000 },
      ],
    },
  });

  return NextResponse.json({
    ok: true,
    message: `Queued test run ${result.run.id} using ${result.dispatch.provider}.`,
    data: result,
  });
}
