import { NextResponse } from "next/server";

import { getWorkflowById } from "@/lib/data/repository";

type RouteContext = {
  params: Promise<{
    workflowId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { workflowId } = await context.params;
  const workflow = await getWorkflowById(workflowId);

  return NextResponse.json({
    ok: true,
    message: `Workflow ${workflow.name} is now marked active for ${workflow.triggerSource.toLowerCase()} triggers.`,
    data: {
      workflowId,
      triggerSource: workflow.triggerSource,
      version: workflow.version,
    },
  });
}
