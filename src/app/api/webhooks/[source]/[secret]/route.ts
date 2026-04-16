import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/auth/session";
import { buildWebhookReceipt, dispatchWorkflowRun } from "@/lib/runtime/orchestration";
import { sampleWorkflowDefinition } from "@/lib/data/demo-data";

type RouteContext = {
  params: Promise<{
    source: string;
    secret: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { source, secret } = await context.params;
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const session = await getAppSession();

  const receipt = buildWebhookReceipt({
    source,
    secret,
    payload,
    triggerSource: "WEBHOOK",
  });

  const dispatched = await dispatchWorkflowRun({
    organizationId: session.organizationId,
    actorId: session.userId,
    actorEmail: session.email,
    workflowDefinition: sampleWorkflowDefinition,
    workflowVersionId: "wfver_demo",
    input: payload,
  });

  return NextResponse.json({
    ok: true,
    message: `Accepted webhook for ${source} and queued ${dispatched.run.id}.`,
    data: {
      receipt,
      dispatched,
    },
  });
}
