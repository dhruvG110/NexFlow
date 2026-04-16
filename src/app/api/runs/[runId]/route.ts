import { NextResponse } from "next/server";

import { getWorkflowRunById } from "@/lib/data/repository";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { runId } = await context.params;
  const run = await getWorkflowRunById(runId);

  if (!run) {
    return NextResponse.json(
      {
        ok: false,
        error: "Run not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: run,
  });
}
