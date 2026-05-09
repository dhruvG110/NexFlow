import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/auth/session";
import { getExecutionWorkflowById } from "@/lib/data/repository";
import { dispatchWorkflowRun } from "@/lib/runtime/orchestration";

type RouteContext = {
  params: Promise<{
    workflowId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { workflowId } = await context.params;
    const session = await getAppSession();
    await request.json().catch(() => ({}));
    const definition = await getExecutionWorkflowById(workflowId);

    if (!definition) {
      return NextResponse.json(
        {
          ok: false,
          error: "No active workflow version found",
        },
        { status: 404 },
      );
    }

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
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to queue workflow run",
      },
      { status: 500 },
    );
  }
}
